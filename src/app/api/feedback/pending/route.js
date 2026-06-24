import { NextResponse } from 'next/server';
import { getCollection } from '../../../../server-utils/jsonDb';
import { verifySession } from '../../../../server-utils/auth';

export const dynamic = 'force-dynamic';

// Force recompile
export async function GET(req) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apptDb = getCollection('appointment');
    const ratingsDb = getCollection('doctor_rating');

    console.log(`[DEBUG] filePath: ${apptDb.filePath}`);
    // Get all completed/discharged appointments for this patient
    const myAppts = await apptDb.find({ patientId: session._id, status: { $in: ['completed', 'discharged'] } });
    
    // Get all ratings
    const existingRatings = await ratingsDb.find({});
    
    // Map of rated appointment IDs
    const ratedIds = new Set(existingRatings.map(r => r.appointment_id));

    // Filter appointments that don't have a rating yet
    const pending = myAppts.filter(a => !ratedIds.has(a._id));

    console.log(`[DEBUG] Pending route called by ${session._id}`);
    console.log(`[DEBUG] Found ${myAppts.length} myAppts, ${existingRatings.length} existingRatings, ${pending.length} pending.`);
    if (myAppts.length === 0) {
      console.log(`[DEBUG] All appts:`, await apptDb.find({ patientId: session._id }));
    }

    return NextResponse.json({ success: true, pending });
  } catch (error) {
    console.error('Pending feedback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
