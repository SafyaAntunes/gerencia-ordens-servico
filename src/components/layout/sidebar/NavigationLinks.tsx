
import { useLocation } from 'react-router-dom';
import NavItem from './NavItem';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCircle, 
  Calendar, 
  BarChart2,
  Settings,
  Wrench 
} from 'lucide-react';

interface NavigationLinksProps {
  isCollapsed: boolean;
}

const NavigationLinks = ({ isCollapsed }: NavigationLinksProps) => {
  const { pathname } = useLocation();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex flex-col py-4 flex-1">
      <nav className="flex-1">
        <div className="px-3 py-2">
          <NavItem 
            href="/dashboard" 
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            isActive={isActive('/dashboard')}
            isCollapsed={isCollapsed}
          />

          <NavItem 
            href="/ordens" 
            icon={<FileText className="h-5 w-5" />}
            label="Ordens de Serviço"
            isActive={isActive('/ordens')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            href="/funcionarios" 
            icon={<Users className="h-5 w-5" />}
            label="Funcionários"
            isActive={isActive('/funcionarios')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            href="/clientes" 
            icon={<UserCircle className="h-5 w-5" />}
            label="Clientes"
            isActive={isActive('/clientes')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            href="/motores" 
            icon={<Wrench className="h-5 w-5" />} 
            label="Motores"
            isActive={isActive('/motores')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            href="/agenda" 
            icon={<Calendar className="h-5 w-5" />}
            label="Agenda"
            isActive={isActive('/agenda')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            href="/relatorios/producao" 
            icon={<BarChart2 className="h-5 w-5" />}
            label="Relatórios de Produção"
            isActive={isActive('/relatorios/producao')}
            isCollapsed={isCollapsed}
          />
          
          <div className="mt-2 border-t border-sidebar-muted pt-2">
            <NavItem 
              href="/configuracoes" 
              icon={<Settings className="h-5 w-5" />}
              label="Configurações"
              isActive={isActive('/configuracoes')}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavigationLinks;
