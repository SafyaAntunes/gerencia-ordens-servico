
import { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import NavigationLinks from './NavigationLinks';

const DesktopSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`hidden lg:block fixed top-0 left-0 h-full z-30 bg-sidebar transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        <SidebarHeader 
          isCollapsed={isCollapsed} 
          onToggleCollapse={toggleCollapse} 
        />
        <NavigationLinks isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default DesktopSidebar;
