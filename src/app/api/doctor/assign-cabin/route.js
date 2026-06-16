import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { doctorId, newCabin } = await request.json();

    if (!doctorId || !newCabin) {
      return NextResponse.json({ success: false, error: 'Doctor ID and new cabin number are required' }, { status: 400 });
    }

    const doctorsPath = path.join(process.cwd(), 'data', 'db', 'doctors.json');
    const doctors = JSON.parse(fs.readFileSync(doctorsPath, 'utf8'));

    const docIndex = doctors.findIndex(d => d._id === doctorId);
    if (docIndex === -1) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    doctors[docIndex].cabin = newCabin;
    // Keep 'room' in sync just in case other parts of the app rely on it temporarily
    doctors[docIndex].room = newCabin; 

    fs.writeFileSync(doctorsPath, JSON.stringify(doctors, null, 2));

    return NextResponse.json({ success: true, message: 'Cabin updated successfully' });
  } catch (error) {
    console.error('Error updating doctor cabin:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
