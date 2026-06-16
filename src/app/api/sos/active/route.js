import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const SOSAlert = require('../../../../models/SOSAlert');

export async function GET(req) {
  await connectDB();
  try {
    // Return all un-dismissed emergency alerts
    const alerts = await SOSAlert.find({ status: 'active' });
    return NextResponse.json({ success: true, alerts });
  } catch (err) {
    console.error('Active SOS GET error:', err);
    return NextResponse.json({ error: 'Server error fetching active emergency alarms' }, { status: 500 });
  }
}
