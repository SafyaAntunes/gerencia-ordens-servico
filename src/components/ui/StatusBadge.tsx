
import { cn } from "@/lib/utils";

type Status = 
  // Status da OS
  "orcamento" | "aguardando_aprovacao" | "fabricacao" | "espera_cliente" | 
  "finalizado" | "entregue" | 
  // Prioridade
  "baixa" | "media" | "alta" | "urgente" |
  // Status genéricos
  "ativo" | "inativo" | "pendente" | "concluido";

type Size = "xs" | "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: Status;
  className?: string;
  size?: Size;
}

const getStatusConfig = (status: Status) => {
  switch (status) {
    // Status da OS
    case "orcamento":
      return { label: "Em Orçamento", color: "bg-blue-100 text-blue-800" };
    case "aguardando_aprovacao":
      return { label: "Aguardando Aprovação", color: "bg-purple-100 text-purple-800" };
    case "fabricacao":
      return { label: "Em Fabricação", color: "bg-amber-100 text-amber-800" };
    case "espera_cliente":
      return { label: "Em Espera", color: "bg-gray-100 text-gray-800" };
    case "finalizado":
      return { label: "Finalizado", color: "bg-emerald-100 text-emerald-800" };
    case "entregue":
      return { label: "Entregue", color: "bg-teal-100 text-teal-800" };
      
    // Prioridade
    case "baixa":
      return { label: "Baixa", color: "bg-green-100 text-green-800" };
    case "media":
      return { label: "Média", color: "bg-blue-100 text-blue-800" };
    case "alta":
      return { label: "Alta", color: "bg-orange-100 text-orange-800" };
    case "urgente":
      return { label: "Urgente", color: "bg-red-100 text-red-800" };
      
    // Status genéricos
    case "ativo":
      return { label: "Ativo", color: "bg-emerald-100 text-emerald-800" };
    case "inativo":
      return { label: "Inativo", color: "bg-gray-100 text-gray-800" };
    case "pendente":
      return { label: "Pendente", color: "bg-yellow-100 text-yellow-800" };
    case "concluido":
      return { label: "Concluído", color: "bg-emerald-100 text-emerald-800" };
      
    default:
      return { label: "Desconhecido", color: "bg-gray-100 text-gray-800" };
  }
};

const getSizeClasses = (size: Size) => {
  switch (size) {
    case "xs":
      return "text-[10px] px-1.5 py-0.5 rounded";
    case "sm":
      return "text-xs px-2 py-1 rounded-md";
    case "md":
      return "text-sm px-2.5 py-1 rounded-md";
    case "lg":
      return "text-base px-3 py-1.5 rounded-lg";
    default:
      return "text-xs px-2 py-1 rounded-md";
  }
};

export const StatusBadge = ({ status, className, size = "md" }: StatusBadgeProps) => {
  const { label, color } = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  
  return (
    <span
      className={cn(
        "font-medium inline-flex items-center justify-center whitespace-nowrap",
        color,
        sizeClasses,
        className
      )}
    >
      {label}
    </span>
  );
};
