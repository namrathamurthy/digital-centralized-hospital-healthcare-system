import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || (session.role !== 'receptionist' && session.role !== 'doctor')) {
      return NextResponse.json({ error: 'Unauthorized. Staff permissions required.' }, { status: 403 });
    }

    const { appointmentId, priority } = await req.json();
    if (!appointmentId || priority === undefined) {
      return NextResponse.json({ error: 'Missing appointmentId or priority level' }, { status: 400 });
    }

    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const prevPriority = appt.priority;
    const updatedAppt = await Appointment.findByIdAndUpdate(appointmentId, { priority: Number(priority) }, { new: true });

    await writeLog(
      'Appointment Prioritized',
      `Changed priority of patient ${appt.patientName} from ${prevPriority} to ${priority}`,
      session._id,
      session.role
    );

    // Broadcast update to doctor's queue
    broadcastEvent('queue_updated', { doctorId: appt.doctorId, date: appt.date });

    return NextResponse.json({ success: true, appointment: updatedAppt });
  } catch (err) {
    console.error('Prioritization API error:', err);
    return NextResponse.json({ error: 'Server error modifying priority' }, { status: 500 });
  }
}
