
"use client"

// Just re-export components from the structured sidebar
export {
  SidebarProvider,
  useSidebar
} from "./sidebar/SidebarContext";

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSection,
  SidebarNav
} from "./sidebar/SidebarComponents";

export {
  SidebarTrigger,
  SidebarOverlay
} from "./sidebar/SidebarControls";

export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuGroup
} from "./sidebar/SidebarMenu";
