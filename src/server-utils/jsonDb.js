const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data', 'db');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDbCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.collectionName = collectionName;
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading collection ${this.collectionName}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error writing collection ${this.collectionName}:`, err);
    }
  }

  _matches(item, query) {
    if (!query) return true;
    for (const key in query) {
      const queryVal = query[key];
      const itemVal = item[key];

      // Handle simple Mongoose-like operators
      if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
        if ('$in' in queryVal) {
          if (!Array.isArray(queryVal.$in)) continue;
          if (!queryVal.$in.includes(itemVal)) return false;
        } else if ('$nin' in queryVal) {
          if (!Array.isArray(queryVal.$nin)) continue;
          if (queryVal.$nin.includes(itemVal)) return false;
        } else if ('$ne' in queryVal) {
          if (itemVal === queryVal.$ne) return false;
        } else if ('$gt' in queryVal) {
          if (!(itemVal > queryVal.$gt)) return false;
        } else if ('$gte' in queryVal) {
          if (!(itemVal >= queryVal.$gte)) return false;
        } else if ('$lt' in queryVal) {
          if (!(itemVal < queryVal.$lt)) return false;
        } else if ('$lte' in queryVal) {
          if (!(itemVal <= queryVal.$lte)) return false;
        } else if ('$exists' in queryVal) {
          const exists = queryVal.$exists;
          if (exists && (itemVal === undefined || itemVal === null)) return false;
          if (!exists && itemVal !== undefined && itemVal !== null) return false;
        } else {
          // Nested object match / deep match
          if (JSON.stringify(itemVal) !== JSON.stringify(queryVal)) return false;
        }
      } else {
        // Direct match
        if (itemVal !== queryVal) return false;
      }
    }
    return true;
  }

  async find(query = {}) {
    const items = this._read();
    const filtered = items.filter(item => this._matches(item, query));
    return JSON.parse(JSON.stringify(filtered)); // break references
  }

  async findOne(query = {}) {
    const items = this._read();
    const item = items.find(item => this._matches(item, query));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    this._write(items);
    return JSON.parse(JSON.stringify(newDoc));
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const oldItem = items[index];
    
    // Apply updates (supports nested / top-level overwrite or $set)
    let updatedFields = update;
    if (update && update.$set) {
      updatedFields = { ...oldItem, ...update.$set };
    } else if (update && update.$inc) {
      updatedFields = { ...oldItem };
      for (const k in update.$inc) {
        updatedFields[k] = (updatedFields[k] || 0) + update.$inc[k];
      }
    } else {
      updatedFields = { ...oldItem, ...update };
    }

    const newItem = {
      ...updatedFields,
      _id: id, // keep same id
      updatedAt: new Date().toISOString()
    };

    items[index] = newItem;
    this._write(items);
    return JSON.parse(JSON.stringify(options.new ? newItem : oldItem));
  }

  async findOneAndUpdate(query, update, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => this._matches(item, query));
    if (index === -1) return null;

    const oldItem = items[index];
    let updatedFields = update;
    if (update && update.$set) {
      updatedFields = { ...oldItem, ...update.$set };
    } else if (update && update.$inc) {
      updatedFields = { ...oldItem };
      for (const k in update.$inc) {
        updatedFields[k] = (updatedFields[k] || 0) + update.$inc[k];
      }
    } else {
      updatedFields = { ...oldItem, ...update };
    }

    const newItem = {
      ...updatedFields,
      _id: oldItem._id,
      updatedAt: new Date().toISOString()
    };

    items[index] = newItem;
    this._write(items);
    return JSON.parse(JSON.stringify(options.new ? newItem : oldItem));
  }

  async updateOne(query, update) {
    const res = await this.findOneAndUpdate(query, update);
    return { modifiedCount: res ? 1 : 0, matchedCount: res ? 1 : 0 };
  }

  async deleteOne(query) {
    const items = this._read();
    const index = items.findIndex(item => this._matches(item, query));
    if (index === -1) return { deletedCount: 0 };

    items.splice(index, 1);
    this._write(items);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const items = this._read();
    const remaining = items.filter(item => !this._matches(item, query));
    const deletedCount = items.length - remaining.length;
    this._write(remaining);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const items = this._read();
    return items.filter(item => this._matches(item, query)).length;
  }
}

const collections = {};

function getCollection(name) {
  const collectionName = name.toLowerCase() + 's';
  if (!collections[collectionName]) {
    collections[collectionName] = new JsonDbCollection(collectionName);
  }
  return collections[collectionName];
}

module.exports = {
  getCollection
};
