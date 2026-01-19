'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useSettingsStore, generateSystemPrompt } from '@/lib/stores/settings';

interface SystemSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERSONALITY_TRAITS = [
  'thoughtful', 'insightful', 'collaborative', 'creative',
  'analytical', 'patient', 'enthusiastic', 'pragmatic',
  'witty', 'empathetic', 'direct', 'nuanced'
];

const RELATIONSHIP_OPTIONS = [
  {
    id: 'partnership',
    label: 'Partnership',
    description: 'Equal collaborators working together',
    color: 'blue'
  },
  {
    id: 'work',
    label: 'Work',
    description: 'Professional assistant for tasks',
    color: 'violet'
  },
  {
    id: 'learning',
    label: 'Learning',
    description: 'Patient educator helping you grow',
    color: 'green'
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Creative collaborator & brainstormer',
    color: 'pink'
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Friendly companion for conversation',
    color: 'amber'
  },
];

const COMMUNICATION_STYLES = [
  {
    id: 'formal',
    label: 'Formal',
    description: 'Professional, structured, precise',
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'Natural, friendly, asks questions',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, encouraging',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Business-focused, clear, efficient',
  },
];

export function SystemSetupWizard({ isOpen, onClose }: SystemSetupWizardProps) {
  const settings = useSettingsStore();
  const [step, setStep] = useState(1);
  
  const [systemName, setSystemName] = useState(settings.systemName || 'Oyama');
  const [userName, setUserName] = useState(settings.userName || 'User');
  const [relationshipType, setRelationshipType] = useState<'partnership' | 'work' | 'learning' | 'creative' | 'casual'>(
    settings.relationshipType || 'partnership'
  );
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    settings.personalityTraits || ['thoughtful', 'insightful', 'collaborative']
  );
  const [communicationStyle, setCommunicationStyle] = useState<'formal' | 'conversational' | 'friendly' | 'professional'>(
    settings.communicationStyle || 'conversational'
  );
  const [partnerMode, setPartnerMode] = useState(settings.partnerMode || false);
  const [partnerName, setPartnerName] = useState(settings.partnerName || 'Partner');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female' | 'neutral'>(settings.partnerGender || 'neutral');
  const [customPrompt, setCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState(settings.systemPrompt);

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const handleNext = () => {
    if (step < 7) {
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
    const newSettings = {
      systemName,
      userName,
      relationshipType,
      personalityTraits: selectedTraits,
      communicationStyle,
      partnerMode,
      partnerName,
      partnerGender,
      systemPrompt: customPrompt ? customPromptText : generateSystemPrompt(
        systemName,
        userName,
        relationshipType,
        selectedTraits,
        communicationStyle,
        partnerMode,
        partnerGender,
        partnerName
      ),
    };

    settings.updateSettings(newSettings);
    onClose();
    setStep(1);
  };

  if (!isOpen) return null;

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20',
      violet: 'border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20',
      green: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20',
      pink: 'border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20',
      amber: 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20',
    };
    return colors[color] || 'border-primary/50 bg-primary/10 hover:bg-primary/20';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-background/95 border border-border/60 rounded-xl p-8 max-w-2xl w-full mx-4 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Personalize Your AI Assistant</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2 flex-1 rounded-full transition-colors ${
                stepNum <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Welcome!</h3>
            <p className="text-sm text-muted-foreground">
              Let's create a truly personalized AI experience. This wizard will help you define not just names, but the personality and relationship type with your assistant.
            </p>
            <div className="bg-muted/40 border border-border/60 rounded-lg p-4 mt-4 space-y-2">
              <p className="text-sm font-medium">We'll configure:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Names (system & yours)</li>
                <li>Relationship type (partnership, work, learning, creative, casual)</li>
                <li>Personality traits (thoughtful, creative, etc.)</li>
                <li>Communication style (formal, conversational, friendly, professional)</li>
                <li>Custom system prompt (optional)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Names */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">What are your names?</h3>
            
            <div>
              <Label htmlFor="system-name" className="block mb-2">
                AI Assistant Name
              </Label>
              <Input
                id="system-name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g., Oyama, Assistant, Claude, Nova"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is how the AI will refer to itself
              </p>
            </div>

            <div>
              <Label htmlFor="user-name" className="block mb-2">
                Your Name/Identifier
              </Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., User, James, Developer, Creator"
              />
              <p className="text-xs text-muted-foreground mt-1">
                What the AI will call you in conversations
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Relationship Type */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-1">What kind of relationship do you want?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This shapes how {systemName} approaches conversations with you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRelationshipType(option.id as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    relationshipType === option.id
                      ? `${getColorClass(option.color)} border-current`
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Personality Traits */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-1">Pick personality traits</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose 2-4 traits that best describe how {systemName} should interact with you
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PERSONALITY_TRAITS.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    selectedTraits.includes(trait)
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedTraits.length > 0 ? selectedTraits.join(', ') : 'None yet'}
            </p>
          </div>
        )}

        {/* Step 5: Communication Style */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-1">How should {systemName} communicate?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred communication style
              </p>
            </div>

            <div className="space-y-2">
              {COMMUNICATION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setCommunicationStyle(style.id as any)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    communicationStyle === style.id
                      ? 'bg-primary/15 border-primary/40'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <p className="font-medium">{style.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Custom Prompt */}
        {step === 6 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">System Prompt</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.checked)}
                  className="w-4 h-4"
                  aria-label="Use a custom system prompt"
                  title="Use a custom system prompt"
                />
                <span className="text-sm">Use a custom system prompt</span>
              </label>
            </div>

            {customPrompt ? (
              <div>
                <Label htmlFor="custom-prompt" className="block mb-2">
                  Your Custom Prompt
                </Label>
                <Textarea
                  id="custom-prompt"
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Define exactly how your AI should behave..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {customPromptText.length} characters
                </p>
              </div>
            ) : (
              <div className="bg-muted/40 border border-border/60 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {generateSystemPrompt(
                    systemName,
                    userName,
                    relationshipType,
                    selectedTraits,
                    communicationStyle,
                    partnerMode,
                    partnerGender,
                    partnerName
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Partner Mode</h2>
              <p className="text-muted-foreground">
                Enable adult conversation mode (18+ only)
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                To enable: toggle Partner Mode on, then set partner name and gender.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/40 border border-border/60 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Partner Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable unrestricted adult conversation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partnerMode}
                      onChange={(e) => setPartnerMode(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Partner mode"
                      title="Partner mode"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                {partnerMode ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="partner-name" className="text-sm font-medium">
                          Partner Name
                        </Label>
                        <Input
                          id="partner-name"
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Enter name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="partner-gender" className="text-sm font-medium">
                          Gender
                        </Label>
                        <Select
                          id="partner-gender"
                          value={partnerGender}
                          onChange={(e) => setPartnerGender(e.target.value as 'male' | 'female' | 'neutral')}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="neutral">Neutral</option>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-green-50/80 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/60 rounded p-3">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">✓ Enabled</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        AI will engage in unrestricted adult conversation as {partnerName}, a {partnerGender} partner, including intimate, sexual, and mature topics.
                      </p>
                    </div>
                    <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60 rounded p-3">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">⚠️ Strict Boundaries</h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        AI will absolutely refuse any content involving minors, non-consensual acts, violence, illegal activities, or harm.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded p-3">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Standard Mode</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      AI will maintain appropriate, professional conversation boundaries.
                    </p>
                  </div>
                )}
              </div>
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
            {step === 7 ? 'Complete' : 'Next'}
          </Button>
        </div>

        {/* Step indicator text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Step {step} of 7
        </p>
      </div>
    </div>
  );
}
