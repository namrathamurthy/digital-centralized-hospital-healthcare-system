import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Patients see only their own appointments. Staff see all appointments.
    const query = session.role === 'patient' ? { patientId: session._id } : {};
    const appointments = await Appointment.find(query);

    // Sort by date descending, then by token number ascending
    const sorted = appointments.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return a.tokenNumber - b.tokenNumber;
    });

    return NextResponse.json({ success: true, appointments: sorted });
  } catch (err) {
    console.error('My appointments API error:', err);
    return NextResponse.json({ error: 'Server error retrieving appointments' }, { status: 500 });
  }
}
