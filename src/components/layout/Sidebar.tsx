
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  BarChart, 
  Calendar,
  ChevronRight,
  LogOut,
  UserSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

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

export default function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };
  
  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    closed: { 
      x: "-100%",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  const mobileClass = isOpen ? "block lg:hidden" : "hidden";
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-50 bg-sidebar w-64 shadow-xl ${mobileClass}`}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="font-bold text-white">SGR</span>
              </div>
              <span className="font-semibold">Sistema de Gestão</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <ChevronRight />
            </Button>
          </div>
          
          <div className="flex-1 px-3 py-2 space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/" />
            <NavItem icon={FileText} label="Ordens de Serviço" to="/ordens" badge={12} />
            <NavItem icon={Users} label="Funcionários" to="/funcionarios" />
            <NavItem icon={UserSquare} label="Clientes" to="/clientes" />
            <NavItem icon={Calendar} label="Agenda" to="/agenda" />
            <NavItem icon={BarChart} label="Relatórios" to="/relatorios" />
            <Separator className="my-4 bg-sidebar-border" />
            <NavItem icon={Settings} label="Configurações" to="/configuracoes" />
          </div>
          
          <div className="p-4 mt-auto">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </motion.aside>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed top-0 left-0 h-full z-30 bg-sidebar transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="font-bold text-white">SGR</span>
                </div>
                <span className="font-semibold">Sistema de Gestão</span>
              </div>
            )}
            {isCollapsed && (
              <div className="mx-auto h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="font-bold text-white">SGR</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 px-3 py-2 space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/" isCollapsed={isCollapsed} />
            <NavItem icon={FileText} label="Ordens de Serviço" to="/ordens" badge={isCollapsed ? undefined : 12} isCollapsed={isCollapsed} />
            <NavItem icon={Users} label="Funcionários" to="/funcionarios" isCollapsed={isCollapsed} />
            <NavItem icon={UserSquare} label="Clientes" to="/clientes" isCollapsed={isCollapsed} />
            <NavItem icon={Calendar} label="Agenda" to="/agenda" isCollapsed={isCollapsed} />
            <NavItem icon={BarChart} label="Relatórios" to="/relatorios" isCollapsed={isCollapsed} />
            <Separator className="my-4 bg-sidebar-border" />
            <NavItem icon={Settings} label="Configurações" to="/configuracoes" isCollapsed={isCollapsed} />
          </div>
          
          <div className="p-4 mt-auto">
            {!isCollapsed && (
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            )}
            {isCollapsed && (
              <Button variant="ghost" size="icon" className="mx-auto text-sidebar-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
