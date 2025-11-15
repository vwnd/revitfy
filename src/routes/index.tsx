import { FamilyCard } from '@/components/FamilyCard';
import { FilterBar } from '@/components/FilterCard';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
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
    {
      id: "4",
      name: "Door - Single Swing",
      category: "Doors",
      usageCount: 2134,
    },
    {
      id: "5",
      name: "Window - Fixed",
      category: "Windows",
      usageCount: 1876,
    },
    {
      id: "6",
      name: "Electrical Panel - 480V",
      category: "Electrical Equipment",
      usageCount: 234,
    },
    {
      id: "7",
      name: "Toilet - Wall Mounted",
      category: "Plumbing Fixtures",
      usageCount: 456,
    },
    {
      id: "8",
      name: "LED Fixture - Recessed",
      category: "Lighting",
      usageCount: 3421,
    },
  ];

  return (
    <div className="min-h-screen ml-64">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Families</h1>
          <p className="text-muted-foreground">
            Discover and organize your Revit family content
          </p>
        </div>

        <FilterBar />

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Popular Families</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockFamilies.map((family) => (
              <FamilyCard key={family.id} {...family} />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recently Used</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockFamilies.slice(0, 5).map((family) => (
              <FamilyCard key={family.id} {...family} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
