const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseCounter;
try {
  const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "doctor_ID_YYYY-MM-DD"
    seq: { type: Number, default: 0 }
  });
  MongooseCounter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
} catch (e) {
  MongooseCounter = mongoose.models.Counter;
}

const CounterProxy = {
  async getNextSequence(key) {
    if (getDbMode() === 'mongo') {
      const counter = await MongooseCounter.findByIdAndUpdate(
        key,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return counter.seq;
    } else {
      const col = getCollection('counter');
      let counter = await col.findById(key);
      if (!counter) {
        // Create initial
        try {
          await col.create({ _id: key, seq: 0 });
        } catch (err) {
          // ignore duplicate errors if any concurrent access
        }
      }
      const updated = await col.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true });
      return updated.seq;
    }
  }
};

module.exports = CounterProxy;
