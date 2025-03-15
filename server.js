const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Globally handles all Uncaught Exception!!!!!
// Uncaught Exception is sync error so that we have to put it on the very beginning of the code.
// example: console.log(x); Reference Error x is not defined!!!
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  // Shutting down directly, since if a uncaught exception is happening, Node.js server is in a unclean state.
  // In real production env, the host may have logic to restart the server immediately.
  process.exit(1);
});

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
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Globally handles all Unhandled Rejections!!!!!
// example: DB connection errors
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  // Shutting down gracefully by calling server.close first.
  // We are giving time for server to finish all pending requests, then shutting it down.
  server.close(() => {
    process.exit(1);
  });
});
