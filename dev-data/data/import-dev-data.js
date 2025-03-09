const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Mood = require('./../../models/moodModel');

// Injecting env variable.
dotenv.config({ path: './config.env' });

const DB_CONNECTION_STRING = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connecting MongoDB.
mongoose
  .connect(DB_CONNECTION_STRING, {
    serverSelectionTimeoutMS: 30 * 1000, // 30 seconds
  })
  .then((_con) => {
    console.log('DB connection successful');
  });

// Import data into DB.
const importData = async () => {
  try {
    // Read json file.
    const moods = JSON.parse(
      fs.readFileSync(`${__dirname}/moods.json`, 'utf-8')
    );
    console.log(moods);
    await Mood.create(moods);
    console.log('Data imported successfully!');
  } catch (err) {
    console.log('Data importing went wrong', err);
  } finally {
    process.exit();
  }
};

// Delete all data from collection.
const deleteAllData = async () => {
  try {
    await Mood.deleteMany();
    console.log('All data deleted successfully!');
  } catch (err) {
    console.log('Data deleting went wrong', err);
  } finally {
    process.exit();
  }
};

// console.log(process.argv);
// node dev-data/data/import-dev-data.js --import
// node dev-data/data/import-dev-data.js --delete-all
if (process.argv[2] === '--import') {
  importData();
}

if (process.argv[2] === '--delete-all') {
  deleteAllData();
}
