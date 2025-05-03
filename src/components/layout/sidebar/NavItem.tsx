
import { NavLink } from 'react-router-dom';

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
  isCollapsed?: boolean;
};

const NavItem = ({ icon: Icon, label, to, badge, isCollapsed = false }: NavItemProps) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-sidebar-accent text-primary font-medium' 
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }
      `}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge ? (
            <span className="h-5 min-w-5 rounded-full bg-primary flex items-center justify-center text-xs text-white">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
};

export default NavItem;
