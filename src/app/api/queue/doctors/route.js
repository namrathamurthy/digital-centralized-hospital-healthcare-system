import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Doctor = require('../../../../models/Doctor');
const Appointment = require('../../../../models/Appointment');

export async function GET(req) {
  await connectDB();
  try {
    const doctors = await Doctor.find({ status: 'active' });
    const today = new Date().toISOString().split('T')[0];

    const doctorsWithQueue = await Promise.all(doctors.map(async (doc) => {
      // Count waiting or calling appointments for this doctor today
      const queueCount = await Appointment.countDocuments({
        doctorId: doc._id,
        date: today,
        status: { $in: ['waiting', 'calling'] }
      });

      return {
        _id: doc._id,
        name: doc.name,
        department: doc.department,
        room: doc.room,
        currentToken: doc.currentToken || 0,
        queueCount
      };
    }));

    return NextResponse.json({ success: true, doctors: doctorsWithQueue });
  } catch (err) {
    console.error('Fetch doctors error:', err);
    return NextResponse.json({ error: 'Server error fetching doctors' }, { status: 500 });
  }
}
