
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Calendar,
  UserSquare,
  Wrench
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import NavItem from './NavItem';

type NavigationLinksProps = {
  isCollapsed?: boolean;
};

const NavigationLinks = ({ isCollapsed = false }: NavigationLinksProps) => {
  const { hasPermission } = useAuth();

  return (
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
      
      {/* Relatórios - Produção para Gerente ou superior */}
      {hasPermission('gerente') && (
        <NavItem icon={Wrench} label="Relatórios de Produção" to="/relatorios/producao" isCollapsed={isCollapsed} />
      )}
      
      <Separator className="my-4 bg-sidebar-border" />
      
      {/* Configurações - Apenas Admin */}
      {hasPermission('admin') && (
        <NavItem icon={Settings} label="Configurações" to="/configuracoes" isCollapsed={isCollapsed} />
      )}
    </div>
  );
};

export default NavigationLinks;
