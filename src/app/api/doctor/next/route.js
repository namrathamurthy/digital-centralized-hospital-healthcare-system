import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Doctor = require('../../../../models/Doctor');
const Appointment = require('../../../../models/Appointment');
const Invoice = require('../../../../models/Invoice');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized. Doctor session required.' }, { status: 403 });
    }

    const doctor = await Doctor.findOne({ userId: session._id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Auto-complete any active calling appointment
    const currentCalling = await Appointment.findOne({
      doctorId: doctor._id,
      date: today,
      status: 'calling'
    });

    if (currentCalling) {
      await Appointment.findByIdAndUpdate(currentCalling._id, { status: 'completed' });
      
      // Auto-generate standard Consultation Invoice
      await Invoice.create({
        appointmentId: currentCalling._id,
        patientId: currentCalling.patientId,
        patientName: currentCalling.patientName,
        amount: 300, // Consultation fee
        description: 'General Doctor Consultation Fee',
        status: 'pending'
      });

      await writeLog(
        'Appointment Completed', 
        `Completed and billed consultation for ${currentCalling.patientName}`, 
        session._id, 
        session.role
      );
    }

    // Retrieve remaining waiting patients
    const waitingAppts = await Appointment.find({
      doctorId: doctor._id,
      date: today,
      status: 'waiting'
    });

    if (waitingAppts.length === 0) {
      await Doctor.findByIdAndUpdate(doctor._id, { currentToken: 0 });
      broadcastEvent('queue_updated', { doctorId: doctor._id, date: today });
      return NextResponse.json({ success: true, message: 'Queue is currently empty.', appointment: null });
    }

    // Sort by priority descending, then token number ascending
    const sorted = waitingAppts.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.tokenNumber - b.tokenNumber;
    });

    const nextAppt = sorted[0];

    // Mark as calling
    const updated = await Appointment.findByIdAndUpdate(nextAppt._id, { status: 'calling' }, { new: true });
    
    // Update doctor room token tracking
    await Doctor.findByIdAndUpdate(doctor._id, { currentToken: nextAppt.tokenNumber });

    await writeLog(
      'Queue Next Called', 
      `Called token #${nextAppt.tokenNumber} (${nextAppt.patientName}) to room ${doctor.room}`, 
      session._id, 
      session.role
    );

    // Broadcast events for UI and Speech announcements
    broadcastEvent('queue_updated', { doctorId: doctor._id, date: today });
    broadcastEvent('voice_call', {
      patientName: nextAppt.patientName,
      tokenNumber: nextAppt.tokenNumber,
      room: doctor.room,
      doctorId: doctor._id
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err) {
    console.error('Doctor next API error:', err);
    return NextResponse.json({ error: 'Server error transitioning queue' }, { status: 500 });
  }
}
