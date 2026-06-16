const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseInvoice;
try {
  const InvoiceSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'N/A'], default: 'N/A' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseInvoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
} catch (e) {
  MongooseInvoice = mongoose.models.Invoice;
}

const InvoiceProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.find(query);
    return await getCollection('invoice').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.findOne(query);
    return await getCollection('invoice').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.findById(id);
    return await getCollection('invoice').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.create(data);
    return await getCollection('invoice').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.findByIdAndUpdate(id, update, options);
    return await getCollection('invoice').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.updateOne(query, update);
    return await getCollection('invoice').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.deleteOne(query);
    return await getCollection('invoice').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseInvoice.countDocuments(query);
    return await getCollection('invoice').countDocuments(query);
  }
};

module.exports = InvoiceProxy;
