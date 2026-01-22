import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { supabase, testConnection } from './services/db';
import campaignRoutes from './routes/campaigns';
import audienceRoutes from './routes/audiences';
import ruleRoutes from './routes/rules';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import demoSiteRoutes from './routes/demo-site';
import automationRoutes from './routes/automations';
import contentRoutes from './routes/content';
import oauthRoutes from './routes/oauth';
import { indexTrustEyeKnowledge } from './services/trusteyeKnowledge';
import { loadPersistedDocuments } from './services/pinecone';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// API Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes); // Intelligence Agent - AI features
app.use('/api/demo-site', demoSiteRoutes); // Demo site integration
app.use('/api/automations', automationRoutes); // Workflow automations
app.use('/api/content', contentRoutes); // Content library & brand tone
app.use('/api/oauth', oauthRoutes); // OAuth for social media integrations

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 TrustEye API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on: http://localhost:${PORT}
📋 Health check: http://localhost:${PORT}/health

Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Test database connection
  await testConnection();

  // Load existing knowledge and index TrustEye capabilities
  loadPersistedDocuments();
  await indexTrustEyeKnowledge();
});

export default app;
