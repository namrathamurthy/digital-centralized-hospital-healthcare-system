const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongoosePrescription;
try {
  const PrescriptionSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    diagnosis: { type: String, required: true },
    icd10Code: { type: String },
    voiceTranscript: { type: String },
    generalInstructions: { type: String },
    followUp: { type: String },
    medications: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String },
      duration: { type: String },
      timing: { type: String },
      routeOfAdmin: { type: String },
      instruction: { type: String },
      allergyConflict: { type: Boolean, default: false },
      conflictReason: { type: String }
    }],
    status: { type: String, enum: ['pending', 'dispensed'], default: 'pending' },
    attachmentData: { type: String },
    attachmentMimeType: { type: String },
    attachmentName: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongoosePrescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
} catch (e) {
  MongoosePrescription = mongoose.models.Prescription;
}

const PrescriptionProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.find(query);
    return await getCollection('prescription').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.findOne(query);
    return await getCollection('prescription').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.findById(id);
    return await getCollection('prescription').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.create(data);
    return await getCollection('prescription').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.findByIdAndUpdate(id, update, options);
    return await getCollection('prescription').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.updateOne(query, update);
    return await getCollection('prescription').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.deleteOne(query);
    return await getCollection('prescription').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongoosePrescription.countDocuments(query);
    return await getCollection('prescription').countDocuments(query);
  }
};

module.exports = PrescriptionProxy;
