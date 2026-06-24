import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Appointment = require('../../../../models/Appointment');
const Invoice = require('../../../../models/Invoice');
const Prescription = require('../../../../models/Prescription');
const LabRequest = require('../../../../models/LabRequest');
const Doctor = require('../../../../models/Doctor');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const doctor = await Doctor.findOne({ userId: session._id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Find all completed appointments for this doctor today
    const today = new Date().toISOString().split('T')[0];
    const completedAppointments = await Appointment.find({
      doctorId: doctor._id.toString(),
      status: 'completed',
      date: today
    });

    const readyForDischarge = [];

    for (const appt of completedAppointments) {
      // 1. If there are Lab Requests, this appointment is NOT ready for discharge.
      // (The doctor will recall the patient when the lab is done, creating a NEW appointment to discharge).
      const labs = await LabRequest.find({ appointmentId: appt._id.toString() });
      if (labs && labs.length > 0) {
        continue;
      }

      // 2. Check if Invoice is paid
      const invoice = await Invoice.findOne({ appointmentId: appt._id.toString() });
      if (invoice && invoice.status !== 'paid') {
        continue; // Still pending payment
      }

      // 3. Check if Prescriptions are dispensed
      const prescriptions = await Prescription.find({ appointmentId: appt._id.toString() });
      let allDispensed = true;
      for (const rx of prescriptions) {
        if (rx.status !== 'dispensed') {
          allDispensed = false;
          break;
        }
      }
      if (!allDispensed) {
        continue; // Still waiting at pharmacy
      }

      // If it passes all checks, it's ready for discharge!
      readyForDischarge.push(appt);
    }

    return NextResponse.json({ success: true, appointments: readyForDischarge });
  } catch (err) {
    console.error('Error fetching ready for discharge:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
