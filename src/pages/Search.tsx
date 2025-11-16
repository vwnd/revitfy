import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { FamilyCard } from "@/components/FamilyCard";

const recentSearches = [
  "Structural columns",
  "MEP equipment",
  "Office furniture",
  "Lighting fixtures",
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
];

export default function Search() {
  return (
    <div className="min-h-screen ml-64">
      <div className="p-8">
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              placeholder="What family are you looking for?"
              className="pl-14 h-14 text-lg bg-card"
            />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Searches</h2>
          <div className="flex flex-wrap gap-3">
            {recentSearches.map((search) => (
              <button
                key={search}
                className="px-6 py-3 bg-card rounded-full hover:bg-secondary transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {["Structural", "Architectural", "MEP", "Furniture", "Lighting", "Plumbing", "Electrical", "Specialty"].map(
              (category) => (
                <div
                  key={category}
                  className="aspect-square bg-card rounded-lg p-6 flex items-end cursor-pointer hover:bg-secondary transition-colors"
                >
                  <h3 className="text-xl font-bold">{category}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
