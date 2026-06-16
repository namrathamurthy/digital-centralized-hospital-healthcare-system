import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../server-utils/db');
const LabRequest = require('../../../../../models/LabRequest');
const { verifySession } = require('../../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../../server-utils/socket');
const { writeLog } = require('../../../../../server-utils/logger');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'lab') {
      return NextResponse.json({ error: 'Unauthorized. Lab technician session required.' }, { status: 403 });
    }

    const { requestId } = await params;
    const { result, notes, attachmentData, attachmentMimeType, attachmentName } = await req.json();

    if (!result) {
      return NextResponse.json({ error: 'Missing report results' }, { status: 400 });
    }

    const labReq = await LabRequest.findById(requestId);
    if (!labReq) {
      return NextResponse.json({ error: 'Lab request not found' }, { status: 404 });
    }

    const updatedData = { 
      status: 'completed', 
      result, 
      notes: notes || '' 
    };

    if (attachmentData) {
      updatedData.attachmentData = attachmentData;
      updatedData.attachmentMimeType = attachmentMimeType;
      updatedData.attachmentName = attachmentName;
    }

    const updated = await LabRequest.findByIdAndUpdate(
      requestId,
      updatedData,
      { new: true }
    );

    await writeLog(
      'Lab Results Uploaded',
      `Technician uploaded report for ${labReq.patientName} (${labReq.testType})`,
      session._id,
      session.role
    );

    // Broadcast update
    broadcastEvent('lab_updated');
    broadcastEvent('lab_completed', { requestId, patientId: labReq.patientId });

    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    console.error('Update lab report error:', err);
    return NextResponse.json({ error: 'Server error saving lab results' }, { status: 500 });
  }
}
