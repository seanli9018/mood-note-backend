const express = require('express');

const moodRouter = require('./routes/moodRoutes');

const app = express();

app.use((req, res, next) => {
  console.log('Hello, this is a custom middleware');
  next();
});

app.use('/api/v1/moods', moodRouter);

module.exports = app;
