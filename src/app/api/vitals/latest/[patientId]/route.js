import { NextResponse } from 'next/server';
import { getCollection } from '../../../../../server-utils/jsonDb';
import { verifySession } from '../../../../../server-utils/auth';

export async function GET(req, { params }) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { patientId } = await params;
    const latestDb = getCollection('health_latest');
    const latestObj = await latestDb.findOne({ patient_id: patientId });

    if (!latestObj || !latestObj.vitals) {
      return NextResponse.json({ success: false, vitals: null });
    }

    return NextResponse.json({ success: true, vitals: latestObj.vitals });
  } catch (err) {
    console.error('Error fetching latest vitals:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
