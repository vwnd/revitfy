import { FilterBar } from "@/components/FilterBar";
import { PlaylistCard } from "@/components/PlaylistCard";
import { useQuery } from "@tanstack/react-query";

export default function Home() {

  const { data: madeForYou, isLoading: isLoadingMadeForYou } = useQuery({
    queryKey: ["made-for-you"],
    queryFn: () => fetch("/api/made-for-you").then((res) => res.json()),
  });

  const { data: recentlyUsed, isLoading: isLoadingRecentlyUsed } = useQuery({
    queryKey: ["recently-used"],
    queryFn: () => fetch("/api/recently-used").then((res) => res.json()),
  });

  return (
    <div className="w-full h-full">
      <div className="p-8">
        <FilterBar />

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Made for you</h2>
          {isLoadingMadeForYou ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {madeForYou?.data?.map((playlist: any) => (
                <PlaylistCard key={playlist.id} {...playlist} />
              ))}
              {(!madeForYou?.data || madeForYou.data.length === 0) && (
                <div className="col-span-full text-muted-foreground">
                  No playlists available. Create your first playlist!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recently Used</h2>
          {isLoadingRecentlyUsed ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recentlyUsed?.data?.map((playlist: any) => (
                <PlaylistCard key={playlist.id} {...playlist} />
              ))}
              {(!recentlyUsed?.data || recentlyUsed.data.length === 0) && (
                <div className="col-span-full text-muted-foreground">
                  No playlists available. Create your first playlist!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
