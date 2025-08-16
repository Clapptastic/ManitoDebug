
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Search, 
  Key, 
  Activity, 
  FileText, 
  Settings,
  Home
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Competitor Analysis', href: '/market-research/competitor-analysis', icon: Search },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Documentation', href: '/documentation', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        "lg:translate-x-0",
        !isOpen && "lg:w-16"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-6 border-b border-gray-200">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            {isOpen && (
              <span className="ml-3 text-xl font-bold text-gray-900">
                Uppi.ai
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <item.icon className={cn(
                    "flex-shrink-0 h-5 w-5",
                    isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {isOpen && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
