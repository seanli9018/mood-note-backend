const express = require('express');
const moodRouter = require('./routes/moodRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
// Middleware to parse JSON request body
app.use(express.json());

// Routes
app.use('/api/v1/moods', moodRouter);

// 404 middleware
app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware (error as first parameter)
// In order for the error handler to catch all operational errors/exceptions,
// please pass in error object/class in next, as next(err).
app.use(globalErrorHandler);

module.exports = app;
