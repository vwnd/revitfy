import { FamilyCard } from "@/components/FamilyCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const mockPlaylists = [
  {
    id: "1",
    name: "Structural Elements",
    count: 45,
  },
  {
    id: "2",
    name: "MEP Components",
    count: 32,
  },
  {
    id: "3",
    name: "Furniture & Fixtures",
    count: 28,
  },
];

const mockFamilies = [
  {
    id: "1",
    name: "Structural Column - Wide Flange",
    category: "Structural Columns",
    usageCount: 1250,
  },
  {
    id: "2",
    name: "Office Desk - Rectangular",
    category: "Furniture",
    usageCount: 843,
  },
  {
    id: "3",
    name: "VAV Box - Standard",
    category: "Mechanical Equipment",
    usageCount: 567,
  },
];

export default function Library() {
  return (
    <div className="min-h-screen ml-64">
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Library</h1>
            <p className="text-muted-foreground">
              Manage your family collections and playlists
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Playlist
          </Button>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Playlists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-card p-4 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
              >
                <div className="aspect-square bg-secondary rounded-md mb-4 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {playlist.count} families
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Liked Families</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockFamilies.map((family) => (
              <FamilyCard key={family.id} {...family} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
