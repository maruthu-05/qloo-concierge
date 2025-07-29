import { useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold">
              Vibora AI
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your personal taste assistant powered by advanced AI. 
            Discover personalized recommendations across music, food, travel, fashion, and more.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/chat')}
            className="text-lg px-8 py-6 h-auto"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Start Chatting
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How Vibora Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>Learn Your Tastes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Through a quick onboarding process, Vibora learns about your preferences 
                across different categories like music, movies, food, and travel.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our advanced taste AI analyzes your preferences and finds 
                cross-domain connections to understand your unique taste profile.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get tailored suggestions for restaurants, movies, music, travel destinations, 
                and more that match your personal taste signature.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Your Perfect Matches?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who've discovered amazing new experiences through Vibora AI.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/chat')}
            className="text-lg px-8 py-6 h-auto"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
