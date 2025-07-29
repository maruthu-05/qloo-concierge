import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecommendationProps {
  recommendation: {
    title: string;
    category: string;
    description: string;
    confidence: number;
  };
}

export const RecommendationCard = ({ recommendation }: RecommendationProps) => {
  const confidenceColor = recommendation.confidence >= 0.9 
    ? "bg-green-500" 
    : recommendation.confidence >= 0.8 
    ? "bg-yellow-500" 
    : "bg-orange-500";

  const confidenceText = recommendation.confidence >= 0.9 
    ? "Perfect Match" 
    : recommendation.confidence >= 0.8 
    ? "Great Match" 
    : "Good Match";

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
            <Badge variant="secondary" className="w-fit">
              {recommendation.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <div 
              className={`h-2 w-2 rounded-full ${confidenceColor}`}
            />
            <span className="text-muted-foreground">{confidenceText}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {recommendation.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {(recommendation.confidence * 5).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({Math.round(recommendation.confidence * 100)}% match)
            </span>
          </div>
          
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};