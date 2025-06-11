import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';
import noteRoutes from './routes/notes.js';

// Import database connection
import { testConnection } from './db/connection.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FlexBook API Server',
    version: '1.0.0',
    environment: NODE_ENV,
    documentation: '/api/docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || null
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please log in again'
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Something went wrong';
  
  res.status(status).json({
    error: 'Server Error',
    message: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 FlexBook API Server started');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});