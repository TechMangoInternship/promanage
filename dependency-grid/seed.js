require('dotenv').config();
const mongoose = require('mongoose');
const Dependency = require('./database/Dependency');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dependency_grid_db';

const seedData = [
  { text: 'React 19 runtime must be available in the production CDN' },
  { text: 'MongoDB Atlas cluster must be provisioned before deployment' },
  { text: 'CI/CD pipeline depends on GitHub Actions runners being available' },
  { text: 'Authentication service requires OAuth 2.0 provider configuration' },
  { text: 'File upload feature depends on AWS S3 bucket access' },
  { text: 'Email notifications require SMTP server credentials' },
  { text: 'Payment processing depends on Stripe API integration' },
  { text: 'Real-time updates require WebSocket server infrastructure' },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Dependency.deleteMany({});
    console.log('Cleared existing dependencies');

    const created = await Dependency.insertMany(seedData);
    console.log(`Seeded ${created.length} dependencies`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
