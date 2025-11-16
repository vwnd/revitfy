import { Heart, Play, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FamilyCardProps {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  imageUrl?: string;
}
export function FamilyCard({
  id,
  name,
  category,
  usageCount
}: FamilyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/family/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to like family");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["family", id] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      setThumbsUp(data.reaction === "like");
      setThumbsDown(data.reaction === "dislike");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/family/${id}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dislike family");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["family", id] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      setThumbsUp(data.reaction === "like");
      setThumbsDown(data.reaction === "dislike");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return <Card className="card-hover cursor-pointer p-4 group relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => navigate(`/family/${id}`)}>
      {/* Preview Card */}
      <div className="aspect-square bg-primary/10 rounded-md mb-4 relative overflow-hidden">
        {isHovered && <Button size="icon" className="absolute bottom-2 right-2 bg-primary hover:scale-105 transition-transform shadow-lg" onClick={e => {
        e.stopPropagation();
        navigate(`/family/${id}`);
      }}>
            <Play className="w-5 h-5 fill-current" />
          </Button>}
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground truncate">{name}</h3>
        <p className="text-sm text-muted-foreground">{category}</p>
        <p className="text-xs text-muted-foreground">{usageCount} uses</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8" 
          onClick={(e) => {
            e.stopPropagation();
            likeMutation.mutate();
          }}
          disabled={likeMutation.isPending || dislikeMutation.isPending}
        >
          <ThumbsUp className={`w-4 h-4 ${thumbsUp ? "fill-primary text-primary" : ""}`} />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8" 
          onClick={(e) => {
            e.stopPropagation();
            dislikeMutation.mutate();
          }}
          disabled={likeMutation.isPending || dislikeMutation.isPending}
        >
          <ThumbsDown className={`w-4 h-4 ${thumbsDown ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </div>
    </Card>;
}