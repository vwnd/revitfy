import { Heart, Play, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";

interface FamilyCardProps {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  imageUrl?: string;
}

export function FamilyCard({ id, name, category, usageCount }: FamilyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <Card
      className="card-hover cursor-pointer p-4 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.navigate({ to: `/family/${id}` })}
    >
      {/* Preview Image Placeholder */}
      <div className="aspect-square bg-secondary rounded-md mb-4 relative overflow-hidden flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Speckle Preview</div>
        
        {isHovered && (
          <Button
            size="icon"
            className="absolute bottom-2 right-2 bg-primary hover:scale-105 transition-transform shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              router.navigate({ to: `/family/${id}` });
            }}
          >
            <Play className="w-5 h-5 fill-current" />
          </Button>
        )}
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
            setIsLiked(!isLiked);
          }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-primary text-primary" : ""}`} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
