import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Doctor = require('../../../../models/Doctor');
const Appointment = require('../../../../models/Appointment');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized. Doctor session required.' }, { status: 403 });
    }

    const doctor = await Doctor.findOne({ userId: session._id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.find({ doctorId: doctor._id, date: today });

    // Custom sort:
    // 1. 'calling' status first
    // 2. 'waiting' status, sorted by priority descending, then tokenNumber ascending
    // 3. 'completed' / 'cancelled' status at the end
    const sorted = appointments.sort((a, b) => {
      const statusOrder = { calling: 0, waiting: 1, completed: 2, cancelled: 3 };
      const orderA = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 99;
      const orderB = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 99;

      if (orderA !== orderB) return orderA - orderB;

      // For waiting patients, prioritize higher priority and lower token numbers
      if (a.status === 'waiting' && b.status === 'waiting') {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.tokenNumber - b.tokenNumber;
      }

      // Default sort by token number
      return a.tokenNumber - b.tokenNumber;
    });

    return NextResponse.json({ success: true, appointments: sorted, doctor });
  } catch (err) {
    console.error('Fetch doctor patients error:', err);
    return NextResponse.json({ error: 'Server error retrieving patients queue' }, { status: 500 });
  }
}
