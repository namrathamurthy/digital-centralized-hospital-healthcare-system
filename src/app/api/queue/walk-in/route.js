import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const Doctor = require('../../../../models/Doctor');
const Counter = require('../../../../models/Counter');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || (session.role !== 'receptionist' && session.role !== 'doctor')) {
      return NextResponse.json({ error: 'Unauthorized. Only receptionists or doctors can book walk-ins.' }, { status: 403 });
    }

    const { patientName, doctorId, symptoms, severity, aiAdvice } = await req.json();

    if (!patientName || !doctorId) {
      return NextResponse.json({ error: 'Missing patientName or doctorId' }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const counterKey = `doctor_${doctorId}_${today}`;
    const tokenNumber = await Counter.getNextSequence(counterKey);

    // Determine numerical priority based on severity
    let priority = 0;
    if (severity === 'High') priority = 1;
    if (severity === 'Emergency') priority = 2;

    // Use a placeholder or generated patientId for walk-ins
    const patientId = 'walkin_' + Math.random().toString(36).substring(2, 7);

    const appointment = await Appointment.create({
      patientId,
      patientName,
      doctorId,
      doctorName: doctor.name,
      tokenNumber,
      date: today,
      timeSlot: 'Walk-in',
      triageData: {
        symptoms: symptoms || 'Walk-in Check-in',
        severity: severity || 'Low',
        aiAdvice: aiAdvice || 'Scheduled by receptionist.'
      },
      status: 'waiting',
      priority
    });

    await writeLog(
      'Walk-in Scheduled',
      `Walk-in booked for ${patientName} under Dr. ${doctor.name}. Token #${tokenNumber} [Priority: ${severity || 'Low'}]`,
      session._id,
      session.role
    );

    // Notify doctor dashboard and public queues
    broadcastEvent('queue_updated', { doctorId, date: today });

    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    console.error('Walk-in booking error:', err);
    return NextResponse.json({ error: 'Server error booking walk-in' }, { status: 500 });
  }
}
