require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

// Connect once, then reuse the db handle
async function connect() {
  if (db) return db;
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas (native driver)');
    // If you want a specific DB name, replace null with it, e.g. 'myAppDB'
    db = client.db(); 
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connect;
