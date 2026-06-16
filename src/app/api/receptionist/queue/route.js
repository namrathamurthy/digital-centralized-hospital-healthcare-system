import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'receptionist') {
      return NextResponse.json({ error: 'Unauthorized. Receptionist session required.' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    // Fetch all check-ins registered for today
    const appointments = await Appointment.find({ date: today });

    // Sort: Calling first, then Waiting sorted by priority and token number, then others
    const sorted = appointments.sort((a, b) => {
      const statusMap = { calling: 0, waiting: 1, completed: 2, cancelled: 3 };
      const rankA = statusMap[a.status] !== undefined ? statusMap[a.status] : 99;
      const rankB = statusMap[b.status] !== undefined ? statusMap[b.status] : 99;

      if (rankA !== rankB) return rankA - rankB;

      if (a.status === 'waiting' && b.status === 'waiting') {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.tokenNumber - b.tokenNumber;
      }
      return a.tokenNumber - b.tokenNumber;
    });

    return NextResponse.json({ success: true, appointments: sorted });
  } catch (err) {
    console.error('Receptionist queue API error:', err);
    return NextResponse.json({ error: 'Server error fetching queue list' }, { status: 500 });
  }
}
