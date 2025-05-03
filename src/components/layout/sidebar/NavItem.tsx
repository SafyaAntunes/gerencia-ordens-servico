
import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';

type NavItemProps = {
  icon: ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  isCollapsed?: boolean;
};

const NavItem = ({ icon, label, href, isActive, isCollapsed = false }: NavItemProps) => {
  return (
    <NavLink 
      to={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-sidebar-accent text-primary font-medium' 
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }
      `}
    >
      {icon}
      {!isCollapsed && (
        <span className="flex-1">{label}</span>
      )}
    </NavLink>
  );
};

export default NavItem;
