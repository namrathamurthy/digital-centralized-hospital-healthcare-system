import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../../server-utils/db');
const Appointment = require('../../../../../models/Appointment');
const Doctor = require('../../../../../models/Doctor');
const { verifySession } = require('../../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../../server-utils/socket');
const { writeLog } = require('../../../../../server-utils/logger');

export async function POST(req, { params }) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || (session.role !== 'doctor' && session.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized. Doctor or Receptionist session required.' }, { status: 403 });
    }

    const { appointmentId } = await params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Cancel appointment
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'cancelled' });

    // If this appointment was active or calling, reset doctor current token
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor && doctor.currentToken === appointment.tokenNumber) {
      await Doctor.findByIdAndUpdate(doctor._id, { currentToken: 0 });
    }

    await writeLog(
      'Appointment Cancelled',
      `Cancelled appointment for patient ${appointment.patientName} (Token #${appointment.tokenNumber})`,
      session._id,
      session.role
    );

    // Broadcast queue updates
    broadcastEvent('queue_updated', { doctorId: appointment.doctorId, date: appointment.date });

    return NextResponse.json({ success: true, message: 'Appointment cancelled successfully.' });
  } catch (err) {
    console.error('Cancel appointment API error:', err);
    return NextResponse.json({ error: 'Server error cancelling appointment' }, { status: 500 });
  }
}
