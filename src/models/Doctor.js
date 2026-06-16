const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseDoctor;
try {
  const DoctorSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    room: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    currentToken: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseDoctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
} catch (e) {
  MongooseDoctor = mongoose.models.Doctor;
}

const DoctorProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.find(query);
    return await getCollection('doctor').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.findOne(query);
    return await getCollection('doctor').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.findById(id);
    return await getCollection('doctor').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.create(data);
    return await getCollection('doctor').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.findByIdAndUpdate(id, update, options);
    return await getCollection('doctor').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.updateOne(query, update);
    return await getCollection('doctor').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.deleteOne(query);
    return await getCollection('doctor').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseDoctor.countDocuments(query);
    return await getCollection('doctor').countDocuments(query);
  }
};

module.exports = DoctorProxy;
