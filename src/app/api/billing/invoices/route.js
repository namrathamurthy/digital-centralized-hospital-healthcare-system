import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Invoice = require('../../../../models/Invoice');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Filter: patients only see their own billing history. Staff see everything.
    const query = session.role === 'patient' ? { patientId: session._id } : {};
    const invoices = await Invoice.find(query);

    // Sort newer invoices first
    const sorted = invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ success: true, invoices: sorted });
  } catch (err) {
    console.error('Billing GET error:', err);
    return NextResponse.json({ error: 'Server error retrieving statements' }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'billing') {
      return NextResponse.json({ error: 'Unauthorized. Billing role required.' }, { status: 403 });
    }

    const { patientId, patientName, amount, description } = await req.json();

    if (!patientId || !patientName || !amount || !description) {
      return NextResponse.json({ error: 'Missing required billing attributes' }, { status: 400 });
    }

    const invoice = await Invoice.create({
      appointmentId: 'manual_' + Date.now().toString(36),
      patientId,
      patientName,
      amount: Number(amount),
      description,
      status: 'pending'
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err) {
    console.error('Billing POST error:', err);
    return NextResponse.json({ error: 'Server error generating invoice' }, { status: 500 });
  }
}
