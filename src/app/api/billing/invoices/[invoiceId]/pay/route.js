import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../../server-utils/db');
const Invoice = require('../../../../../../models/Invoice');
const { verifySession } = require('../../../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../../../server-utils/socket');
const { writeLog } = require('../../../../../../server-utils/logger');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    // Allow patient (to self-pay) or billing staff to record payment
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await params;
    const { paymentMethod } = await req.json();

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Missing paymentMethod' }, { status: 400 });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (session.role === 'patient' && invoice.patientId !== session._id) {
      return NextResponse.json({ error: 'Unauthorized to pay another patient\'s invoice' }, { status: 403 });
    }

    const updated = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'paid', paymentMethod },
      { new: true }
    );

    await writeLog(
      'Invoice Payment Recorded',
      `${session.role === 'billing' ? 'Billing Staff' : 'Patient'} ${session.name} settled invoice ₹${invoice.amount} for patient ${invoice.patientName} via ${paymentMethod} | Invoice ID: ${invoiceId}`,
      session._id,
      session.role
    );

    // Broadcast update
    broadcastEvent('billing_updated');
    broadcastEvent('invoice_paid', { invoiceId, patientId: invoice.patientId });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err) {
    console.error('Invoice pay API error:', err);
    return NextResponse.json({ error: 'Server error processing payment' }, { status: 500 });
  }
}
