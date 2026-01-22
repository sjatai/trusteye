/**
 * CAMPAIGN WORKFLOW STATES & ACTIONS
 * ==================================
 *
 * State Flow:
 * 1. NO_CAMPAIGN       → Actions: [Create campaign / Click AI suggestion]
 * 2. CAMPAIGN_CREATED  → Actions: [Generate Content, Edit Audience, Change Channels]
 * 3. CONTENT_GENERATED → Actions: [Submit for Review, Edit Content, Preview]
 * 4. REVIEWING         → Actions: [Wait / Show spinner]
 * 5. GATE_FAILED       → Actions: [Edit Content & Fix, View Details]
 * 6. CONTENT_FIXED     → Actions: [Resubmit for Review, Edit More]
 * 7. AWAITING_APPROVAL → Actions: [Approve in Panel →, View Details] (buttons in InspectorPanel)
 * 8. ALL_PASSED        → Actions: [Publish Campaign, View Receipt]
 * 9. PUBLISHED         → Actions: [View Receipt, Create Another]
 *
 * Button Logic (getNextActions):
 * - campaign_created + no content     → Generate Content (primary)
 * - content_generated or has content  → Submit for Review (primary)
 * - content_fixed                     → Resubmit for Review (primary)
 * - gate_results + allPassed          → Publish Campaign (primary)
 * - gate_results + anyFailed          → Edit Content & Fix (primary)
 * - gate_results + gates1&2 passed    → Approve in Panel → (disabled, use right panel)
 */

import { Lightbulb, Target, Users, Mail, Clock, TrendingUp, AlertTriangle, Zap, RefreshCw, ArrowRight, Star, Shield, Sparkles, Pencil, Check, X, XCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AISuggestion } from '../lib/api';
import { StarsIcon } from './StarsIcon';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ContentEdit {
  field: 'subject' | 'body' | 'cta' | 'sms' | 'social';
  value: string;
  channel?: 'email' | 'sms' | 'social';
}

interface ConversationFeedProps {
  messages: Message[];
  onPromptSuggestion?: () => void;
  onTemplateClick?: (prompt: string) => void;
  onContentEdit?: (edit: ContentEdit) => void;
  suggestions?: AISuggestion[];
  isLoading?: boolean;
}

export function ConversationFeed({ messages, onPromptSuggestion, onTemplateClick, onContentEdit, suggestions = [], isLoading = false }: ConversationFeedProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingField, setEditingField] = useState<{ messageId: string; field: 'subject' | 'body' | 'cta' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (feedEndRef.current && messages.length > 0) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

  // Start editing a field
  const startEditing = (messageId: string, field: 'subject' | 'body' | 'cta', currentValue: string) => {
    setEditingField({ messageId, field });
    setEditValue(currentValue);
  };

  // Save edit
  const saveEdit = () => {
    if (editingField && onContentEdit) {
      onContentEdit({ field: editingField.field, value: editValue });
    }
    setEditingField(null);
    setEditValue('');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Handle key press in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Get suggestion icon based on type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recovery': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'referral': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'competitive':
      case 'conquest': return <Shield className="w-5 h-5 text-[#1E5ECC]" />;
      case 'win-back': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'seasonal': return <Zap className="w-5 h-5 text-green-500" />;
      default: return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get command for suggestion type
  const getSuggestionCommand = (suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'recovery': return 'Create a recovery campaign for negative reviews';
      case 'referral': return 'Create a referral campaign from 5-star reviews';
      case 'competitive':
      case 'conquest': return 'Create a conquest campaign targeting Valley Honda';
      case 'win-back': return 'Win back inactive customers';
      case 'seasonal': return 'Create a seasonal New Year campaign';
      default: return suggestion.title;
    }
  };

  // Initial empty state with AI Suggestions
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-start justify-center p-8 pt-16 overflow-y-auto">
        <div className="w-full max-w-3xl">
          {/* Welcome Header with Suggestions Badge */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1E5ECC] flex items-center justify-center shadow-lg">
              <StarsIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 mb-2">
              Welcome to TrustEye
            </h2>
            <p className="text-[14px] text-slate-600 mb-4">
              AI action layer for Birdeye — reads your real customer data and creates smart campaigns
            </p>

            {/* AI Suggestions Badge */}
            {suggestions.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E5ECC] text-white text-[13px] font-semibold shadow-md animate-pulse">
                <StarsIcon className="w-4 h-4" />
                {suggestions.length} AI Suggestions from Real Data
              </div>
            )}
          </div>

          {/* AI Suggestions Cards - THE STAR OF THE DEMO */}
          {suggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-[14px] font-bold text-slate-900">
                  AI Found These Opportunities
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                  From Birdeye Data
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => onTemplateClick?.(getSuggestionCommand(suggestion))}
                    className="p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-[#1E5ECC] hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-sky-50 transition-all">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {suggestion.dataSource}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-semibold text-slate-900 mb-1 group-hover:text-[#1E5ECC] transition-colors">
                          {suggestion.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {suggestion.description}
                        </p>
                        {suggestion.suggestedAudience && (
                          <div className="mt-2 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-600">
                              {suggestion.suggestedAudience.count?.toLocaleString()} customers
                            </span>
                          </div>
                        )}
                        {suggestion.potentialImpact && (
                          <div className="mt-1 text-[10px] text-emerald-600 font-medium">
                            {suggestion.potentialImpact.estimate}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E5ECC] transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Templates */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => onTemplateClick?.('Create a referral campaign from 5-star reviews')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-yellow-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center mb-3 group-hover:bg-yellow-100 transition-all">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900 mb-1">
                Referral Campaign
              </h3>
              <p className="text-[11px] text-slate-500">
                Ask 5-star reviewers for referrals
              </p>
            </button>

            <button
              onClick={() => onTemplateClick?.('Create a recovery campaign for negative reviews')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-all">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900 mb-1">
                Recovery Campaign
              </h3>
              <p className="text-[11px] text-slate-500">
                Win back unhappy customers
              </p>
            </button>

            <button
              onClick={() => onTemplateClick?.('Create a conquest campaign targeting Valley Honda')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-all">
                <Shield className="w-5 h-5 text-[#1E5ECC]" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900 mb-1">
                Conquest Campaign
              </h3>
              <p className="text-[11px] text-slate-500">
                Target competitor customers
              </p>
            </button>

            <button
              onClick={() => onTemplateClick?.('Win back inactive customers')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-all">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900 mb-1">
                Win-Back Campaign
              </h3>
              <p className="text-[11px] text-slate-500">
                Re-engage inactive customers
              </p>
            </button>
          </div>

          {/* Demo Prompts */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-1">
              Demo Commands
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onTemplateClick?.('Create a referral campaign from 5-star reviews')}
                className="px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-[12px] font-medium hover:bg-yellow-100 transition-all"
              >
                Referral from 5★ reviews
              </button>
              <button
                onClick={() => onTemplateClick?.('Create a conquest campaign targeting Valley Honda')}
                className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-[#1E5ECC] text-[12px] font-medium hover:bg-sky-100 transition-all"
              >
                Conquest Valley Honda
              </button>
              <button
                onClick={() => onTemplateClick?.('Create a recovery campaign for negative reviews')}
                className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-[12px] font-medium hover:bg-orange-100 transition-all"
              >
                Recovery for 2★ reviews
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine next actions based on campaign state
  const getNextActions = (data: any) => {
    if (!data) return [];

    // If campaign created but no content
    if (data.type === 'campaign_created' && !data.content) {
      return [
        { label: 'Generate Content', command: 'generate content', primary: true, icon: '✨' },
        { label: 'Edit Audience', command: 'edit audience', primary: false, icon: '👥' },
        { label: 'Change Channels', command: 'change channels', primary: false, icon: '📢' },
      ];
    }

    // If content generated
    if (data.type === 'content_generated' || (data.type === 'campaign_created' && data.content && !data.gateResults)) {
      return [
        { label: 'Submit for Review', command: 'review', primary: true, icon: '🔒' },
        { label: 'Edit Content', command: 'edit content', primary: false, icon: '✏️' },
        { label: 'Preview', command: 'show preview', primary: false, icon: '👁️' },
      ];
    }

    // If content was fixed after gate failure
    if (data.type === 'content_fixed' && data.canResubmit) {
      return [
        { label: 'Resubmit for Review', command: 'review', primary: true, icon: '🔒' },
        { label: 'Edit More', command: 'edit content', primary: false, icon: '✏️' },
      ];
    }

    // If campaign completed/published
    if (data.type === 'campaign_completed') {
      return [
        { label: 'Track Performance', command: 'go to campaigns', primary: true, icon: '📊' },
        { label: 'Start New Campaign', command: 'start new', primary: false, icon: '✨' },
      ];
    }

    // If gates in progress
    if (data.type === 'gate_results') {
      const gate1 = data.gateResults?.find((g: any) => g.gate === 1);
      const gate2 = data.gateResults?.find((g: any) => g.gate === 2);
      const gate3 = data.gateResults?.find((g: any) => g.gate === 3);
      const allPassed = gate1?.passed && gate2?.passed && gate3?.passed;
      const gates1And2Passed = gate1?.passed && gate2?.passed;
      const anyFailed = data.failed || !gate1?.passed || (gate1?.passed && !gate2?.passed);

      if (allPassed) {
        return [
          { label: 'Publish Campaign', command: 'execute', primary: true, icon: '🚀' },
          { label: 'View Receipt', command: 'show receipt', primary: false, icon: '📄' },
        ];
      } else if (anyFailed) {
        // Gate failed - show edit content
        return [
          { label: 'Edit Content & Fix', command: 'edit content', primary: true, icon: '✏️' },
          { label: 'View Details', command: 'show gate details', primary: false, icon: '🔍' },
        ];
      } else if (gates1And2Passed) {
        // Gates 1 & 2 passed, waiting for approval - use panel buttons
        return [
          { label: 'Approve in Panel →', command: '', primary: true, icon: '✅', disabled: true },
          { label: 'View Details', command: 'show gate details', primary: false, icon: '🔍' },
        ];
      } else {
        return [
          { label: 'View Details', command: 'show gate details', primary: false, icon: '🔍' },
        ];
      }
    }

    return [];
  };

  // Parse content into sections for better rendering
  const parseContent = (content: string) => {
    const sections: { type: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentSection = '';
    let currentType = 'text';

    lines.forEach(line => {
      if (line.startsWith('**') && line.endsWith('**')) {
        if (currentSection) sections.push({ type: currentType, content: currentSection.trim() });
        sections.push({ type: 'header', content: line.replace(/\*\*/g, '') });
        currentSection = '';
        currentType = 'text';
      } else if (line.startsWith('•') || line.startsWith('-')) {
        if (currentSection && currentType !== 'list') {
          sections.push({ type: currentType, content: currentSection.trim() });
          currentSection = '';
        }
        currentType = 'list';
        currentSection += line + '\n';
      } else if (line.match(/^\d+\./)) {
        if (currentSection && currentType !== 'steps') {
          sections.push({ type: currentType, content: currentSection.trim() });
          currentSection = '';
        }
        currentType = 'steps';
        currentSection += line + '\n';
      } else {
        if (currentType === 'list' || currentType === 'steps') {
          sections.push({ type: currentType, content: currentSection.trim() });
          currentSection = '';
          currentType = 'text';
        }
        currentSection += line + '\n';
      }
    });

    if (currentSection) sections.push({ type: currentType, content: currentSection.trim() });
    return sections;
  };

  // Conversation with messages
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {messages.map((message, msgIndex) => (
          <div key={message.id}>
            {message.type === 'user' && (
              <div className="flex justify-end mb-2">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-[#1E5ECC] text-white shadow-md">
                  <p className="text-[13px] font-medium">{message.content}</p>
                </div>
              </div>
            )}

            {message.type === 'assistant' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1E5ECC] flex items-center justify-center shadow-md">
                  <StarsIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  {/* Main Message Card */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    {/* Message Header - shows campaign type badge */}
                    {message.data?.campaignType && (
                      <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-2">
                        {message.data.campaignType === 'recovery' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                        {message.data.campaignType === 'referral' && <Star className="w-4 h-4 text-yellow-500" />}
                        {message.data.campaignType === 'conquest' && <Shield className="w-4 h-4 text-[#1E5ECC]" />}
                        {message.data.campaignType === 'win-back' && <RefreshCw className="w-4 h-4 text-blue-500" />}
                        {message.data.campaignType === 'custom' && <Sparkles className="w-4 h-4 text-[#1E5ECC]" />}
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          {(message.data.campaignLabel || message.data.campaignType.replace('-', ' '))} Campaign
                        </span>
                        {message.data.isCustomType && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#1E5ECC] text-[9px] font-semibold">
                            AI-DERIVED
                          </span>
                        )}
                        {message.data.brandScore && (
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            {message.data.brandScore}% Brand Score
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="px-4 py-3">
                      {parseContent(message.content).map((section, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          {section.type === 'header' && (
                            <h4 className="text-[13px] font-bold text-slate-900 mb-1">{section.content}</h4>
                          )}
                          {section.type === 'text' && section.content && (
                            <p className="text-[13px] text-slate-700 leading-relaxed">{section.content}</p>
                          )}
                          {section.type === 'list' && (
                            <div className="space-y-1 pl-1">
                              {section.content.split('\n').filter(l => l.trim()).map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-[12px] text-slate-600">
                                  <span className="text-[#1E5ECC] mt-0.5">•</span>
                                  <span>{item.replace(/^[•-]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {section.type === 'steps' && (
                            <div className="space-y-2 mt-2">
                              {section.content.split('\n').filter(l => l.trim()).map((step, i) => {
                                const match = step.match(/^(\d+)\.\s*(.+)/);
                                if (!match) return null;
                                return (
                                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="w-6 h-6 rounded-full bg-sky-100 text-[#1E5ECC] flex items-center justify-center text-[11px] font-bold">
                                      {match[1]}
                                    </div>
                                    <span className="text-[12px] text-slate-700">{match[2]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Campaign Stats Row */}
                    {message.data?.audienceSize && (
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Audience</span>
                            </div>
                            <p className="text-[15px] font-bold text-slate-900">{message.data.audienceSize.toLocaleString()}</p>
                          </div>
                          <div className="text-center border-l border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Channels</span>
                            </div>
                            <p className="text-[12px] font-semibold text-slate-900">{message.data.channel}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Status</span>
                            </div>
                            <p className="text-[12px] font-semibold text-[#1E5ECC]">{message.data.status || 'Draft'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WHAT CHANGED - THE DIFFERENTIATOR */}
                    {message.data?.whatChanged?.adjustments && message.data.whatChanged.adjustments.length > 0 && (
                      <div className="px-4 py-3 border-t border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <div className="flex items-center gap-2 mb-3">
                          <RefreshCw className="w-4 h-4 text-amber-600" />
                          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                            🔁 Adjustments Made Based on Performance Data
                          </p>
                        </div>
                        <div className="space-y-2">
                          {message.data.whatChanged.adjustments.map((adj: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/70 border border-amber-200">
                              <span className="text-lg">{adj.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-slate-800">{adj.text}</p>
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                  <span className="font-medium">Why:</span> {adj.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-[10px] text-amber-600 italic">
                          This demonstrates Memory, Causality, and Adaptation — the system learns from past campaigns.
                        </p>
                      </div>
                    )}

                    {/* FAILED CONTENT WITH REDLINES */}
                    {message.data?.failedContent && message.data?.failed && (() => {
                      // Extract problem words from failure reasons
                      const extractProblemWords = (reasons: string[]): string[] => {
                        const profanityList = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell', 'bastard', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'asshole', 'bullshit', 'goddamn', 'sex', 'sexual', 'explicit', 'porn', 'xxx', 'nude', 'erotic'];
                        const words: string[] = [];
                        reasons.forEach(reason => {
                          const lowerReason = reason.toLowerCase();
                          profanityList.forEach(word => {
                            if (lowerReason.includes(word)) words.push(word);
                          });
                          // Extract quoted words from reason like "word 'sex' found"
                          const quotedMatch = reason.match(/['"](\w+)['"]/);
                          if (quotedMatch) words.push(quotedMatch[1].toLowerCase());
                        });
                        return [...new Set(words)];
                      };

                      // Check if text contains any problem words
                      const containsProblem = (text: string, problemWords: string[]): boolean => {
                        if (!text) return false;
                        const lowerText = text.toLowerCase();
                        return problemWords.some(word => lowerText.includes(word));
                      };

                      // Highlight problem words in text
                      const highlightProblems = (text: string, problemWords: string[]): JSX.Element => {
                        if (!text || problemWords.length === 0) return <>{text}</>;

                        let result = text;
                        const regex = new RegExp(`\\b(${problemWords.join('|')})\\b`, 'gi');
                        const parts = text.split(regex);

                        return (
                          <>
                            {parts.map((part, i) => {
                              const isMatch = problemWords.some(w => w.toLowerCase() === part.toLowerCase());
                              return isMatch ? (
                                <span key={i} className="bg-red-200 text-red-800 underline decoration-red-600 decoration-2 font-semibold px-0.5 rounded">{part}</span>
                              ) : (
                                <span key={i}>{part}</span>
                              );
                            })}
                          </>
                        );
                      };

                      const problemWords = extractProblemWords(message.data.failureReasons || []);
                      const subjectHasProblem = containsProblem(message.data.failedContent.subject, problemWords);
                      const bodyHasProblem = containsProblem(message.data.failedContent.body, problemWords);
                      const ctaHasProblem = containsProblem(message.data.failedContent.cta, problemWords);

                      return (
                        <div className="px-4 py-3 border-t-2 border-red-300 bg-red-50">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-[11px] font-bold text-red-800 uppercase tracking-wide">
                              Content Needs Revision
                            </p>
                          </div>

                          {/* Failure Reasons */}
                          {message.data.failureReasons && message.data.failureReasons.length > 0 && (
                            <div className="mb-3 p-2 rounded-lg bg-red-100 border border-red-200">
                              <p className="text-[10px] font-semibold text-red-700 mb-1">Issue Found:</p>
                              {message.data.failureReasons.map((reason: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-red-700">
                                  <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Only show fields that have problems */}
                          {message.data.failedContent.subject && (
                            <div className={`mb-2 p-2 rounded-lg ${subjectHasProblem ? 'bg-white border-2 border-red-300 border-l-4 border-l-red-500' : 'bg-slate-50 border border-slate-200'}`}>
                              <p className={`text-[10px] mb-1 font-semibold ${subjectHasProblem ? 'text-red-500' : 'text-slate-500'}`}>
                                SUBJECT{subjectHasProblem ? ' (contains issue)' : ''}:
                              </p>
                              <p className="text-[12px] text-slate-800">
                                {subjectHasProblem ? highlightProblems(message.data.failedContent.subject, problemWords) : message.data.failedContent.subject}
                              </p>
                            </div>
                          )}

                          {message.data.failedContent.body && (
                            <div className={`mb-2 p-2 rounded-lg ${bodyHasProblem ? 'bg-white border-2 border-red-300 border-l-4 border-l-red-500' : 'bg-slate-50 border border-slate-200'}`}>
                              <p className={`text-[10px] mb-1 font-semibold ${bodyHasProblem ? 'text-red-500' : 'text-slate-500'}`}>
                                BODY{bodyHasProblem ? ' (contains issue)' : ''}:
                              </p>
                              <p className="text-[11px] text-slate-700 whitespace-pre-line">
                                {bodyHasProblem ? highlightProblems(message.data.failedContent.body, problemWords) : message.data.failedContent.body}
                              </p>
                            </div>
                          )}

                          {message.data.failedContent.cta && (
                            <div className={`mb-2 p-2 rounded-lg ${ctaHasProblem ? 'bg-white border-2 border-dashed border-red-300' : 'bg-slate-50 border border-dashed border-slate-300'}`}>
                              <p className={`text-[10px] mb-1 italic ${ctaHasProblem ? 'text-red-400' : 'text-slate-400'}`}>
                                Button text in email{ctaHasProblem ? ' (contains issue)' : ''}:
                              </p>
                              <p className="text-[11px] text-slate-600">
                                "{ctaHasProblem ? highlightProblems(message.data.failedContent.cta, problemWords) : message.data.failedContent.cta}"
                              </p>
                            </div>
                          )}

                          <p className="mt-3 text-[10px] text-red-600 font-medium">
                            Click "Edit Content & Fix" below to regenerate compliant content.
                          </p>
                        </div>
                      );
                    })()}

                    {/* Customer Preview (if has reviews) */}
                    {message.data?.reviews && message.data.reviews.length > 0 && (
                      <div className="px-4 py-3 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Real Customer Data</p>
                        <div className="space-y-2">
                          {message.data.reviews.slice(0, 2).map((review: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="text-[10px]">{review.rating}★</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-slate-900">{review.customerName}</p>
                                <p className="text-[10px] text-slate-600 truncate">"{review.review?.substring(0, 60)}..."</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fixed Content Section (after gate failure fix) */}
                    {message.data?.type === 'content_fixed' && message.data?.content && (
                      <div className="px-4 py-3 border-t-2 border-emerald-300 bg-emerald-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                            Corrected Content
                          </p>
                          {message.data.removedWords && message.data.removedWords.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[9px] font-medium">
                              Removed: {message.data.removedWords.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Subject */}
                        {message.data.content.subject && (
                          <div className="mb-2 p-2 rounded-lg bg-white border border-emerald-200">
                            <p className="text-[10px] text-emerald-600 mb-1 font-semibold">SUBJECT:</p>
                            <p className="text-[12px] text-slate-800">{message.data.content.subject}</p>
                          </div>
                        )}

                        {/* Body */}
                        {message.data.content.body && (
                          <div className="mb-2 p-2 rounded-lg bg-white border border-emerald-200">
                            <p className="text-[10px] text-emerald-600 mb-1 font-semibold">BODY:</p>
                            <p className="text-[11px] text-slate-700 whitespace-pre-line">{message.data.content.body}</p>
                          </div>
                        )}

                        {/* CTA */}
                        {message.data.content.cta && (
                          <div className="mb-2 p-2 rounded-lg bg-white border border-dashed border-emerald-300">
                            <p className="text-[10px] text-emerald-500 mb-1 italic">Button text in email:</p>
                            <p className="text-[11px] text-slate-600">"{message.data.content.cta}"</p>
                          </div>
                        )}

                        <p className="mt-3 text-[10px] text-emerald-700 font-medium">
                          Content cleaned. Click "Resubmit for Review" to validate again.
                        </p>
                      </div>
                    )}

                    {/* Editable Content Section - Multi-Channel Support */}
                    {message.data?.content && message.data?.type !== 'content_fixed' && (
                      <div className="px-4 py-3 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          Generated Content
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px]">Click to edit</span>
                        </p>

                        {/* Email Section - Check for both formats */}
                        {(message.data.content.email || message.data.content.subject) && (
                          <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Mail className="w-4 h-4 text-[#1E5ECC]" />
                              <span className="text-[11px] font-bold text-[#1E5ECC] uppercase">Email</span>
                            </div>

                            {/* Subject Field */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">Subject</span>
                                {editingField?.messageId !== message.id || editingField?.field !== 'subject' ? (
                                  <button
                                    onClick={() => startEditing(message.id, 'subject', message.data.content.email?.subject || message.data.content.subject || '')}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#1E5ECC] hover:bg-sky-100 transition-all"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                  </button>
                                ) : null}
                              </div>
                              {editingField?.messageId === message.id && editingField?.field === 'subject' ? (
                                <div className="flex gap-2">
                                  <textarea
                                    ref={editInputRef}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    rows={1}
                                    className="flex-1 px-3 py-2 text-[12px] border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E5ECC] resize-none bg-white"
                                  />
                                  <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => startEditing(message.id, 'subject', message.data.content.email?.subject || message.data.content.subject || '')}
                                  className="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-300 cursor-pointer transition-all group"
                                >
                                  <p className="text-[12px] font-semibold text-slate-800 group-hover:text-[#1E5ECC]">
                                    {message.data.content.email?.subject || message.data.content.subject || 'No subject'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Body Field */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">Body</span>
                                {editingField?.messageId !== message.id || editingField?.field !== 'body' ? (
                                  <button
                                    onClick={() => startEditing(message.id, 'body', message.data.content.email?.body || message.data.content.body || '')}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#1E5ECC] hover:bg-sky-100 transition-all"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                  </button>
                                ) : null}
                              </div>
                              {editingField?.messageId === message.id && editingField?.field === 'body' ? (
                                <div className="flex gap-2">
                                  <textarea
                                    ref={editInputRef}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    rows={4}
                                    className="flex-1 px-3 py-2 text-[12px] border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E5ECC] resize-y bg-white"
                                  />
                                  <div className="flex flex-col gap-2">
                                    <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => startEditing(message.id, 'body', message.data.content.email?.body || message.data.content.body || '')}
                                  className="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-300 cursor-pointer transition-all group max-h-24 overflow-y-auto"
                                >
                                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap group-hover:text-[#1E5ECC]">
                                    {(message.data.content.email?.body || message.data.content.body || 'No body')?.substring(0, 200)}
                                    {((message.data.content.email?.body || message.data.content.body)?.length || 0) > 200 && '...'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* CTA Field */}
                            {(message.data.content.email?.cta || message.data.content.cta) && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase">CTA Button</span>
                                  {editingField?.messageId !== message.id || editingField?.field !== 'cta' ? (
                                    <button
                                      onClick={() => startEditing(message.id, 'cta', message.data.content.email?.cta || message.data.content.cta || '')}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#1E5ECC] hover:bg-sky-100 transition-all"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      Edit
                                    </button>
                                  ) : null}
                                </div>
                                {editingField?.messageId === message.id && editingField?.field === 'cta' ? (
                                  <div className="flex gap-2">
                                    <textarea
                                      ref={editInputRef}
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={handleEditKeyDown}
                                      rows={1}
                                      className="flex-1 px-3 py-2 text-[12px] border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E5ECC] resize-none bg-white"
                                    />
                                    <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => startEditing(message.id, 'cta', message.data.content.email?.cta || message.data.content.cta || '')}
                                    className="inline-block px-4 py-2 rounded-lg bg-[#1E5ECC] text-white text-[11px] font-semibold cursor-pointer hover:bg-[#1a4fad] transition-all"
                                  >
                                    {message.data.content.email?.cta || message.data.content.cta}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SMS Section */}
                        {message.data.content.sms && (
                          <div className="mb-4 p-3 rounded-lg bg-teal-50 border border-teal-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📱</span>
                                <span className="text-[11px] font-bold text-teal-800 uppercase">SMS</span>
                              </div>
                              <span className={`text-[10px] font-medium ${message.data.content.sms.message.length > 160 ? 'text-red-600' : 'text-teal-600'}`}>
                                {message.data.content.sms.message.length}/160
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Message</span>
                              {editingField?.messageId !== message.id || editingField?.field !== 'sms' ? (
                                <button
                                  onClick={() => startEditing(message.id, 'sms', message.data.content.sms.message || '')}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-teal-600 hover:bg-teal-100 transition-all"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                              ) : null}
                            </div>
                            {editingField?.messageId === message.id && editingField?.field === 'sms' ? (
                              <div className="flex gap-2">
                                <textarea
                                  ref={editInputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  rows={3}
                                  maxLength={160}
                                  className="flex-1 px-3 py-2 text-[12px] border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white"
                                />
                                <div className="flex flex-col gap-2">
                                  <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => startEditing(message.id, 'sms', message.data.content.sms.message || '')}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-300 cursor-pointer transition-all group"
                              >
                                <p className="text-[12px] text-slate-800 group-hover:text-teal-700">
                                  {message.data.content.sms.message}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Social Section */}
                        {message.data.content.social && (
                          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">📸</span>
                              <span className="text-[11px] font-bold text-pink-800 uppercase">Social Post</span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Caption</span>
                              {editingField?.messageId !== message.id || editingField?.field !== 'social' ? (
                                <button
                                  onClick={() => startEditing(message.id, 'social', message.data.content.social.post || '')}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-pink-600 hover:bg-pink-100 transition-all"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                              ) : null}
                            </div>
                            {editingField?.messageId === message.id && editingField?.field === 'social' ? (
                              <div className="flex gap-2">
                                <textarea
                                  ref={editInputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  rows={3}
                                  className="flex-1 px-3 py-2 text-[12px] border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y bg-white"
                                />
                                <div className="flex flex-col gap-2">
                                  <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => startEditing(message.id, 'social', message.data.content.social.post || '')}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-pink-300 cursor-pointer transition-all group"
                              >
                                <p className="text-[12px] text-slate-800 group-hover:text-pink-700 mb-2">
                                  {message.data.content.social.post}
                                </p>
                                {message.data.content.social.hashtags && message.data.content.social.hashtags.length > 0 && (
                                  <p className="text-[11px] text-pink-600">
                                    {message.data.content.social.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons - Always show next steps */}
                    {getNextActions(message.data).length > 0 && (
                      <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-t border-sky-100">
                        <p className="text-[10px] font-bold text-[#1E5ECC] uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          Next Steps
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getNextActions(message.data).map((action, i) => (
                            <button
                              key={i}
                              onClick={() => onTemplateClick?.(action.command)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                                action.primary
                                  ? 'bg-[#1E5ECC] text-white hover:bg-[#1a4fad] shadow-sm'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-300 hover:text-[#1E5ECC]'
                              }`}
                            >
                              <span>{action.icon}</span>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {message.type === 'system' && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium">
                  <div className="w-2 h-2 rounded-full bg-[#1E5ECC] animate-pulse" />
                  {message.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#1E5ECC] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#1E5ECC] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#1E5ECC] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] text-slate-600">TrustEye is thinking...</span>
            </div>
          </div>
        )}

        {/* Scroll anchor - auto-scroll target */}
        <div ref={feedEndRef} />
      </div>

      {/* Sticky Action Bar - Shows latest actions at bottom */}
      {(() => {
        // Find the last message with actions
        const lastMsgWithActions = [...messages].reverse().find(m => getNextActions(m.data).length > 0);
        const actions = lastMsgWithActions ? getNextActions(lastMsgWithActions.data) : [];
        if (actions.length === 0) return null;

        return (
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-lg p-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Next Steps
                </p>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => !action.disabled && onTemplateClick?.(action.command)}
                      disabled={action.disabled}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                        action.disabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : action.primary
                          ? 'bg-[#1E5ECC] text-white hover:bg-[#1a4fad] shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-300 hover:text-[#1E5ECC]'
                      }`}
                    >
                      <span>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}