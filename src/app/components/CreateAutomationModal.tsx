import { useState } from 'react';
import { Modal } from './Modal';
import { Loader2, Zap, Mail, MessageSquare, Users, CheckCircle2, Clock, Wrench, Droplet, Database } from 'lucide-react';
import { automationsApi } from '@/app/lib/api';

interface CreateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (automation: any) => void;
}

// Trigger type options
const TRIGGER_TYPES = [
  { value: 'review', label: 'New 5-star review', icon: CheckCircle2, color: 'sky', conditions: { rating: { min: 5 } } },
  { value: 'review_negative', label: 'New 1-2 star review', icon: CheckCircle2, color: 'red', conditions: { rating: { max: 2 } } },
  { value: 'inactivity', label: 'Customer inactive 30+ days', icon: Clock, color: 'amber', conditions: { inactiveDays: 30 } },
  { value: 'service_due', label: 'Service due (6+ months)', icon: Wrench, color: 'purple', conditions: { lastServiceMonths: 6 } },
  { value: 'oil_change_due', label: 'Oil change due (4+ months)', icon: Droplet, color: 'amber', conditions: { lastOilChangeMonths: 4 } },
  { value: 'appointment', label: 'Appointment completed', icon: Clock, color: 'teal', conditions: { status: 'completed' } },
  { value: 'signup', label: 'New customer signup', icon: Users, color: 'sky', conditions: {} },
];

// Action type options
const ACTION_TYPES = [
  { value: 'send_email', label: 'Send email', icon: Mail, color: 'emerald' },
  { value: 'send_slack', label: 'Send Slack notification', icon: MessageSquare, color: 'purple' },
  { value: 'create_campaign', label: 'Create campaign', icon: Zap, color: 'sky' },
  { value: 'add_to_audience', label: 'Add to audience', icon: Users, color: 'teal' },
  { value: 'update_crm', label: 'Update CRM', icon: Database, color: 'sky' },
];

// Email templates
const EMAIL_TEMPLATES = [
  { value: 'thank_you', label: 'Thank You Email' },
  { value: 'recovery', label: 'Recovery Email' },
  { value: 'service_reminder', label: 'Service Reminder' },
  { value: 'oil_change_reminder', label: 'Oil Change Reminder' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'winback', label: 'Win-back Email' },
  { value: 'custom', label: 'Create with AI' },
];

export function CreateAutomationModal({ isOpen, onClose, onCreated }: CreateAutomationModalProps) {
  const [name, setName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a name for the automation');
      return;
    }
    if (!selectedTrigger) {
      setError('Please select a trigger');
      return;
    }
    if (!selectedAction) {
      setError('Please select an action');
      return;
    }

    setIsSubmitting(true);

    try {
      const triggerConfig = TRIGGER_TYPES.find(t => t.value === selectedTrigger || t.value === 'review_negative' && selectedTrigger === 'review_negative');
      const actualTriggerType = selectedTrigger === 'review_negative' ? 'review' : selectedTrigger;

      const automationData = {
        name,
        description: `Automation triggered by ${triggerConfig?.label || selectedTrigger}`,
        trigger: {
          type: actualTriggerType,
          source: ['review', 'review_negative'].includes(selectedTrigger) ? 'birdeye' : 'internal',
          conditions: triggerConfig?.conditions || {},
        },
        actions: [
          {
            type: selectedAction,
            config: selectedAction === 'send_email' ? {
              template: selectedTemplate || 'custom',
              subject: `${name} - Automated Email`,
            } : selectedAction === 'send_slack' ? {
              channel: '#marketing-alerts',
              message: `Automation "${name}" triggered`,
            } : {},
          },
        ],
        isActive,
      };

      const response = await automationsApi.create(automationData);

      if (response.success && response.data) {
        onCreated(response.data);
        // Reset form
        setName('');
        setSelectedTrigger('');
        setSelectedAction('');
        setSelectedTemplate('');
        setIsActive(true);
        onClose();
      } else {
        setError(response.error || 'Failed to create automation');
      }
    } catch (err) {
      setError('Failed to create automation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTriggerConfig = TRIGGER_TYPES.find(t => t.value === selectedTrigger);
  const selectedActionConfig = ACTION_TYPES.find(a => a.value === selectedAction);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Automation" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">
            Automation Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 5-Star Review Thank You"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[14px] placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
          />
        </div>

        {/* Trigger Type */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">
            When this happens...
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_TYPES.map((trigger) => {
              const Icon = trigger.icon;
              const isSelected = selectedTrigger === trigger.value;
              return (
                <button
                  key={trigger.value}
                  type="button"
                  onClick={() => setSelectedTrigger(trigger.value)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    trigger.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                    trigger.color === 'red' ? 'bg-red-100 text-red-600' :
                    trigger.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                    trigger.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    trigger.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700">{trigger.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">
            Do this...
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_TYPES.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.value;
              return (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setSelectedAction(action.value)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    action.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                    action.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    action.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                    action.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Template (only shown if action is send_email) */}
        {selectedAction === 'send_email' && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
              Email Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[14px] focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all bg-white"
            >
              <option value="">Select a template...</option>
              {EMAIL_TEMPLATES.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Activate Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <p className="text-[13px] font-semibold text-slate-700">Activate Immediately</p>
            <p className="text-[11px] text-slate-500">Start running this automation right away</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-all ${
              isActive ? 'bg-sky-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isActive ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Preview */}
        {selectedTrigger && selectedAction && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200">
            <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wide mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedTriggerConfig?.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                selectedTriggerConfig?.color === 'red' ? 'bg-red-100 text-red-600' :
                selectedTriggerConfig?.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                selectedTriggerConfig?.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {selectedTriggerConfig && <selectedTriggerConfig.icon className="w-4 h-4" />}
              </div>
              <div className="w-6 h-[2px] bg-slate-300 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-slate-300 border-y-[2px] border-y-transparent" />
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedActionConfig?.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                selectedActionConfig?.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                selectedActionConfig?.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {selectedActionConfig && <selectedActionConfig.icon className="w-4 h-4" />}
              </div>
              <p className="text-[12px] text-slate-600 ml-2">
                When <span className="font-semibold">{selectedTriggerConfig?.label}</span> → <span className="font-semibold">{selectedActionConfig?.label}</span>
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Create Automation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
