import { useState } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { RecommendationCard } from "@/components/RecommendationCard";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  recommendations?: Array<{
    title: string;
    category: string;
    description: string;
    confidence: number;
  }>;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm Vibora, your AI taste assistant. I'll help you discover amazing recommendations based on your personal preferences. Let's start by getting to know your tastes better!"
    }
  ]);
  const [input, setInput] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnboardingComplete = (preferences: Record<string, string[]>) => {
    setShowOnboarding(false);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Perfect! I've learned about your tastes in ${Object.keys(preferences).join(', ')}. Now I can give you personalized recommendations. What would you like to explore today?`,
      recommendations: [
        {
          title: "Cozy Jazz Cafe",
          category: "Restaurant",
          description: "A perfect spot for jazz lovers who enjoy intimate dining",
          confidence: 0.92
        },
        {
          title: "Indie Film Festival",
          category: "Event",
          description: "Curated selection of independent films",
          confidence: 0.88
        }
      ]
    };
    setMessages(prev => [...prev, welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response with recommendations
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "Based on your taste profile, here are some recommendations I think you'll love:",
        recommendations: [
          {
            title: "Midnight Diner",
            category: "Restaurant",
            description: "Late-night Japanese comfort food that matches your taste for authentic, intimate experiences",
            confidence: 0.94
          },
          {
            title: "Amelie",
            category: "Film",
            description: "A whimsical French film perfect for your love of artistic storytelling",
            confidence: 0.91
          },
          {
            title: "Bon Iver",
            category: "Music",
            description: "Atmospheric indie folk that aligns with your musical preferences",
            confidence: 0.89
          }
        ]
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Vibora AI</h1>
          <span className="text-muted-foreground">• Your Taste Assistant</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} max-w-2xl`}>
                <Card className={`${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <CardContent className="p-3">
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
                
                {message.recommendations && (
                  <div className="mt-3 space-y-2 w-full">
                    {message.recommendations.map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} />
                    ))}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your tastes or ask for recommendations..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;