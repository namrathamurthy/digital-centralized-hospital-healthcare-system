const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseUser;
try {
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'receptionist', 'billing', 'lab', 'pharmacy'], required: true },
    allergies: [{ type: String }],
    currentMeds: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);
} catch (e) {
  MongooseUser = mongoose.models.User;
}

const UserProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseUser.find(query);
    return await getCollection('user').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseUser.findOne(query);
    return await getCollection('user').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseUser.findById(id);
    return await getCollection('user').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseUser.create(data);
    return await getCollection('user').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseUser.findByIdAndUpdate(id, update, options);
    return await getCollection('user').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseUser.updateOne(query, update);
    return await getCollection('user').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseUser.deleteOne(query);
    return await getCollection('user').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseUser.countDocuments(query);
    return await getCollection('user').countDocuments(query);
  }
};

module.exports = UserProxy;
