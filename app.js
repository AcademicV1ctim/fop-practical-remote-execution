const express = require('express');
require('dotenv').config();
const path = require('path');
const createError = require('http-errors');
const connectDB = require('./db');

const app = express();

connectDB()
  .then(db => {
    // Make the db handle available via app.locals
    app.locals.db = db;
    console.log('✅ Database connection established');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Catch 404 for unknown resources
app.use((req, res, next) => {
  next(createError(404, `Unknown resource ${req.method} ${req.originalUrl}`));
});
  
// Error handler
app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ error: error.message || 'Unknown Server Error!' });
});

module.exports = app;
