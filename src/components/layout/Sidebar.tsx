
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  BarChart, 
  TrendingUp,
  Calendar,
  ChevronRight,
  UserSquare,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { funcionario, hasPermission } = useAuth();
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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
            {/* Todos os usuários veem o Dashboard */}
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/" />
            
            {/* Todos os níveis podem ver a lista de Ordens de Serviço */}
            <NavItem icon={FileText} label="Ordens de Serviço" to="/ordens" />
            
            {/* Funcionários - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={Users} label="Funcionários" to="/funcionarios" />
            )}
            
            {/* Clientes - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={UserSquare} label="Clientes" to="/clientes" />
            )}
            
            {/* Agenda - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={Calendar} label="Agenda" to="/agenda" />
            )}
            
            {/* Relatórios - Produção para Gerente ou superior, Financeiro para Admin */}
            {hasPermission('gerente') && (
              <>
                <NavItem icon={Wrench} label="Relatórios de Produção" to="/relatorios/producao" />
                {hasPermission('admin') && (
                  <NavItem icon={TrendingUp} label="Relatórios Financeiros" to="/relatorios/financeiro" />
                )}
              </>
            )}
            
            <Separator className="my-4 bg-sidebar-border" />
            
            {/* Configurações - Apenas Admin */}
            {hasPermission('admin') && (
              <NavItem icon={Settings} label="Configurações" to="/configuracoes" />
            )}
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
            {/* Todos os usuários veem o Dashboard */}
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/" isCollapsed={isCollapsed} />
            
            {/* Todos os níveis podem ver a lista de Ordens de Serviço */}
            <NavItem icon={FileText} label="Ordens de Serviço" to="/ordens" isCollapsed={isCollapsed} />
            
            {/* Funcionários - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={Users} label="Funcionários" to="/funcionarios" isCollapsed={isCollapsed} />
            )}
            
            {/* Clientes - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={UserSquare} label="Clientes" to="/clientes" isCollapsed={isCollapsed} />
            )}
            
            {/* Agenda - Gerente ou superior */}
            {hasPermission('gerente') && (
              <NavItem icon={Calendar} label="Agenda" to="/agenda" isCollapsed={isCollapsed} />
            )}
            
            {/* Relatórios - Produção para Gerente ou superior, Financeiro para Admin */}
            {hasPermission('gerente') && (
              <>
                <NavItem icon={Wrench} label="Relatórios de Produção" to="/relatorios/producao" isCollapsed={isCollapsed} />
                {hasPermission('admin') && (
                  <NavItem icon={TrendingUp} label="Relatórios Financeiros" to="/relatorios/financeiro" isCollapsed={isCollapsed} />
                )}
              </>
            )}
            
            <Separator className="my-4 bg-sidebar-border" />
            
            {/* Configurações - Apenas Admin */}
            {hasPermission('admin') && (
              <NavItem icon={Settings} label="Configurações" to="/configuracoes" isCollapsed={isCollapsed} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
