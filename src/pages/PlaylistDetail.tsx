import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Shuffle,
  Download,
  Save,
  Search,
} from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface PlaylistDetail {
  id: string;
  name: string;
  description?: string;
  previewImageStorageKey?: string;
  userId: string;
  userName?: string;
  likesCount: number;
  familiesCount: number;
  totalSizeMB?: number;
  families: Array<{
    id: string;
    name: string;
    category: string;
    previewImageStorageKey?: string;
    order: number;
    likesCount?: number;
    location?: string;
    sizeMB?: number;
  }>;
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddFamilyDialog, setShowAddFamilyDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [familySearchQuery, setFamilySearchQuery] = useState<string>("");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Get userId from auth context
  const userId = "user-1"; // Placeholder - replace with actual auth

  const { data: playlistData, isLoading: isLoadingPlaylist } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetch(`/api/playlist/${id}`).then((res) => res.json()),
  });

  const { data: familiesData, isLoading: isLoadingFamilies } = useQuery({
    queryKey: ["families"],
    queryFn: () => fetch("/api/family").then((res) => res.json()),
  });

  const playlist: PlaylistDetail | undefined = playlistData?.data;

  // Calculate total size if not provided
  const totalSizeMB = playlist?.totalSizeMB || 
    (playlist?.families?.reduce((sum, f) => sum + (f.sizeMB || 37), 0) || 0);

  // Filter families for table display
  const filteredFamilies = useMemo(() => {
    if (!playlist?.families) return [];
    if (!tableSearchQuery.trim()) return playlist.families;
    
    const query = tableSearchQuery.toLowerCase();
    return playlist.families.filter((family) => 
      family.name.toLowerCase().includes(query) ||
      family.category.toLowerCase().includes(query)
    );
  }, [playlist?.families, tableSearchQuery]);

  // Filter families based on search query and exclude already added families
  const availableFamilies = useMemo(() => {
    if (!familiesData?.data) return [];
    
    return familiesData.data.filter((family: any) => {
      // Filter out families already in playlist
      const notInPlaylist = !playlist?.families?.some((f) => f.id === family.id);
      // Filter by search query
      if (familySearchQuery.trim()) {
        const query = familySearchQuery.toLowerCase();
        const matchesName = family.name?.toLowerCase().includes(query);
        const matchesCategory = family.category?.toLowerCase().includes(query);
        return notInPlaylist && (matchesName || matchesCategory);
      }
      return notInPlaylist;
    });
  }, [familiesData?.data, playlist?.families, familySearchQuery]);

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

  // Centralized loading state - combine all loading states
  const isLoading = isLoadingPlaylist || isLoadingFamilies || uploading || addFamilyMutation.isPending || likeMutation.isPending;

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

  // Show loading skeleton if playlist is still loading
  if (isLoadingPlaylist) {
    return (
      <div className="w-full h-full overflow-auto bg-gradient-to-b from-purple-900/20 via-background to-background">
        {/* Hero Section Skeleton */}
        <div className="p-8 pb-4">
          <div className="mb-6 space-y-4">
            <Skeleton className="h-16 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2 items-center">
            <Skeleton className="h-14 w-32 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="px-8 pb-8">
          <div className="bg-background/30 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Family</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Playlist not found</div>
      </div>
    );
  }

  // Set initial liked state based on playlist data
  // TODO: Check if current user has liked this playlist

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-b from-purple-900/20 via-background to-background">
      {/* Hero Section */}
      <div className="p-8 pb-4">
        {/* Playlist Info */}
        <div className="mb-6">
          <h1 className="text-6xl font-bold mb-4 text-white">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>By {playlist.userName || "Unknown User"}</span>
            <span>•</span>
            <span>{playlist.likesCount} {playlist.likesCount === 1 ? "like" : "likes"}</span>
            <span>•</span>
            <span>{playlist.familiesCount} {playlist.familiesCount === 1 ? "family" : "families"}</span>
            <span>•</span>
            <span>{Math.round(totalSizeMB)} MB</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <Button 
            size="lg" 
            className="rounded-full px-8 gap-2 bg-green-500 hover:bg-green-600 text-white h-14"
            disabled={isLoading}
          >
            <Play className="w-6 h-6 fill-current" />
            Play
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-white/10"
            disabled={isLoading}
          >
            <Shuffle className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-white/10"
            onClick={() => setShowAddFamilyDialog(true)}
            disabled={isLoading}
          >
            <Plus className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-white/10"
            disabled={isLoading}
          >
            <Save className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-white/10"
            disabled={isLoading}
          >
            <Download className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-white/10"
            onClick={() => setShowUploadDialog(true)}
            disabled={isLoading}
          >
            <Upload className="w-6 h-6" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full w-12 h-12 hover:bg-white/10"
            disabled={isLoading}
          >
            <MoreVertical className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Families Table */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in playlist..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        {filteredFamilies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">
              {tableSearchQuery ? "No families match your search." : "No families in this playlist yet."}
            </p>
            {!tableSearchQuery && (
              <Button onClick={() => setShowAddFamilyDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Family
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-background/30 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Family</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies.map((family, index) => {
                  const previewImageUrl = family.previewImageStorageKey
                    ? `/api/storage/${family.previewImageStorageKey}`
                    : null;
                  const isSelected = selectedFamily === family.id;
                  
                  return (
                    <tr
                      key={family.id}
                      className={cn(
                        "border-b border-border/30 hover:bg-white/5 transition-colors cursor-pointer",
                        isSelected && "bg-white/10"
                      )}
                      onClick={() => {
                        setSelectedFamily(family.id);
                        navigate(`/family/${family.id}`);
                      }}
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {previewImageUrl ? (
                              <img
                                src={previewImageUrl}
                                alt={family.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-lg">📦</div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{family.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {family.likesCount || 0} likes
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {family.location || "New York"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {family.sizeMB || 37} MB
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 rounded-full hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle like action
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                disabled={isLoading}
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
      <Dialog 
        open={showAddFamilyDialog} 
        onOpenChange={(open) => {
          setShowAddFamilyDialog(open);
          if (!open) {
            setSelectedFamilyId("");
            setFamilySearchQuery("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Family to Playlist</DialogTitle>
            <DialogDescription>
              Search and select a family to add to this playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Command className="rounded-lg border" shouldFilter={false}>
              <CommandInput
                placeholder="Search families by name or category..."
                value={familySearchQuery}
                onValueChange={setFamilySearchQuery}
                disabled={isLoading}
              />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>
                  {isLoadingFamilies ? (
                    "Loading families..."
                  ) : availableFamilies.length === 0 && familiesData?.data?.length > 0 ? (
                    "All available families are already in this playlist."
                  ) : (
                    "No families found. Try a different search term."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {availableFamilies.length > 0 && availableFamilies.map((family: any) => {
                    const previewImageUrl = family.previewImageStorageKey
                      ? `/api/storage/${family.previewImageStorageKey}`
                      : null;
                    
                    return (
                      <CommandItem
                        key={family.id}
                        value={family.id}
                        onSelect={() => {
                          setSelectedFamilyId(family.id);
                        }}
                        className="cursor-pointer py-3 px-3 rounded-md aria-selected:bg-accent aria-selected:text-accent-foreground"
                      >
                        <div className="flex items-center gap-3 flex-1 w-full">
                          {/* Preview Image */}
                          <div className="w-12 h-12 rounded-md bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {previewImageUrl ? (
                              <img
                                src={previewImageUrl}
                                alt={family.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-lg">📦</div>
                            )}
                          </div>
                          
                          {/* Family Info */}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-base truncate">
                              {family.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {family.category}
                            </span>
                          </div>
                          
                          {/* Selection Indicator */}
                          {selectedFamilyId === family.id && (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-primary-foreground text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedFamilyId && (
              <div className="text-sm text-muted-foreground">
                Selected:{" "}
                <span className="font-medium">
                  {availableFamilies.find((f: any) => f.id === selectedFamilyId)?.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFamilyDialog(false);
                setSelectedFamilyId("");
                setFamilySearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFamily}
              disabled={!selectedFamilyId || isLoading}
            >
              {addFamilyMutation.isPending ? "Adding..." : "Add Family"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

