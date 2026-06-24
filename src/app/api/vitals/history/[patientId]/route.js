import { NextResponse } from 'next/server';
import { getCollection } from '../../../../../server-utils/jsonDb';
import { verifySession } from '../../../../../server-utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const session = await verifySession(req);
    const { patientId } = await params;

    // Both the patient themselves and any doctor can view the history
    if (!session || (session.role !== 'doctor' && session._id !== patientId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const healthDb = getCollection('health_reading');
    const readings = await healthDb.find({ patient_id: patientId });

    if (!readings || readings.length === 0) {
      return NextResponse.json({ success: true, history: [] });
    }

    // Sort readings by recorded_at ascending
    const sortedReadings = readings.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

    // Group by date to make it easy for Recharts
    // Desired shape: [ { date: 'Jun 12', heart_rate: 75, spo2: 98, steps: 5000, sleep_hours: 7 }, ... ]
    const historyMap = {};

    for (const r of sortedReadings) {
      // Use the recorded_at date directly but ensure it respects the patient's intended day
      const dateObj = new Date(r.recorded_at);
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!historyMap[dateLabel]) {
        historyMap[dateLabel] = { date: dateLabel };
      }
      
      // Always update fullDate so it represents the very latest timestamp for this date
      historyMap[dateLabel].fullDate = r.recorded_at;

      // Assign the metric value. (If multiple per day exist, this takes the latest due to sorting)
      historyMap[dateLabel][r.metric] = r.value;
    }

    const historyData = Object.values(historyMap);

    return NextResponse.json({ success: true, history: historyData });
  } catch (err) {
    console.error('Error fetching vitals history:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
