
import { cn } from "@/lib/utils";
import { StatusOS, Prioridade, EtapaOS } from "@/types/ordens";

type StatusBadgeProps = {
  status: StatusOS | Prioridade | EtapaOS;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusOS | Prioridade | EtapaOS) => {
    // Status de Ordem de Serviço
    if (status === "orcamento") return { label: "Orçamento", color: "bg-blue-100 text-blue-800" };
    if (status === "aguardando_aprovacao") return { label: "Aguardando Aprovação", color: "bg-amber-100 text-amber-800" };
    if (status === "autorizado") return { label: "Autorizado", color: "bg-green-100 text-green-800" }; // Added new status
    if (status === "executando_servico") return { label: "Executando Serviço", color: "bg-purple-100 text-purple-800" }; // Changed from fabricacao
    if (status === "aguardando_peca_cliente") return { label: "Aguardando Peça (Cliente)", color: "bg-gray-100 text-gray-800" };
    if (status === "aguardando_peca_interno") return { label: "Aguardando Peça (Interno)", color: "bg-yellow-100 text-yellow-800" };
    if (status === "finalizado") return { label: "Finalizado", color: "bg-green-100 text-green-800" };
    if (status === "entregue") return { label: "Entregue", color: "bg-emerald-100 text-emerald-800" };
    
    // Prioridades
    if (status === "baixa") return { label: "Baixa", color: "bg-green-100 text-green-800" };
    if (status === "media") return { label: "Média", color: "bg-blue-100 text-blue-800" };
    if (status === "alta") return { label: "Alta", color: "bg-amber-100 text-amber-800" };
    if (status === "urgente") return { label: "Urgente", color: "bg-red-100 text-red-800" };
    
    // Fallback
    return { label: "Desconhecido", color: "bg-gray-100 text-gray-800" };
  };

  const { label, color } = getStatusConfig(status);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all animate-fade-in",
        color,
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}
