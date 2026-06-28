require('dotenv').config();
const mongoose = require('mongoose');
const Assumption = require('./database/Assumption');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assumption_grid_db';

const seedData = [
  { text: 'The project timeline assumes no major scope changes after sprint 3' },
  { text: 'Third-party APIs will maintain backward compatibility during development' },
  { text: 'The client will provide final design assets by the end of week 2' },
  { text: 'Infrastructure costs will remain within the allocated budget' },
  { text: 'Team members will be available full-time throughout the project duration' },
  { text: 'The staging environment mirrors production configuration' },
  { text: 'User acceptance testing will be completed within 5 business days' },
  { text: 'Database migrations will not require downtime' },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Assumption.deleteMany({});
    console.log('Cleared existing assumptions');

    const created = await Assumption.insertMany(seedData);
    console.log(`Seeded ${created.length} assumptions`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
