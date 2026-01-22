import { Play, Plus, MoreVertical, Zap, Clock, CheckCircle2, Users, Mail, Database, Pause, Loader2, AlertCircle, RefreshCw, AlertTriangle, MessageSquare, Wrench, Droplet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { rulesApi, automationsApi } from '@/app/lib/api';
import type { Rule as APIRule } from '@/app/lib/api';
import { CreateAutomationModal } from '@/app/components/CreateAutomationModal';

// Tooltip component for disabled buttons
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  icon: any;
  title: string;
  description: string;
  color: string;
}

interface AutomationMetrics {
  openRate: number;
  sendCount: number;
  lastRun: string;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  nodes: WorkflowNode[];
  executions: number;
  lastRun?: string;
  performanceStatus?: 'green' | 'yellow' | 'red';
  metrics?: AutomationMetrics;
}

// Map trigger types to icons and colors
const triggerConfig: Record<string, { icon: any; title: string; color: string }> = {
  review: { icon: CheckCircle2, title: 'New Review', color: 'sky' },
  purchase: { icon: Database, title: 'Purchase Made', color: 'emerald' },
  signup: { icon: Users, title: 'New Signup', color: 'sky' },
  inactivity: { icon: Clock, title: 'User Inactive', color: 'amber' },
  appointment: { icon: Clock, title: 'Appointment', color: 'teal' },
  service_due: { icon: Wrench, title: 'Service Due', color: 'purple' },
  oil_change_due: { icon: Droplet, title: 'Oil Change Due', color: 'amber' },
  custom: { icon: Zap, title: 'Custom Trigger', color: 'purple' }
};

// Map action types to icons and colors
const actionConfig: Record<string, { icon: any; color: string }> = {
  send_email: { icon: Mail, color: 'emerald' },
  send_sms: { icon: Mail, color: 'teal' },
  send_slack: { icon: MessageSquare, color: 'purple' },
  create_campaign: { icon: Zap, color: 'sky' },
  add_to_audience: { icon: Users, color: 'teal' },
  update_crm: { icon: Database, color: 'sky' },
  wait: { icon: Clock, color: 'amber' },
  default: { icon: Zap, color: 'slate' }
};

// Transform API rule to UI automation
function transformRule(apiRule: APIRule): Automation {
  const trigger = triggerConfig[apiRule.trigger_type] || triggerConfig.custom;

  const nodes: WorkflowNode[] = [
    {
      id: `${apiRule.id}-trigger`,
      type: 'trigger',
      icon: trigger.icon,
      title: trigger.title,
      description: Object.keys(apiRule.trigger_conditions || {}).join(', ') || 'When triggered',
      color: trigger.color
    },
    ...apiRule.actions.map((action, idx) => {
      const config = actionConfig[action.type] || actionConfig.default;
      return {
        id: `${apiRule.id}-action-${idx}`,
        type: 'action' as const,
        icon: config.icon,
        title: action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: Object.values(action.config || {}).join(', ') || 'Execute action',
        color: config.color
      };
    })
  ];

  return {
    id: apiRule.id,
    name: apiRule.name,
    status: apiRule.is_active ? 'active' : 'paused',
    nodes,
    executions: Math.floor(Math.random() * 2000), // Simulated for demo
    lastRun: apiRule.updated_at ? `${Math.floor(Math.random() * 60)} min ago` : undefined
  };
}

// Transform automation template from API to UI automation
function transformAutomationTemplate(template: any): Automation {
  const trigger = triggerConfig[template.trigger?.type] || triggerConfig.custom;

  const nodes: WorkflowNode[] = [
    {
      id: `${template.id}-trigger`,
      type: 'trigger',
      icon: trigger.icon,
      title: trigger.title,
      description: template.trigger?.conditions ?
        Object.entries(template.trigger.conditions).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ') :
        'When triggered',
      color: trigger.color
    },
    ...(template.actions || []).map((action: any, idx: number) => {
      const config = actionConfig[action.type] || actionConfig.default;
      return {
        id: `${template.id}-action-${idx}`,
        type: 'action' as const,
        icon: config.icon,
        title: action.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: action.config?.subject || action.config?.channel || action.config?.template || 'Execute action',
        color: config.color
      };
    })
  ];

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    status: template.isActive ? 'active' : 'paused',
    nodes,
    executions: template.metrics?.sendCount || template.executionCount || 0,
    lastRun: template.metrics?.lastRun || undefined,
    performanceStatus: template.performanceStatus,
    metrics: template.metrics
  };
}

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch automations from API
  const fetchAutomations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try automations API first (has performance data)
      const response = await automationsApi.list();
      if (response.success && response.data) {
        setAutomations(response.data.map(transformAutomationTemplate));
      } else {
        // Fallback to rules API
        const rulesResponse = await rulesApi.list();
        if (rulesResponse.success && rulesResponse.data) {
          setAutomations(rulesResponse.data.map(transformRule));
        } else {
          setError(rulesResponse.error || 'Failed to load automations');
        }
      }
    } catch (err) {
      // Try rules API as fallback
      try {
        const rulesResponse = await rulesApi.list();
        if (rulesResponse.success && rulesResponse.data) {
          setAutomations(rulesResponse.data.map(transformRule));
        } else {
          setError('Failed to connect to server');
        }
      } catch {
        setError('Failed to connect to server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  // Handle toggle automation status
  const handleToggle = async (automation: Automation) => {
    setTogglingId(automation.id);
    try {
      const response = await rulesApi.toggle(automation.id);
      if (response.success) {
        setAutomations(prev => prev.map(a =>
          a.id === automation.id
            ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
            : a
        ));
      } else {
        setError(response.error || 'Failed to toggle automation');
      }
    } catch (err) {
      setError('Failed to toggle automation');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle create new automation - opens modal
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  // Handle automation created from modal
  const handleAutomationCreated = (newAutomation: any) => {
    const transformed = transformAutomationTemplate(newAutomation);
    setAutomations(prev => [transformed, ...prev]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-600">Loading automations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] text-red-600 font-semibold hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">Automations</h1>
            <p className="text-[13px] text-slate-600">
              {automations.length} automation{automations.length !== 1 ? 's' : ''} • {automations.filter(a => a.status === 'active').length} active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAutomations}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              title="Refresh"
              aria-label="Refresh automations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Loop Warning Banner */}
      {automations.some(a => a.performanceStatus === 'red' || a.performanceStatus === 'yellow') && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-amber-800">
                Feedback Loop Alert
              </p>
              <p className="text-[12px] text-amber-700">
                {automations.filter(a => a.performanceStatus === 'red').length > 0 && (
                  <span>{automations.filter(a => a.performanceStatus === 'red').length} automation(s) underperforming. </span>
                )}
                {automations.filter(a => a.performanceStatus === 'yellow').length > 0 && (
                  <span>{automations.filter(a => a.performanceStatus === 'yellow').length} automation(s) need attention. </span>
                )}
                The system has flagged these for review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {automations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Zap className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-2">No automations yet</h3>
          <p className="text-[13px] text-slate-600 mb-4">
            Create your first automation to streamline your marketing workflows
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all"
          >
            Create Automation
          </button>
        </div>
      )}

      {/* Automation Cards */}
      <div className="space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">{automation.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        automation.status === 'active'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : automation.status === 'paused'
                          ? 'bg-amber-50 border border-amber-200 text-amber-700'
                          : 'bg-slate-50 border border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        automation.status === 'active' ? 'bg-emerald-500' :
                        automation.status === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      {automation.status}
                    </span>
                    {/* Performance Indicator */}
                    {automation.performanceStatus && automation.metrics && (
                      <Tooltip text={
                        automation.performanceStatus === 'green' ? 'Performing well' :
                        automation.performanceStatus === 'yellow' ? 'Needs attention' :
                        'Underperforming - review recommended'
                      }>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-help ${
                            automation.performanceStatus === 'green'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : automation.performanceStatus === 'yellow'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-red-50 border border-red-200 text-red-700'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            automation.performanceStatus === 'green' ? 'bg-emerald-500' :
                            automation.performanceStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {automation.metrics.openRate}% open rate
                        </span>
                      </Tooltip>
                    )}
                    <span className="text-[11px] text-slate-500">
                      {automation.executions.toLocaleString()} runs
                    </span>
                    {automation.lastRun && (
                      <>
                        <span className="text-[11px] text-slate-500">•</span>
                        <span className="text-[11px] text-slate-500">{automation.lastRun}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(automation)}
                  disabled={togglingId === automation.id}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                    automation.status === 'active'
                      ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  } disabled:opacity-50`}
                  aria-label={automation.status === 'active' ? 'Pause automation' : 'Start automation'}
                >
                  {togglingId === automation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : automation.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <Tooltip text="Coming soon">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 cursor-not-allowed"
                    aria-label="More actions - coming soon"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Visual Workflow - n8n/Zapier style */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {automation.nodes.map((node, index) => {
                const Icon = node.icon;
                const colorClasses = {
                  sky: 'bg-sky-50 border-sky-200 text-sky-700',
                  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  teal: 'bg-teal-50 border-teal-200 text-teal-700',
                  amber: 'bg-amber-50 border-amber-200 text-amber-700',
                  purple: 'bg-purple-50 border-purple-200 text-purple-700',
                  slate: 'bg-slate-50 border-slate-200 text-slate-700',
                };

                return (
                  <div key={node.id} className="flex items-center">
                    {/* Node */}
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${colorClasses[node.color as keyof typeof colorClasses] || colorClasses.slate} min-w-[200px]`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        node.color === 'sky' ? 'bg-sky-100' :
                        node.color === 'emerald' ? 'bg-emerald-100' :
                        node.color === 'teal' ? 'bg-teal-100' :
                        node.color === 'amber' ? 'bg-amber-100' :
                        node.color === 'purple' ? 'bg-purple-100' :
                        'bg-slate-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold truncate">{node.title}</p>
                        <p className="text-[10px] opacity-70 truncate">{node.description}</p>
                      </div>
                    </div>

                    {/* Arrow Connector */}
                    {index < automation.nodes.length - 1 && (
                      <div className="flex items-center px-2">
                        <div className="w-6 h-[2px] bg-slate-300 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-slate-300 border-y-[3px] border-y-transparent" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Step Button */}
              <div className="flex items-center pl-2">
                <button className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Template */}
      {automations.length > 0 && (
        <div className="mt-6 p-8 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-300 transition-all">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
              <Zap className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
              Create Another Automation
            </h3>
            <p className="text-[13px] text-slate-600 mb-4">
              Build visual workflows with triggers, actions, and conditions
            </p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all"
            >
              Browse Templates
            </button>
          </div>
        </div>
      )}

      {/* Create Automation Modal */}
      <CreateAutomationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAutomationCreated}
      />
    </div>
  );
}
