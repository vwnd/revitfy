import { NavLink } from "@/components/NavLink";
import {
  Home,
  Search,
  Library,
  Heart,
  Plus,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: Search,
      label: "Search",
      path: "/search",
    },
    {
      icon: Library,
      label: "Your Library",
      path: "/library",
    },
  ];
  const playlists = [
    "Structural Elements",
    "MEP Components",
    "Furniture & Fixtures",
    "Frequently Used",
    "Recent Projects",
  ];

  return (
    <div
      className={cn(
        "bg-sidebar flex flex-col h-screen fixed left-0 top-0 transition-all duration-200 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "p-6 flex items-center transition-all duration-200 ease-in-out",
          isCollapsed ? "px-3 justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-primary">Revitfy</h1>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 shrink-0"
            >
              {isCollapsed ? (
                <PanelRight className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors",
                  isCollapsed && "justify-center px-2"
                )}
                activeClassName="text-foreground bg-secondary"
              >
                <item.icon className="w-6 h-6 shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">{item.label}</TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="px-3">
          <Separator className="my-4" />
        </div>
      )}

      {!isCollapsed && (
        <div className="flex-1 overflow-auto spotify-scrollbar px-3">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground"
            >
              <Heart className="w-6 h-6" />
              <span className="font-medium">Liked Families</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Create Playlist</span>
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 pb-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Playlists
            </h3>
            {playlists.map((playlist) => (
              <button
                key={playlist}
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
              >
                {playlist}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
