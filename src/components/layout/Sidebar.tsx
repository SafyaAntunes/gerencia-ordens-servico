
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  BarChart,
  DollarSign,
  TrendingUp,
  Timer,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { funcionario } = useAuth();
  const [isRelatoriosOpen, setIsRelatoriosOpen] = useState(false);

  const isAdmin = funcionario?.nivelPermissao === "admin";
  const isGerente = funcionario?.nivelPermissao === "gerente";
  const isAdminOrGerente = isAdmin || isGerente;

  useEffect(() => {
    // Abrir automaticamente o submenu de relatórios se estiver em uma página de relatório
    if (location.pathname.includes("/relatorios")) {
      setIsRelatoriosOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      visible: true,
    },
    {
      name: "Clientes",
      path: "/clientes",
      icon: <Users className="h-5 w-5" />,
      visible: true,
    },
    {
      name: "Ordens de Serviço",
      path: "/ordens",
      icon: <ClipboardList className="h-5 w-5" />,
      visible: true,
    },
    {
      name: "Agenda",
      path: "/agenda",
      icon: <Calendar className="h-5 w-5" />,
      visible: true,
    },
    {
      name: "Produtividade",
      path: "/produtividade",
      icon: <TrendingUp className="h-5 w-5" />,
      visible: isAdminOrGerente,
    },
    {
      name: "Funcionários",
      path: "/funcionarios",
      icon: <Users className="h-5 w-5" />,
      visible: isAdminOrGerente,
    },
    {
      name: "Relatórios",
      path: null,
      icon: <BarChart className="h-5 w-5" />,
      submenu: [
        {
          name: "Visão Geral",
          path: "/relatorios",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          name: "Financeiro",
          path: "/relatorios/financeiro",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "Produção",
          path: "/relatorios/producao",
          icon: <Timer className="h-4 w-4" />,
        },
      ],
      visible: isAdminOrGerente,
    },
    {
      name: "Configurações",
      path: "/configuracoes",
      icon: <Settings className="h-5 w-5" />,
      visible: isAdminOrGerente,
    },
  ];

  return (
    <div className="h-full border-r bg-background flex flex-col">
      <div className="p-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-semibold text-xl"
        >
          <Clock className="h-6 w-6" />
          <span>Retífica App</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-2">
          {menuItems
            .filter((item) => item.visible)
            .map((item, idx) => {
              if (item.submenu) {
                return (
                  <Collapsible
                    key={idx}
                    open={isRelatoriosOpen}
                    onOpenChange={setIsRelatoriosOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between",
                          location.pathname.includes("/relatorios") &&
                            "bg-muted"
                        )}
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-2">{item.name}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isRelatoriosOpen && "rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-6 pt-2 space-y-1">
                        {item.submenu.map((subitem, subidx) => (
                          <Link
                            key={subidx}
                            to={subitem.path}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-muted",
                              location.pathname === subitem.path && "bg-muted"
                            )}
                          >
                            {subitem.icon}
                            <span>{subitem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={idx}
                  to={item.path || "/"}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted",
                    location.pathname === item.path && "bg-muted"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sair
        </Button>
        {funcionario && (
          <div className="text-xs text-center mt-2 text-muted-foreground">
            {funcionario.nome}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
