
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
    if (status === "orcamento") return { label: "Em Orçamento", color: "bg-blue-100 text-blue-800" };
    if (status === "aguardando_aprovacao") return { label: "Aguardando Aprovação", color: "bg-amber-100 text-amber-800" };
    if (status === "fabricacao") return { label: "Em Fabricação", color: "bg-purple-100 text-purple-800" };
    if (status === "espera_cliente") return { label: "Em Espera (Cliente)", color: "bg-gray-100 text-gray-800" };
    if (status === "finalizado") return { label: "Finalizado", color: "bg-green-100 text-green-800" };
    if (status === "entregue") return { label: "Entregue", color: "bg-emerald-100 text-emerald-800" };
    
    // Prioridades
    if (status === "baixa") return { label: "Baixa", color: "bg-green-100 text-green-800" };
    if (status === "media") return { label: "Média", color: "bg-blue-100 text-blue-800" };
    if (status === "alta") return { label: "Alta", color: "bg-amber-100 text-amber-800" };
    if (status === "urgente") return { label: "Urgente", color: "bg-red-100 text-red-800" };
    
    // Etapas
    if (status === "lavagem") return { label: "Lavagem", color: "bg-blue-100 text-blue-800" };
    if (status === "inspecao_inicial") return { label: "Inspeção Inicial", color: "bg-indigo-100 text-indigo-800" };
    if (status === "retifica") return { label: "Retífica", color: "bg-purple-100 text-purple-800" };
    if (status === "montagem_final") return { label: "Montagem Final", color: "bg-pink-100 text-pink-800" };
    if (status === "teste") return { label: "Teste", color: "bg-amber-100 text-amber-800" };
    if (status === "inspecao_final") return { label: "Inspeção Final", color: "bg-teal-100 text-teal-800" };
    
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
