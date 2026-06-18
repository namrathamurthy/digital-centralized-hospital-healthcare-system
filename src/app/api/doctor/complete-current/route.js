import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const Doctor = require('../../../../models/Doctor');
const Appointment = require('../../../../models/Appointment');
const Prescription = require('../../../../models/Prescription');
const LabRequest = require('../../../../models/LabRequest');
const Invoice = require('../../../../models/Invoice');
const { verifySession } = require('../../../../server-utils/auth');
const { broadcastEvent } = require('../../../../server-utils/socket');
const { writeLog } = require('../../../../server-utils/logger');
const { DEPARTMENT_FEES, LAB_TEST_PRICES, getMedicinePrice } = require('../../../../server-utils/pricing');

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

    const { appointmentId, diagnosis, medications, labTests, prescriptionFile, labTestFile } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Mark appointment completed
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

    let consultationFee = DEPARTMENT_FEES[doctor.department] || 300;
    let finalInvoiceAmount = consultationFee;
    let descriptionParts = [`Consultation (${doctor.department}): ₹${consultationFee}`];

    // Save prescription if medications are prescribed or a file is uploaded
    if ((medications && medications.length > 0) || prescriptionFile) {
      const finalMeds = (medications && medications.length > 0) ? medications : [{ name: 'See Attached Photocopy', dosage: '-', frequency: '-', duration: '-' }];
      await Prescription.create({
        appointmentId,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: doctor._id,
        doctorName: doctor.name,
        diagnosis: diagnosis || 'N/A',
        medications: finalMeds,
        status: 'pending',
        attachmentData: prescriptionFile?.data,
        attachmentMimeType: prescriptionFile?.mimeType,
        attachmentName: prescriptionFile?.name
      });
      let totalMedFee = 0;
      let medDetails = [];
      for (const med of finalMeds) {
        if (med.name === 'See Attached Photocopy') {
           totalMedFee += 100;
           medDetails.push(`Attached Rx (₹100)`);
        } else {
           const price = getMedicinePrice(med.name);
           totalMedFee += price;
           medDetails.push(`${med.name} (₹${price})`);
        }
      }
      finalInvoiceAmount += totalMedFee;
      descriptionParts.push(`Medications: ${medDetails.join(', ')}`);
    }

    // Save lab requests if tests are ordered or file is uploaded
    let finalLabTests = labTests || [];
    if (labTestFile && finalLabTests.length === 0) {
      finalLabTests.push("Attached Doctor Request");
    }

    if (finalLabTests.length > 0) {
      for (const testType of finalLabTests) {
        await LabRequest.create({
          appointmentId,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          doctorId: doctor._id,
          doctorName: doctor.name,
          testType,
          status: 'pending',
          requestAttachmentData: labTestFile?.data,
          requestAttachmentMimeType: labTestFile?.mimeType,
          requestAttachmentName: labTestFile?.name
        });
        const testPrice = LAB_TEST_PRICES[testType] || 200;
        finalInvoiceAmount += testPrice;
        descriptionParts.push(`Lab Scan: ${testType} (₹${testPrice})`);
      }
    }

    // Generate centralized Invoice for billing staff review
    await Invoice.create({
      appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      amount: finalInvoiceAmount,
      description: descriptionParts.join(' + '),
      status: 'pending'
    });

    // Reset current token serving status
    await Doctor.findByIdAndUpdate(doctor._id, { currentToken: 0 });

    // --- Granular Audit Logs ---
    await writeLog(
      'Consultation Completed',
      `Dr. ${doctor.name} completed consultation for patient: ${appointment.patientName} | Diagnosis: ${diagnosis || 'N/A'} | Invoice: ₹${finalInvoiceAmount}`,
      session._id,
      session.role
    );

    if (medications && medications.length > 0) {
      await writeLog(
        'Prescription Sent to Pharmacy',
        `Dr. ${doctor.name} prescribed ${medications.length} medication(s) to ${appointment.patientName}: ${medications.map(m => m.name).join(', ')}`,
        session._id,
        session.role
      );
    }

    if (labTests && labTests.length > 0) {
      for (const testType of labTests) {
        await writeLog(
          'Lab Test Ordered',
          `Dr. ${doctor.name} ordered ${testType} for patient ${appointment.patientName}`,
          session._id,
          session.role
        );
      }
    }

    await writeLog(
      'Invoice Generated',
      `Dr. ${doctor.name} generated invoice of ₹${finalInvoiceAmount} for ${appointment.patientName} (${descriptionParts.join(' + ')})`,
      session._id,
      session.role
    );

    // Broadcast system changes to role modules
    broadcastEvent('queue_updated', { doctorId: doctor._id, date: appointment.date });
    broadcastEvent('pharmacy_updated');
    broadcastEvent('lab_updated');
    broadcastEvent('billing_updated');

    return NextResponse.json({ success: true, message: 'Treatment and billing orders processed successfully.' });
  } catch (err) {
    console.error('Doctor complete current error:', err);
    return NextResponse.json({ error: 'Server error finalizing appointment' }, { status: 500 });
  }
}
