import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";

const FAMILY_CATEGORIES = [
  "Structural Columns",
  "Furniture",
  "Mechanical Equipment",
  "Doors",
  "Windows",
  "Electrical Equipment",
  "Plumbing Fixtures",
  "Lighting",
  "Walls",
  "Floors",
  "Roofs",
  "Stairs",
  "Railings",
  "Generic Models",
  "Site",
  "Mass",
];

interface AddFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFamilyDialog({ open, onOpenChange }: AddFamilyDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [rfaFile, setRfaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
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

  const handleRfaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".rfa")) {
        toast({
          title: "Invalid file type",
          description: "Please select a .rfa file.",
          variant: "destructive",
        });
        return;
      }
      setRfaFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!name || !category) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!rfaFile) {
      toast({
        title: "Missing RFA file",
        description: "Please attach a Revit Family file (.rfa).",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add families.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique ID for the family
      const familyId = generateUUID();

      // Step 1: Create the family in the database first
      const createResponse = await fetch("/api/family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: familyId,
          name,
          category,
          userId: user.id,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create family");
      }

      // Step 2: Upload preview image if provided
      let previewImageStorageKey: string | undefined;
      if (previewImage) {
        const previewExt = previewImage.name.split(".").pop() || "jpg";
        const previewFileName = `preview.${previewExt}`;
        
        const previewUploadUrlResponse = await fetch("/api/create-upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyId,
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

      // Step 3: Upload RFA file
      const rfaFileName = rfaFile.name;
      const rfaUploadUrlResponse = await fetch("/api/create-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId,
          fileName: rfaFileName,
        }),
      });

      if (!rfaUploadUrlResponse.ok) {
        throw new Error("Failed to get RFA file upload URL");
      }

      const { uploadUrl: rfaUploadUrl, storageKey: rfaStorageKey } =
        await rfaUploadUrlResponse.json();

      const rfaUploadResponse = await fetch(rfaUploadUrl, {
        method: "PUT",
        body: rfaFile,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!rfaUploadResponse.ok) {
        throw new Error("Failed to upload RFA file");
      }

      // Step 4: Update family with storage keys
      const updateResponse = await fetch(`/api/family/${familyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          previewImageStorageKey,
          rfaFileStorageKey: rfaStorageKey,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update family with file storage keys");
      }

      toast({
        title: "Family added successfully",
        description: "The family has been added to your library.",
      });

      // Reset form
      setName("");
      setCategory("");
      setPreviewImage(null);
      setRfaFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding family:", error);
      toast({
        title: "Error adding family",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while adding the family.",
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
          <DialogTitle>Add New Family</DialogTitle>
          <DialogDescription>
            Add a new Revit family to your library. Fill in the details and
            attach the necessary files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Family Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Office Desk - Rectangular"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-image">
              Preview Image (Optional)
            </Label>
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

          <div className="space-y-2">
            <Label htmlFor="rfa-file">
              Revit Family File (.rfa) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="rfa-file"
                type="file"
                accept=".rfa"
                onChange={handleRfaFileChange}
                className="hidden"
              />
              <label
                htmlFor="rfa-file"
                className="flex-1 cursor-pointer border border-dashed rounded-md p-4 flex items-center justify-center gap-2 hover:bg-accent transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {rfaFile ? rfaFile.name : "Click to upload .rfa file"}
                </span>
              </label>
              {rfaFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRfaFile(null)}
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
            {isSubmitting ? "Adding..." : "Add Family"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

