require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression'); // NEW: Gzip compression
const hpp = require('hpp'); // NEW: Prevent Parameter Pollution
const xss = require('xss-clean'); // NEW: Prevent XSS attacks

const routes = require('./routes'); 
const configureSwaggerDocs = require('./docs/swagger.config');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ---------------- MIDDLEWARE ----------------

// 1. Security Headers
app.use(helmet());

// 2. Enable CORS (Note: For strict production, replace '*' with your actual domain)
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));

// 3. Logging
app.use(morgan('dev'));

// 4. Body Parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// 5. Data Sanitization against XSS
app.use(xss()); // Cleans user input from malicious HTML code

// 6. Prevent Parameter Pollution
app.use(hpp()); // Prevents attacks like ?sort=asc&sort=desc

// 7. Compression (Performance)
app.use(compression()); // Compresses response bodies for faster speed

// 8. Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use(limiter); 

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