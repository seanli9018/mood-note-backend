const express = require('express');
const moodRouter = require('./routes/moodRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
// Security related packages.
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const app = express();

// Set security HTTP headers.
app.use(helmet());

// Implementing globally rate limiting max 100 requests per hour.
// NOTE: if our app crushes or restarted, the limit will be reset.
// Limit count and remaining limit count and expiration are save in each request header.
const limiter = rateLimit({
  max: 100, // max 100 requests
  windowMs: 60 * 60 * 1000, // 1hr
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Middleware to parse JSON request body, allowing 10kb json data in request body.
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
// Example: when hacker sending below json in req body trying to login, will success without sanitizing query injection!
// {
//   "email": {"$gt": ""}, // sending query instead of real email address. the query will always return true, and it will return all users.
//   "password": <correct password value>
// }
app.use(mongoSanitize()); // it will filter out $ signs and dots.

// Data sanitization against XSS: removing html and js code.
const DOMPurify = createDOMPurify(new JSDOM().window);
// Custom middleware to sanitize all request body fields: removing html and js code.
const sanitizeReqBody = (req, _res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: {},
        });
      }
    }
  }
  next();
};
app.use(sanitizeReqBody);

// Routes
app.use('/api/v1/moods', moodRouter);
app.use('/api/v1/users', userRouter);

// 404 middleware
app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware (error as first parameter)
// In order for the error handler to catch all operational errors/exceptions,
// please pass in error object/class in next, as next(err).
app.use(globalErrorHandler);

module.exports = app;
