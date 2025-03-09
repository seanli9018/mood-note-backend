const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Injecting env variable.
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB_CONNECTION_STRING = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connecting MongoDB.
mongoose.connect(DB_CONNECTION_STRING).then((_con) => {
  console.log('DB connection successful');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
