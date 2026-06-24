import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const Counter = require('../../../../models/Counter');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized. Only doctors can recall patients.' }, { status: 403 });
    }

    const { patientId, patientName, doctorId, doctorName, testType } = await req.json();

    if (!patientId || !patientName || !doctorId) {
      return NextResponse.json({ error: 'Missing required patient or doctor details' }, { status: 400 });
    }

    // Generate a new token for today
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `doctor_${doctorId}_${today}`;
    const tokenNumber = await Counter.getNextSequence(counterKey);

    // Create the high-priority recall appointment
    const appointment = await Appointment.create({
      patientId,
      patientName,
      doctorId,
      doctorName: doctorName || session.name,
      tokenNumber,
      date: today,
      timeSlot: 'Lab Review',
      triageData: {
        symptoms: `Post-Lab Review for ${testType || 'Recent Scans'}`,
        severity: 'High',
        aiAdvice: 'Doctor initiated recall after reviewing laboratory findings.'
      },
      status: 'waiting',
      priority: 1 // High priority so they jump the queue
    });

    await writeLog(
      'Patient Recalled',
      `Recalled ${patientName} to active queue after reviewing ${testType || 'lab reports'}. Token #${tokenNumber}`,
      session._id,
      session.role
    );

    // Broadcast the update so the queue refreshes everywhere
    broadcastEvent('queue_updated', { doctorId, date: today });

    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    console.error('Error recalling patient:', err);
    return NextResponse.json({ error: 'Server error recalling patient' }, { status: 500 });
  }
}
