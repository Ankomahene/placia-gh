'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary bg-background',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted-foreground/30 text-muted-foreground bg-background'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      stepNumber < currentStep
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-primary',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
