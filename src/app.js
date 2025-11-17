require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes'); // Route index
const configureSwaggerDocs = require('./docs/swagger.config');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(morgan('dev')); // Helpful for route debugging
app.use(express.json({ limit: '5mb' }));

// ---------------- ROOT ROUTES ----------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to HomeService API 🧽🔧',
    docs: '/api-docs',
    base: '/api',
  });
});

// ---------------- API ROUTES ----------------
app.use('/api', routes);

// Swagger documentation
configureSwaggerDocs(app);

// ---------------- ERROR HANDLER --------------
app.use(errorMiddleware);

// ---------------- 404 HANDLER ----------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = app;
