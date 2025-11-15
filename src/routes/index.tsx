import { FamilyCard } from '@/components/FamilyCard';
import { FilterBar } from '@/components/FilterCard';
import { getFamilies } from '@/lib/families';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App, loader: () => getFamilies() })

function App() {
  const families = Route.useLoaderData();


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
            {families.map((family) => (
              <FamilyCard key={family.id} {...family} />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recently Used</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {families.slice(0, 5).map((family) => (
              <FamilyCard key={family.id} {...family} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
