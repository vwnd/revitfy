import { PlaylistCard } from "@/components/PlaylistCard";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Playlists() {
  const { data, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: () => fetch("/api/playlist").then((res) => res.json()),
  });

  const playlists = data?.data || [];

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">All Playlists</h1>
          <p className="text-muted-foreground">
            Browse and discover all available playlists
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No playlists found</p>
            <p className="text-sm">Create your first playlist to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist: any) => (
              <PlaylistCard key={playlist.id} {...playlist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

