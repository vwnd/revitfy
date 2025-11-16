import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  Play,
  MoreVertical,
  Upload,
  Plus,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FamilyCard } from "@/components/FamilyCard";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlaylistDetail {
  id: string;
  name: string;
  description?: string;
  previewImageStorageKey?: string;
  likesCount: number;
  familiesCount: number;
  families: Array<{
    id: string;
    name: string;
    category: string;
    previewImageStorageKey?: string;
    order: number;
  }>;
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [isLiked, setIsLiked] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddFamilyDialog, setShowAddFamilyDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Get userId from auth context
  const userId = "user-1"; // Placeholder - replace with actual auth

  const { data: playlistData, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetch(`/api/playlist/${id}`).then((res) => res.json()),
  });

  const { data: familiesData } = useQuery({
    queryKey: ["families"],
    queryFn: () => fetch("/api/family").then((res) => res.json()),
  });

  const playlist: PlaylistDetail | undefined = playlistData?.data;

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
    onSuccess: (data) => {
      setIsLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      toast({
        title: data.liked ? "Playlist liked" : "Playlist unliked",
      });
    },
  });

  const addFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      const response = await fetch(`/api/playlist/${id}/families`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ familyId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add family");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      setShowAddFamilyDialog(false);
      setSelectedFamilyId("");
      toast({
        title: "Family added",
        description: "The family has been added to the playlist.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding family",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNoPreviewClick = () => {
    setShowUploadDialog(true);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const previewExt = file.name.split(".").pop() || "jpg";
      const previewFileName = `preview.${previewExt}`;

      const response = await fetch("/api/create-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId: `playlist/${id}`,
          fileName: previewFileName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, storageKey } = await response.json();

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

      // Update playlist preview image
      const updateResponse = await fetch(`/api/playlist/${id}/preview-image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storageKey }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update playlist preview");
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      setShowUploadDialog(false);
      toast({
        title: "Preview updated",
        description: "The playlist preview image has been updated.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddFamily = () => {
    if (!selectedFamilyId) {
      toast({
        title: "Please select a family",
        variant: "destructive",
      });
      return;
    }
    addFamilyMutation.mutate(selectedFamilyId);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center transition-all duration-200 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div
        className={cn(
          "min-h-screen mx-auto w-full flex items-center justify-center transition-all duration-200 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="text-muted-foreground">Playlist not found</div>
      </div>
    );
  }

  const previewImageUrl = playlist.previewImageStorageKey
    ? `/api/storage/${playlist.previewImageStorageKey}`
    : null;

  // Set initial liked state based on playlist data
  // TODO: Check if current user has liked this playlist

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-200 ease-in-out",
        isCollapsed ? "ml-16" : "ml-64"
      )}
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-secondary to-background p-8">
        <div className="flex gap-8 items-end">
          {/* Preview Image */}
          <div
            className="w-64 h-64 bg-card rounded-lg shadow-2xl flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors relative overflow-hidden"
            onClick={handleNoPreviewClick}
          >
            {previewImage || previewImageUrl ? (
              <img
                src={previewImage || previewImageUrl || ""}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="text-6xl">🎵</div>
                <div className="text-muted-foreground">No Preview</div>
                <div className="text-xs text-muted-foreground">
                  Click to upload
                </div>
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">
              Playlist
            </p>
            <h1 className="text-5xl font-bold mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4">
                {playlist.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {playlist.familiesCount}{" "}
                {playlist.familiesCount === 1 ? "family" : "families"}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {playlist.likesCount} {playlist.likesCount === 1 ? "like" : "likes"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-8 flex gap-4 items-center">
        <Button size="lg" className="rounded-full px-8 gap-2">
          <Play className="w-5 h-5 fill-current" />
          Play All
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={`rounded-full w-12 h-12 ${
            isLiked ? "text-primary" : ""
          }`}
          onClick={() => likeMutation.mutate()}
        >
          <Heart
            className={`w-6 h-6 ${isLiked ? "fill-primary text-primary" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full w-12 h-12"
          onClick={() => setShowAddFamilyDialog(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-full w-12 h-12">
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      {/* Families List */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Families</h2>
        {playlist.families.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No families in this playlist yet.</p>
            <Button onClick={() => setShowAddFamilyDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Family
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlist.families.map((family) => (
              <FamilyCard
                key={family.id}
                id={family.id}
                name={family.name}
                category={family.category}
                usageCount={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Preview Image</DialogTitle>
            <DialogDescription>
              Select an image file to upload as the preview for this playlist.
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

      {/* Add Family Dialog */}
      <Dialog open={showAddFamilyDialog} onOpenChange={setShowAddFamilyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family to Playlist</DialogTitle>
            <DialogDescription>
              Select a family to add to this playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a family" />
              </SelectTrigger>
              <SelectContent>
                {familiesData?.data
                  ?.filter(
                    (family: any) =>
                      !playlist.families.some((f) => f.id === family.id)
                  )
                  .map((family: any) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name} ({family.category})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {(!familiesData?.data ||
              familiesData.data.filter(
                (family: any) =>
                  !playlist.families.some((f) => f.id === family.id)
              ).length === 0) && (
              <p className="text-sm text-muted-foreground">
                All available families are already in this playlist.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFamilyDialog(false);
                setSelectedFamilyId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFamily}
              disabled={!selectedFamilyId || addFamilyMutation.isPending}
            >
              {addFamilyMutation.isPending ? "Adding..." : "Add Family"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

