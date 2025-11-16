import { Play, Music, ThumbsUp, ThumbsDown } from "lucide-react";
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
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/playlist/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to like playlist");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setThumbsUp(data.reaction === "like");
      setThumbsDown(data.reaction === "dislike");
      queryClient.invalidateQueries({ queryKey: ["made-for-you"] });
      queryClient.invalidateQueries({ queryKey: ["recently-used"] });
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
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
      const response = await fetch(`/api/playlist/${id}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dislike playlist");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setThumbsUp(data.reaction === "like");
      setThumbsDown(data.reaction === "dislike");
      queryClient.invalidateQueries({ queryKey: ["made-for-you"] });
      queryClient.invalidateQueries({ queryKey: ["recently-used"] });
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
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
    </Card>
  );
}

