import { NavLink } from "@/components/NavLink";
import {
  Home,
  Search,
  Library,
  Heart,
  Plus,
  PanelLeft,
  PanelRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AddFamilyDialog } from "@/components/AddFamilyDialog";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);
  const navigate = useNavigate();
  const session = authClient.useSession();
  const user = session.data?.user;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      navigate("/auth/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || "";
    }
    return email?.[0]?.toUpperCase() || "U";
  };
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

      <div className="flex-1 overflow-auto spotify-scrollbar px-3">
        {!isCollapsed ? (
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
              onClick={() => setIsAddFamilyDialogOpen(true)}
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Add Family</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCreatePlaylistDialogOpen(true)}
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Create Playlist</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2 text-muted-foreground hover:text-foreground"
                >
                  <Heart className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Liked Families</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsAddFamilyDialogOpen(true)}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Family</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsCreatePlaylistDialogOpen(true)}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create Playlist</TooltipContent>
            </Tooltip>
          </div>
        )}

        {!isCollapsed && (
          <>
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
          </>
        )}
      </div>

      {/* User Profile Widget */}
      <div className="p-3 border-t border-border">
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-2 justify-center"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user?.name, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent side="right">
              {user?.name || "User"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto p-2 justify-start gap-3 hover:bg-secondary"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback>
                    {getUserInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                  <span className="text-sm font-medium truncate w-full text-left">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AddFamilyDialog
        open={isAddFamilyDialogOpen}
        onOpenChange={setIsAddFamilyDialogOpen}
      />
      <CreatePlaylistDialog
        open={isCreatePlaylistDialogOpen}
        onOpenChange={setIsCreatePlaylistDialogOpen}
      />
    </div>
  );
}
