import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../server-utils/db');
const Prescription = require('../../../../../models/Prescription');
const { verifySession } = require('../../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../../server-utils/socket');
const { writeLog } = require('../../../../../server-utils/logger');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'pharmacy') {
      return NextResponse.json({ error: 'Unauthorized. Pharmacist session required.' }, { status: 403 });
    }

    const { prescriptionId } = await params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const updated = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { status: 'dispensed' },
      { new: true }
    );

    await writeLog(
      'Medicines Packaged',
      `Pharmacist dispensed medications to patient ${prescription.patientName} for prescription: ${prescriptionId}`,
      session._id,
      session.role
    );

    // Broadcast update
    broadcastEvent('pharmacy_updated');
    broadcastEvent('prescription_dispensed', { prescriptionId, patientId: prescription.patientId });

    return NextResponse.json({ success: true, prescription: updated });
  } catch (err) {
    console.error('Dispense prescription API error:', err);
    return NextResponse.json({ error: 'Server error dispensing prescription' }, { status: 500 });
  }
}
