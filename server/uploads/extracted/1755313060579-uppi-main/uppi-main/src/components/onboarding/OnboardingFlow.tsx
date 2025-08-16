import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { GoalsStep } from './steps/GoalsStep';
import { ApiKeysStep } from './steps/ApiKeysStep';
import { FinalStep } from './steps/FinalStep';

interface OnboardingData {
  fullName: string;
  jobTitle: string;
  companySize: string;
  primaryGoals: string[];
  apiKeysSetup: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'profile', title: 'Profile', component: ProfileSetupStep },
  { id: 'goals', title: 'Goals', component: GoalsStep },
  { id: 'api-keys', title: 'API Keys', component: ApiKeysStep },
  { id: 'final', title: 'Complete', component: FinalStep },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({
    primaryGoals: [],
    apiKeysSetup: false
  });

  const CurrentStepComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data as OnboardingData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Profile step
        return data.fullName && data.jobTitle && data.companySize;
      case 2: // Goals step
        return data.primaryGoals && data.primaryGoals.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-0">
          {/* Progress Header */}
          <div className="p-6 border-b bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome to Uppi.ai
              </h1>
              {onSkip && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </Button>
              )}
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center space-x-2 mb-4">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all",
                      index <= currentStep
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                      index < currentStep && "cursor-pointer",
                      index > currentStep && "cursor-not-allowed"
                    )}
                    disabled={index > currentStep}
                  >
                    {index + 1}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full transition-colors",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </p>
          </div>

          {/* Step Content */}
          <div className="p-6 min-h-[400px]">
            <CurrentStepComponent 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
            />
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-card/50">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
                size="lg"
              >
                {isLastStep ? 'Complete Setup' : 'Continue'}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};