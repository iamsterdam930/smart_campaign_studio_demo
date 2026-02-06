
import React from 'react';
import { Check } from 'lucide-react';
import { translations } from '../i18n';

interface StepIndicatorProps {
  currentStep: number;
  lang: 'zh' | 'en'; // Kept for interface compatibility but ignored logic
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const t = translations;

  const steps = [
    { id: 1, name: t["step.1"] },
    { id: 2, name: t["step.2"] },
    { id: 3, name: t["step.3"] },
    { id: 4, name: t["step.4"] },
  ];

  return (
    <div className="w-full py-6 px-4 bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-brand-blue text-white'
                        : isCurrent
                        ? 'bg-white border-2 border-brand-blue text-brand-blue'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check size={20} /> : step.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent || isCompleted ? 'text-brand-blue' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 -mt-6 transition-all duration-300 ${
                      isCompleted ? 'bg-brand-blue' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
