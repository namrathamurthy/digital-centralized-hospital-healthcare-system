import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../server-utils/db');
const Appointment = require('../../../../../models/Appointment');
const { verifySession } = require('../../../../../server-utils/auth');
const { scheduleReminders } = require('../../../../../server-utils/reminderService');
const { writeLog } = require('../../../../../server-utils/logger');
const { broadcastEvent } = require('../../../../../server-utils/socket');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { appointmentId } = await params;
    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Mark as discharged
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'discharged' });

    // Schedule AI Follow-up Reminders NOW that they have their medicine and paid!
    scheduleReminders(appointmentId);

    await writeLog(
      'Consultation Finalized',
      `Dr. ${appointment.doctorName} fully discharged patient: ${appointment.patientName} and AI Reminders have been scheduled.`,
      session._id,
      session.role
    );

    // Broadcast system changes
    broadcastEvent('queue_updated', { doctorId: appointment.doctorId, date: appointment.date });

    return NextResponse.json({ success: true, message: 'Patient discharged and reminders scheduled.' });
  } catch (err) {
    console.error('Doctor discharge error:', err);
    return NextResponse.json({ error: 'Server error discharging patient' }, { status: 500 });
  }
}
