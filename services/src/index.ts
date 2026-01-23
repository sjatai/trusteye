// Polyfill fetch for Node.js compatibility
import fetch from 'node-fetch';
if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Catch all uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Lazy load routes to catch import errors
let campaignRoutes: any, audienceRoutes: any, ruleRoutes: any, analyticsRoutes: any;
let aiRoutes: any, demoSiteRoutes: any, automationRoutes: any, contentRoutes: any, oauthRoutes: any;
let errorHandler: any, notFoundHandler: any;
let testConnection: any, indexTrustEyeKnowledge: any, loadPersistedDocuments: any;

try {
  const middleware = require('./middleware/errorHandler');
  errorHandler = middleware.errorHandler;
  notFoundHandler = middleware.notFoundHandler;

  campaignRoutes = require('./routes/campaigns').default;
  audienceRoutes = require('./routes/audiences').default;
  ruleRoutes = require('./routes/rules').default;
  analyticsRoutes = require('./routes/analytics').default;
  aiRoutes = require('./routes/ai').default;
  demoSiteRoutes = require('./routes/demo-site').default;
  automationRoutes = require('./routes/automations').default;
  contentRoutes = require('./routes/content').default;
  oauthRoutes = require('./routes/oauth').default;

  testConnection = require('./services/db').testConnection;
  indexTrustEyeKnowledge = require('./services/trusteyeKnowledge').indexTrustEyeKnowledge;
  loadPersistedDocuments = require('./services/pinecone').loadPersistedDocuments;

  console.log('✅ All modules loaded successfully');
} catch (err) {
  console.error('❌ Error loading modules:', err);
}

console.log('📦 Creating Express app...');
const app = express();
console.log('📦 Express app created');

// Middleware
console.log('📦 Setting up middleware...');
app.use(cors());
app.use(express.json());
console.log('📦 Middleware configured');

// Enhanced request logging for testing
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`\n📥 ${timestamp} | ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 400 ? '❌' : '✅';
    console.log(`${icon} ${timestamp} | ${req.method} ${req.path} → ${status} (${duration}ms)`);
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trusteye-api',
    timestamp: new Date().toISOString()
  });
});

// API Routes (only if loaded successfully)
if (campaignRoutes) app.use('/api/campaigns', campaignRoutes);
if (audienceRoutes) app.use('/api/audiences', audienceRoutes);
if (ruleRoutes) app.use('/api/rules', ruleRoutes);
if (analyticsRoutes) app.use('/api/analytics', analyticsRoutes);
if (aiRoutes) app.use('/api/ai', aiRoutes);
if (demoSiteRoutes) app.use('/api/demo-site', demoSiteRoutes);
if (automationRoutes) app.use('/api/automations', automationRoutes);
if (contentRoutes) app.use('/api/content', contentRoutes);
if (oauthRoutes) app.use('/api/oauth', oauthRoutes);

// Error handling
if (notFoundHandler) app.use(notFoundHandler);
if (errorHandler) app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
console.log(`📦 Starting server on port ${PORT} (from env: ${process.env.PORT || 'not set'})...`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 TrustEye API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on port ${PORT}
📋 Health check: /health

Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Initialize services in background (don't block server startup)
  (async () => {
    if (testConnection) {
      try {
        await testConnection();
        console.log('✅ Database connected');
      } catch (err) {
        console.error('⚠️ Database connection failed:', err);
      }
    }

    if (loadPersistedDocuments && indexTrustEyeKnowledge) {
      try {
        loadPersistedDocuments();
        await indexTrustEyeKnowledge();
        console.log('✅ Knowledge base loaded');
      } catch (err) {
        console.error('⚠️ Knowledge base loading failed:', err);
      }
    }
  })();
});

export default app;
