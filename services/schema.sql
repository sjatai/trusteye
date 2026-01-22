-- TrustEye Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('win-back', 'promotional', 'product-launch', 'nurture', 'loyalty', 'event', 'feedback', 'announcement', 'referral', 'review', 'recovery', 'conquest', 'service', 'birthday', 'welcome', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused')),
  channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  audience_id UUID,
  content JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "converted": 0}',
  gate_results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audiences table
CREATE TABLE IF NOT EXISTS audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  conditions JSONB DEFAULT '{}',
  estimated_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rules table (automations)
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('review', 'purchase', 'signup', 'inactivity', 'custom')),
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content library table
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'social', 'template')),
  subject VARCHAR(255),
  body TEXT,
  metadata JSONB DEFAULT '{}',
  brand_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign events/logs table
CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audiences_created_at ON audiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rules_is_active ON rules(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON campaign_events(campaign_id);

-- Add foreign key constraint
ALTER TABLE campaigns
  ADD CONSTRAINT fk_campaigns_audience
  FOREIGN KEY (audience_id)
  REFERENCES audiences(id)
  ON DELETE SET NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audiences_updated_at ON audiences;
CREATE TRIGGER update_audiences_updated_at
  BEFORE UPDATE ON audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rules_updated_at ON rules;
CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit log table (tracks all AI actions)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  brand_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  request_id VARCHAR(100),
  tool_id VARCHAR(100),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  input_hash VARCHAR(50),
  output_hash VARCHAR(50),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (stores conversation history for learning)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  brand_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  tools_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  outcome VARCHAR(50) CHECK (outcome IN ('success', 'failure', 'abandoned', 'escalated', 'unknown')),
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_brand_id ON audit_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Parse attempts table (tracks all intent parsing attempts)
CREATE TABLE IF NOT EXISTS parse_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  input TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  confidence JSONB NOT NULL,
  was_correct BOOLEAN DEFAULT true,
  correction JSONB,
  brand_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned patterns table (stores patterns learned from corrections)
CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  input TEXT NOT NULL,
  normalized_input TEXT NOT NULL UNIQUE,
  output JSONB NOT NULL,
  correction_count INTEGER DEFAULT 1,
  confidence INTEGER DEFAULT 50,
  brand_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parse_attempts
CREATE INDEX IF NOT EXISTS idx_parse_attempts_brand_id ON parse_attempts(brand_id);
CREATE INDEX IF NOT EXISTS idx_parse_attempts_was_correct ON parse_attempts(was_correct);
CREATE INDEX IF NOT EXISTS idx_parse_attempts_created_at ON parse_attempts(created_at DESC);

-- Indexes for learned_patterns
CREATE INDEX IF NOT EXISTS idx_learned_patterns_normalized_input ON learned_patterns(normalized_input);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_brand_id ON learned_patterns(brand_id);

-- Verify tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
