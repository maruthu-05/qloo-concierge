import { useState } from "react";
import { ChevronRight, ChevronLeft, Music, Film, Coffee, Plane, Shirt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OnboardingProps {
  onComplete: (preferences: Record<string, string[]>, aiResponse?: any) => void;
}

const onboardingSteps = [
  {
    id: 'music',
    title: 'Music',
    icon: Music,
    question: 'What music do you love?',
    options: [
      'Jazz', 'Rock', 'Hip-Hop', 'Classical', 'Electronic', 'Indie', 'Pop', 'Blues',
      'Folk', 'Reggae', 'Country', 'R&B', 'Punk', 'Metal', 'Alternative'
    ]
  },
  {
    id: 'movies',
    title: 'Movies & TV',
    icon: Film,
    question: 'What genres do you enjoy watching?',
    options: [
      'Drama', 'Comedy', 'Action', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Documentary',
      'Animation', 'Mystery', 'Fantasy', 'Crime', 'Adventure', 'Historical', 'Indie Films'
    ]
  },
  {
    id: 'food',
    title: 'Food & Dining',
    icon: Coffee,
    question: 'What cuisines and dining styles do you prefer?',
    options: [
      'Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai', 'Mediterranean', 'Chinese',
      'Korean', 'Vietnamese', 'American', 'Fine Dining', 'Street Food', 'Vegan', 'Comfort Food'
    ]
  },
  {
    id: 'travel',
    title: 'Travel & Places',
    icon: Plane,
    question: 'What kind of travel experiences appeal to you?',
    options: [
      'Beach Destinations', 'Mountain Adventures', 'City Exploration', 'Cultural Sites', 'Museums',
      'National Parks', 'Food Tours', 'Nightlife', 'Shopping', 'Art Galleries', 'Historical Sites',
      'Off-the-beaten-path', 'Luxury Resorts', 'Backpacking', 'Road Trips'
    ]
  },
  {
    id: 'fashion',
    title: 'Fashion & Style',
    icon: Shirt,
    question: 'What styles and brands resonate with you?',
    options: [
      'Minimalist', 'Bohemian', 'Classic', 'Streetwear', 'Vintage', 'Luxury', 'Casual',
      'Formal', 'Artistic', 'Athletic', 'Sustainable', 'Designer', 'Thrift', 'Trendy', 'Timeless'
    ]
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const currentStepData = onboardingSteps[currentStep];
  const stepPreferences = preferences[currentStepData.id] || [];

  const togglePreference = (option: string) => {
    const current = stepPreferences;
    const updated = current.includes(option)
      ? current.filter(p => p !== option)
      : [...current, option];
    
    setPreferences(prev => ({
      ...prev,
      [currentStepData.id]: updated
    }));
  };

  const nextStep = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      try {
        const response = await fetch('https://ezwrbkbdnygxoqwanwgv.supabase.co/functions/v1/process-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences }),
        });

        if (!response.ok) {
          throw new Error('Failed to process onboarding');
        }

        const data = await response.json();
        onComplete(preferences, data);
      } catch (error) {
        console.error('Onboarding error:', error);
        // Fallback to original behavior
        onComplete(preferences);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = stepPreferences.length > 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <currentStepData.icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{currentStepData.question}</CardTitle>
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {onboardingSteps.length} • Select all that apply
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentStepData.options.map((option) => (
              <Badge
                key={option}
                variant={stepPreferences.includes(option) ? "default" : "outline"}
                className="cursor-pointer p-3 justify-center hover:bg-accent transition-colors"
                onClick={() => togglePreference(option)}
              >
                {option}
              </Badge>
            ))}
          </div>

          {/* Selected Count */}
          {stepPreferences.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {stepPreferences.length} selected
            </p>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={nextStep}
              disabled={!canProceed || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isLastStep ? 'Complete' : 'Next'}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};