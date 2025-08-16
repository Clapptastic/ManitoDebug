
import React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavHeaderProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  handleLogoClick: () => void;
}

const NavHeader: React.FC<NavHeaderProps> = ({
  isCollapsed,
  toggleSidebar,
  handleLogoClick
}) => {
  return (
    <div className="flex h-16 items-center justify-between px-4 border-b">
      <button 
        className={cn(
          "font-bold text-xl whitespace-nowrap transition-opacity duration-300 text-primary flex items-center gap-2 cursor-pointer",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
        onClick={handleLogoClick}
        aria-label="Go to dashboard"
      >
        <img 
          src="/lovable-uploads/41b9e296-bcaa-49cb-8f93-e6f20ab3de94.png" 
          alt="Uppi.ai Logo" 
          className="h-5 w-auto" 
        />
        {!isCollapsed && "Uppi.ai"}
      </button>
      <button
        className="p-2 rounded-md hover:bg-secondary/80 transition-colors"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Menu className="h-4 w-4 text-primary" />
      </button>
    </div>
  );
};

export default NavHeader;
