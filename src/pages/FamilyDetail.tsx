import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Play,
  MoreVertical,
  Upload,
} from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface FamilyType {
  id: string;
  name: string;
  usageCount: number;
}

interface FamilyDetail {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  likesCount: number;
  dislikesCount: number;
  lastUsed: string;
  types: FamilyType[];
  usageStatistics: {
    relatedProjects: Array<{
      projectId: string;
      projectName: string;
      usedCount: number;
    }>;
    relatedLocations: Array<{
      cityName: string;
      usageCount: number;
    }>;
    relatedPeriods: {
      lastMonth: number;
      lastQuarter: number;
      lastYear: number;
    };
  };
}

export default function FamilyDetail() {
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const [selectedType, setSelectedType] = useState<FamilyType | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: familyData, isLoading } = useQuery({
    queryKey: ["family", id],
    queryFn: () => fetch(`/api/family/${id}`).then((res) => res.json()),
  });

  const family: FamilyDetail | undefined = familyData?.data;

  const handleNoPreviewClick = () => {
    setShowUploadDialog(true);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate it's an image file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      // Get upload URL from API
      const response = await fetch("/api/create-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId: id,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl } = await response.json();

      // Upload the file to the signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Create a preview URL (you may need to adjust this based on your R2 public URL)
      // For now, we'll use a data URL for immediate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      setShowUploadDialog(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen ml-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen ml-64 mx-auto w-full flex items-center justify-center">
        <div className="text-muted-foreground">Family not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ml-64">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-secondary to-background p-8">
        <div className="flex gap-8 items-end">
          {/* Preview Image */}
          <div
            className="w-64 h-64 bg-card rounded-lg shadow-2xl flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors relative overflow-hidden"
            onClick={handleNoPreviewClick}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt={family.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div className="text-muted-foreground">No Preview</div>
                <div className="text-xs text-muted-foreground">
                  Click to upload
                </div>
              </div>
            )}
          </div>

          {/* Family Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">
              Family
            </p>
            <h1 className="text-5xl font-bold mb-4">{family.name}</h1>
            <p className="text-muted-foreground mb-4">{family.category}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {family.usageCount.toLocaleString()} total uses
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {family.types.length} types
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {family.likesCount} likes
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {family.dislikesCount} dislikes
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Last used {family.lastUsed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-8 flex gap-4 items-center">
        <Button size="lg" className="rounded-full px-8 gap-2">
          <Play className="w-5 h-5 fill-current" />
          Load in Revit
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full w-12 h-12"
          onClick={() => setIsLiked(!isLiked)}
        >
          <UserPlus
            className={`w-6 h-6 ${isLiked ? "fill-primary text-primary" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full w-12 h-12"
          onClick={() => {
            setThumbsUp(!thumbsUp);
            if (thumbsDown) setThumbsDown(false);
          }}
        >
          <ThumbsUp
            className={`w-6 h-6 ${thumbsUp ? "fill-primary text-primary" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full w-12 h-12"
          onClick={() => {
            setThumbsDown(!thumbsDown);
            if (thumbsUp) setThumbsUp(false);
          }}
        >
          <ThumbsDown
            className={`w-6 h-6 ${
              thumbsDown ? "fill-destructive text-destructive" : ""
            }`}
          />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-full w-12 h-12">
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      {/* Family Types Table */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Family Types</h2>
        <div className="space-y-2">
          {family.types.map((type, index) => (
            <div
              key={type.id}
              className="flex items-center gap-4 p-4 rounded-md hover:bg-secondary transition-colors group cursor-pointer"
              onClick={() => setSelectedType(type)}
            >
              <div className="text-muted-foreground w-8">{index + 1}</div>
              <div className="flex-1">
                <div className="font-medium">{type.name}</div>
              </div>
              <div className="text-muted-foreground text-sm">
                {type.usageCount} uses
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType(type);
                }}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* By Project */}
          <div className="bg-card p-4 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground mb-1">By Project</p>
            {family.usageStatistics.relatedProjects.map((project) => (
              <div
                key={project.projectId}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{project.projectName}</span>
                <span>{project.usedCount}</span>
              </div>
            ))}
          </div>
          {/* By Office */}
          <div className="bg-card p-4 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground mb-1">By Office</p>
            {family.usageStatistics.relatedLocations.map((location) => (
              <div
                key={location.cityName}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{location.cityName}</span>
                <span>{location.usageCount}</span>
              </div>
            ))}
          </div>
          {/* By Period */}
          <div className="bg-card p-4 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground mb-1">By Period</p>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Last Year</span>
              <span>{family.usageStatistics.relatedPeriods.lastYear}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Last Quarter</span>
              <span>{family.usageStatistics.relatedPeriods.lastQuarter}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Last Month</span>
              <span>{family.usageStatistics.relatedPeriods.lastMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Type Detail Drawer */}
      <Sheet
        open={!!selectedType}
        onOpenChange={(open) => !open && setSelectedType(null)}
      >
        <SheetContent
          side="right"
          className="w-[600px] sm:max-w-[600px] overflow-y-auto"
        >
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="text-2xl">{selectedType?.name}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pt-6">
            {/* 3D Preview */}
            <div className="bg-muted/50 rounded-lg p-8 aspect-video flex items-center justify-center border">
              <div className="text-center space-y-2">
                <div className="text-4xl">🔲</div>
                <div className="text-muted-foreground">No Preview</div>
                <div className="text-sm text-muted-foreground">
                  Interactive 3D model will load here
                </div>
              </div>
            </div>

            {/* Type Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Usage Count</p>
                <p className="text-2xl font-bold">
                  {selectedType?.usageCount} uses
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Family Type</p>
                <p className="text-xl font-semibold">{selectedType?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg">{family.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Used</p>
                <p className="text-lg">{family.lastUsed}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button size="lg" className="flex-1">
                <Play className="w-5 h-5 mr-2 fill-current" />
                Load in Revit
              </Button>
              <Button size="lg" variant="outline">
                View Parameters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Preview Image</DialogTitle>
            <DialogDescription>
              Select an image file to upload as the preview for this family.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Choose Image File"}
              </Button>
            </label>
            {uploading && (
              <div className="text-sm text-muted-foreground text-center">
                Uploading image...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
