import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './connection.js';
import Assumption from './Assumption.js';

dotenv.config();

const sampleData = [
  { text: 'Users have a stable internet connection.' },
  { text: 'The budget will remain fixed through Q4.' },
  { text: 'Third-party APIs maintain backward compatibility.' },
  { text: 'The team size stays constant for this release.' }
];

const seed = async () => {
  try {
    await connectDatabase(process.env.MONGO_URI);
    await Assumption.deleteMany({});
    await Assumption.insertMany(sampleData);
    console.log(`[assumption-grid] Seeded ${sampleData.length} assumptions`);
  } catch (error) {
    console.error('[assumption-grid] Seed error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
