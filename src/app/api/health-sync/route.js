import { NextResponse } from 'next/server';
import { getCollection } from '../../../server-utils/jsonDb';
import { verifySession } from '../../../server-utils/auth';

export async function POST(req) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { patientId, readings } = await req.json();

    if (session._id !== patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const healthDb = getCollection('health_reading');

    // Basic bulk insert with primitive duplicate avoidance
    let syncedCount = 0;
    for (const r of readings) {
      // Check if already synced (naive check for JSON DB)
      const existing = await healthDb.findOne({
        patient_id: patientId,
        metric: r.metric,
        recorded_at: r.recorded_at
      });
      
      if (!existing) {
        await healthDb.create({
          patient_id: patientId,
          source: r.source,
          metric: r.metric,
          value: r.value,
          unit: r.unit,
          recorded_at: r.recorded_at,
          synced_at: new Date().toISOString()
        });
        syncedCount++;
      }
    }

    // Save a "latest" snapshot for ultra-fast dashboard rendering
    // (This mimics the Redis cache in the user's design)
    const latestDb = getCollection('health_latest');
    const latestObj = await latestDb.findOne({ patient_id: patientId }) || { patient_id: patientId, vitals: {} };
    
    for (const r of readings) {
      if (!latestObj.vitals[r.metric] || new Date(r.recorded_at) > new Date(latestObj.vitals[r.metric].recorded_at)) {
        latestObj.vitals[r.metric] = r;
      }
    }

    if (latestObj._id) {
      await latestDb.findByIdAndUpdate(latestObj._id, { vitals: latestObj.vitals });
    } else {
      await latestDb.create(latestObj);
    }

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (err) {
    console.error('Error syncing health data:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
