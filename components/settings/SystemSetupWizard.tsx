'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useSettingsStore } from '@/lib/stores/settings';

interface SystemSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemSetupWizard({ isOpen, onClose }: SystemSetupWizardProps) {
  const settings = useSettingsStore();
  const [step, setStep] = useState(1);
  const [systemName, setSystemName] = useState(settings.systemName || 'Oyama');
  const [userName, setUserName] = useState(settings.userName || 'User');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    settings.updateSettings({
      systemName,
      userName,
      systemPrompt: settings.systemPrompt.replace(/Oyama/g, systemName).replace(/user/gi, userName),
    });
    onClose();
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">System Setup</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2 flex-1 rounded-full transition-colors ${
                stepNum <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Welcome!</h3>
            <p className="text-sm text-muted-foreground">
              Let's personalize your AI assistant experience. This wizard will help you customize how the system refers to itself and you.
            </p>
            <div className="bg-secondary/50 border border-border rounded p-4 mt-4">
              <p className="text-sm">
                We'll set up:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>System name (what to call your AI)</li>
                <li>Your identifier (what the AI calls you)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: System Name */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What should we call your AI assistant?</h3>
            <p className="text-sm text-muted-foreground">
              This is how the system will refer to itself in conversations.
            </p>
            <div>
              <Label htmlFor="system-name" className="block mb-2">
                System Name
              </Label>
              <Input
                id="system-name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g., Oyama, Assistant, Claude"
                className="mt-1"
              />
            </div>
            <div className="bg-secondary/50 border border-border rounded p-3 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Example:</strong> "I'm {systemName}, your AI assistant"
              </p>
            </div>
          </div>
        )}

        {/* Step 3: User Name */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How should we refer to you?</h3>
            <p className="text-sm text-muted-foreground">
              This is what the AI will call you in conversations.
            </p>
            <div>
              <Label htmlFor="user-name" className="block mb-2">
                Your Identifier
              </Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., User, James, Developer"
                className="mt-1"
              />
            </div>
            <div className="bg-secondary/50 border border-border rounded p-3 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Example:</strong> "Thanks for the question, {userName}!"
              </p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={step === 1 ? onClose : handleBack}
            className="flex-1"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {step === 3 ? 'Complete' : 'Next'}
          </Button>
        </div>

        {/* Step indicator text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Step {step} of 3
        </p>
      </div>
    </div>
  );
}
