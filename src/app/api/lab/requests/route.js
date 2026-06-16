import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const LabRequest = require('../../../../models/LabRequest');
const Doctor = require('../../../../models/Doctor');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = {};
    if (session.role === 'patient') {
      query = { patientId: session._id };
    } else if (session.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session._id });
      if (doctor) {
        query = { doctorId: doctor._id };
      } else {
        query = { doctorId: session._id }; // Fallback
      }
    }
    const requests = await LabRequest.find(query);

    // Sort newer first
    const sorted = requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ success: true, requests: sorted });
  } catch (err) {
    console.error('Lab requests GET error:', err);
    return NextResponse.json({ error: 'Server error fetching lab requests' }, { status: 500 });
  }
}
