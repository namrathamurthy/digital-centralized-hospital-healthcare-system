const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseAppointment;
try {
  const AppointmentSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    tokenNumber: { type: Number, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true }, // e.g. "09:00 - 09:30" or "Walk-in"
    status: { type: String, enum: ['waiting', 'calling', 'completed', 'cancelled', 'discharged'], default: 'waiting' },
    triageData: {
      symptoms: { type: String },
      severity: { type: String }, // Low, Medium, High, Emergency
      aiAdvice: { type: String }
    },
    priority: { type: Number, default: 0 }, // 0 = standard, 1 = high, 2 = SOS urgent
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseAppointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
} catch (e) {
  MongooseAppointment = mongoose.models.Appointment;
}

const AppointmentProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.find(query);
    return await getCollection('appointment').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.findOne(query);
    return await getCollection('appointment').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.findById(id);
    return await getCollection('appointment').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.create(data);
    return await getCollection('appointment').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.findByIdAndUpdate(id, update, options);
    return await getCollection('appointment').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.updateOne(query, update);
    return await getCollection('appointment').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.deleteOne(query);
    return await getCollection('appointment').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseAppointment.countDocuments(query);
    return await getCollection('appointment').countDocuments(query);
  }
};

module.exports = AppointmentProxy;
