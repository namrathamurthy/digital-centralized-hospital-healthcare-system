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
    const body = await req.json();
    const { doctorId, date, timeSlot, triageData, patientId, patientName } = body;

    let finalPatientId = patientId;
    let finalPatientName = patientName;

    if (session && session.role === 'patient') {
      finalPatientId = session._id;
      finalPatientName = session.name;
    }

    if (!finalPatientId || !finalPatientName || !doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing appointment details (patient, doctor, date, timeslot)' }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const counterKey = `doctor_${doctorId}_${date}`;
    const tokenNumber = await Counter.getNextSequence(counterKey);

    const appointment = await Appointment.create({
      patientId: finalPatientId,
      patientName: finalPatientName,
      doctorId,
      doctorName: doctor.name,
      tokenNumber,
      date,
      timeSlot,
      triageData: triageData || { symptoms: 'N/A', severity: 'Low', aiAdvice: 'N/A' },
      status: 'waiting',
      priority: 0
    });

    await writeLog(
      'Appointment Booked', 
      `Appointment booked for ${finalPatientName} with Dr. ${doctor.name}. Token #${tokenNumber}`, 
      finalPatientId, 
      session?.role || 'patient'
    );

    // Notify doctor and public queue monitors
    broadcastEvent('queue_updated', { doctorId, date });

    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    console.error('Book appointment error:', err);
    return NextResponse.json({ error: 'Server error scheduling appointment' }, { status: 500 });
  }
}
