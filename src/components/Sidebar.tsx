import { NavLink } from "@/components/NavLink";
import { Home, Search, Library, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
export function Sidebar() {
  const navItems = [{
    icon: Home,
    label: "Home",
    path: "/"
  }, {
    icon: Search,
    label: "Search",
    path: "/search"
  }, {
    icon: Library,
    label: "Your Library",
    path: "/library"
  }];
  const playlists = ["Structural Elements", "MEP Components", "Furniture & Fixtures", "Frequently Used", "Recent Projects"];
  return <div className="w-64 bg-sidebar flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Revitfy</h1>
      </div>

      <nav className="space-y-1 px-3">
        {navItems.map(item => <NavLink key={item.path} to={item.path} className="flex items-center gap-4 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground bg-secondary">
            <item.icon className="w-6 h-6" />
            <span className="font-medium">{item.label}</span>
          </NavLink>)}
      </nav>

      <Separator className="my-4 mx-3" />

      <div className="flex-1 overflow-auto spotify-scrollbar px-3">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground">
            <Heart className="w-6 h-6" />
            <span className="font-medium">Liked Families</span>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground">
            <Plus className="w-6 h-6" />
            <span className="font-medium">Create Playlist</span>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 pb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Playlists
          </h3>
          {playlists.map(playlist => <button key={playlist} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
              {playlist}
            </button>)}
        </div>
      </div>
    </div>;
}