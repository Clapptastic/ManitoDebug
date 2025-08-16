
import * as React from "react";

type SidebarState = "expanded" | "collapsed";
type CollapsibleType = "default" | "offcanvas";

interface SidebarContextType {
  state: SidebarState;
  setState: React.Dispatch<React.SetStateAction<SidebarState>>;
  collapsible: CollapsibleType;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultState?: SidebarState;
  collapsible?: CollapsibleType;
}

export function SidebarProvider({
  children,
  defaultState = "expanded",
  collapsible = "default",
}: SidebarProviderProps) {
  // Make sure we use React.useState directly
  const [state, setState] = React.useState<SidebarState>(() => {
    // Try to get the saved state from localStorage
    const savedState = typeof window !== 'undefined' 
      ? localStorage.getItem('sidebar-state')
      : null;
    
    return (savedState === 'collapsed' || savedState === 'expanded')
      ? savedState as SidebarState
      : defaultState;
  });

  // Track mobile state
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Add window resize listener
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Auto-collapse sidebar on mobile
    if (isMobile && state === "expanded") {
      setState("collapsed");
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, state]);

  // Save state changes to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-state', state);
    }
  }, [state]);

  const expandSidebar = React.useCallback(() => {
    setState("expanded");
  }, []);

  const collapseSidebar = React.useCallback(() => {
    setState("collapsed");
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setState((prevState) => 
      prevState === "expanded" ? "collapsed" : "expanded"
    );
  }, []);

  const value = React.useMemo(() => ({
    state,
    setState,
    collapsible,
    expandSidebar,
    collapseSidebar,
    toggleSidebar,
    isMobile,
  }), [state, collapsible, expandSidebar, collapseSidebar, toggleSidebar, isMobile]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
