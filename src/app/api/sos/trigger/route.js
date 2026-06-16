import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const SOSAlert = require('../../../../models/SOSAlert');
const Appointment = require('../../../../models/Appointment');
const Doctor = require('../../../../models/Doctor');
const Counter = require('../../../../models/Counter');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    const { symptoms, location, patientName } = await req.json();

    let finalName = patientName || 'Emergency Guest';
    let patientId = null;

    if (session) {
      finalName = session.name;
      patientId = session._id;
    }

    if (!symptoms) {
      return NextResponse.json({ error: 'Symptom description required for SOS' }, { status: 400 });
    }

    const alert = await SOSAlert.create({
      patientId,
      patientName: finalName,
      symptoms,
      location: location || 'Emergency Ward',
      status: 'active'
    });

    await writeLog(
      'SOS Alert Triggered',
      `CRITICAL EMERGENCY: SOS alert activated by ${finalName}. Symptoms: ${symptoms}`,
      patientId,
      session?.role || 'patient'
    );

    // Auto-inject urgent queue ticket for first available active doctor
    const today = new Date().toISOString().split('T')[0];
    const doc = await Doctor.findOne({ status: 'active', department: 'Emergency' }) || await Doctor.findOne({ status: 'active' });

    if (doc) {
      const counterKey = `doctor_${doc._id}_${today}`;
      const tokenNumber = await Counter.getNextSequence(counterKey);

      await Appointment.create({
        patientId: patientId || `sos_${alert._id}`,
        patientName: finalName,
        doctorId: doc._id,
        doctorName: doc.name,
        tokenNumber,
        date: today,
        timeSlot: 'SOS Emergency',
        triageData: {
          symptoms,
          severity: 'Emergency',
          aiAdvice: 'SOS triggered - priority queue assigned.'
        },
        status: 'waiting',
        priority: 2 // Highest SOS priority
      });

      broadcastEvent('queue_updated', { doctorId: doc._id, date: today });
    }

    // Dispatch global real-time event to flash dashboards
    broadcastEvent('sos_alert', {
      _id: alert._id,
      patientName: finalName,
      symptoms,
      location: alert.location,
      createdAt: alert.createdAt
    });

    return NextResponse.json({ success: true, alert });
  } catch (err) {
    console.error('Trigger SOS API error:', err);
    return NextResponse.json({ error: 'Server error processing SOS event' }, { status: 500 });
  }
}
