import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { generateUUID } from "@/lib/utils";

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const user = session.data?.user;

  const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file for the preview.",
          variant: "destructive",
        });
        return;
      }
      setPreviewImage(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please enter a playlist name.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create playlists.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique ID for the playlist
      const playlistId = generateUUID();

      // Step 1: Upload preview image if provided
      let previewImageStorageKey: string | undefined;
      if (previewImage) {
        const previewExt = previewImage.name.split(".").pop() || "jpg";
        const previewFileName = `preview.${previewExt}`;

        // For playlists, we'll use a different path structure
        const previewUploadUrlResponse = await fetch("/api/create-upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyId: `playlist/${playlistId}`, // Use playlist prefix
            fileName: previewFileName,
          }),
        });

        if (!previewUploadUrlResponse.ok) {
          throw new Error("Failed to get preview image upload URL");
        }

        const { uploadUrl, storageKey } = await previewUploadUrlResponse.json();
        previewImageStorageKey = storageKey;

        const previewUploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: previewImage,
          headers: {
            "Content-Type": previewImage.type,
          },
        });

        if (!previewUploadResponse.ok) {
          throw new Error("Failed to upload preview image");
        }
      }

      // Step 2: Create the playlist
      const createResponse = await fetch("/api/playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: playlistId,
          name: name.trim(),
          description: description.trim() || undefined,
          userId: user.id,
          previewImageStorageKey,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create playlist");
      }

      toast({
        title: "Playlist created successfully",
        description: "Your playlist has been created.",
      });

      // Invalidate queries to refresh playlists
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["made-for-you"] });
      queryClient.invalidateQueries({ queryKey: ["recently-used"] });

      // Reset form
      setName("");
      setDescription("");
      setPreviewImage(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error creating playlist",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the playlist.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>
            Create a new playlist to organize your Revit families.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Playlist Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Structural Elements"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for your playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-image">Preview Image (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                id="preview-image"
                type="file"
                accept="image/*"
                onChange={handlePreviewImageChange}
                className="hidden"
              />
              <label
                htmlFor="preview-image"
                className="flex-1 cursor-pointer border border-dashed rounded-md p-4 flex items-center justify-center gap-2 hover:bg-accent transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {previewImage
                    ? previewImage.name
                    : "Click to upload preview image"}
                </span>
              </label>
              {previewImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

