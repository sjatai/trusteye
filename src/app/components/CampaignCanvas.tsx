import { useState } from 'react';
import { Plus } from 'lucide-react';
import { StepCard } from './StepCard';
import { Button } from './ui/button';
import exampleImage from 'figma:asset/eceecdf2fa1337ed6ae08fdacc4012bc6cf4bae8.png';

interface CampaignCanvasProps {
  onStepSelect: (stepId: string | null) => void;
  onAddStep: () => void;
  selectedStepId: string | null;
}

export function CampaignCanvas({ onStepSelect, onAddStep, selectedStepId }: CampaignCanvasProps) {
  const steps = [
    {
      id: 'step-1',
      channel: 'email' as const,
      title: 'VIP Email',
      schedule: 'Feb 27 at 10:00 am',
      preview: '🌸 New Spring Collection is here 🌸',
      status: 'sent' as const,
      imageUrl: exampleImage,
    },
    {
      id: 'step-2',
      channel: 'sms' as const,
      title: 'VIP SMS',
      schedule: 'Feb 27 at 12:00 pm',
      preview: 'Find your perfect new workout wear for Spring 👟💪 🏋️ 🌸🌈\n\nReply QUIZ to answer 3 quick questions and we\'ll find the perfect gear for you.',
      status: 'sent' as const,
    },
  ];

  return (
    <div className="flex-1 bg-slate-50/30 px-8 py-8 overflow-y-auto h-[calc(100vh-73px)]">
      <div className="max-w-[680px] mx-auto space-y-6">
        {/* Journey Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id}>
              <StepCard
                {...step}
                isSelected={selectedStepId === step.id}
                onClick={() => onStepSelect(step.id)}
              />
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-px h-8 bg-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Step Button */}
        <div className="flex justify-center pt-2">
          <Button
            onClick={onAddStep}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-slate-300">
              <Plus className="w-3 h-3 text-slate-600" />
            </div>
            <span className="text-[14px] font-semibold">Add step</span>
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center text-[12px] text-slate-500 pt-4">
          Add more journey steps to create a multi-channel campaign
        </div>
      </div>
    </div>
  );
}