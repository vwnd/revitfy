import { Heart, Play, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PlaylistCardProps {
  id: string;
  name: string;
  description?: string;
  familiesCount: number;
  likesCount: number;
  previewImageStorageKey?: string;
}

export function PlaylistCard({
  id,
  name,
  description,
  familiesCount,
  likesCount,
  previewImageStorageKey,
}: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // TODO: Get userId from auth context
  const userId = "user-1"; // Placeholder - replace with actual auth

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/playlist/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to like playlist");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["made-for-you"] });
      queryClient.invalidateQueries({ queryKey: ["recently-used"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like playlist",
        variant: "destructive",
      });
    },
  });

  return (
    <Card
      className="card-hover cursor-pointer p-4 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/playlist/${id}`)}
    >
      {/* Preview Card */}
      <div className="aspect-square bg-primary/30 rounded-md mb-4 relative overflow-hidden">
        {previewImageStorageKey ? (
          <img
            src={`/api/storage/${previewImageStorageKey}`}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-primary/60" />
          </div>
        )}
        {isHovered && (
          <Button
            size="icon"
            className="absolute bottom-2 right-2 bg-primary hover:scale-105 transition-transform shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/playlist/${id}`);
            }}
          >
            <Play className="w-5 h-5 fill-current" />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground truncate">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {familiesCount} {familiesCount === 1 ? "family" : "families"} • {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
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
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

