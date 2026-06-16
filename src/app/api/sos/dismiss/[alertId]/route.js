import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../server-utils/db');
const SOSAlert = require('../../../../../models/SOSAlert');
const { verifySession } = require('../../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../../server-utils/socket');
const { writeLog } = require('../../../../../server-utils/logger');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role === 'patient') {
      return NextResponse.json({ error: 'Unauthorized. Hospital staff session required.' }, { status: 403 });
    }

    const { alertId } = await params;

    const alert = await SOSAlert.findById(alertId);
    if (!alert) {
      return NextResponse.json({ error: 'SOS alert record not found' }, { status: 404 });
    }

    const updated = await SOSAlert.findByIdAndUpdate(
      alertId,
      { status: 'dismissed', dismissedBy: session._id },
      { new: true }
    );

    await writeLog(
      'SOS Alert Dismissed',
      `SOS Alert for patient ${alert.patientName} dismissed by responder ${session.name}`,
      session._id,
      session.role
    );

    // Broadcast event to dismiss alert overlay on dashboards
    broadcastEvent('sos_dismissed', { alertId });

    return NextResponse.json({ success: true, alert: updated });
  } catch (err) {
    console.error('Dismiss SOS API error:', err);
    return NextResponse.json({ error: 'Server error dismissing emergency alert' }, { status: 500 });
  }
}
