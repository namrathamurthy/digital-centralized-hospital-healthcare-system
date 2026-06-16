import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Prescription = require('../../../../models/Prescription');
const Invoice = require('../../../../models/Invoice');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Patient views their own prescription orders, pharmacist views all orders
    const query = session.role === 'patient' ? { patientId: session._id } : {};
    const prescriptions = await Prescription.find(query);

    const enriched = await Promise.all(prescriptions.map(async (rx) => {
      const rxData = rx.toObject ? rx.toObject() : rx;
      const invoice = await Invoice.findOne({ appointmentId: rx.appointmentId });
      return {
        ...rxData,
        invoiceStatus: invoice ? invoice.status : 'pending'
      };
    }));

    // Sort descending by date
    const sorted = enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ success: true, prescriptions: sorted });
  } catch (err) {
    console.error('Prescriptions GET error:', err);
    return NextResponse.json({ error: 'Server error retrieving prescriptions list' }, { status: 500 });
  }
}
