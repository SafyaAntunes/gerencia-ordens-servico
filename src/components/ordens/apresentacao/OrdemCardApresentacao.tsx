import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OrdemServico, TipoServico } from "@/types/ordens";
import { useMotores } from "@/hooks/useMotores";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemCardApresentacaoProps {
  ordem: OrdemServico;
  prioridadeNumero: number; // 1,2,3...
  onClick?: () => void;
}

export default function OrdemCardApresentacao({ ordem, prioridadeNumero, onClick }: OrdemCardApresentacaoProps) {
  const { motores } = useMotores();
  const motor = motores.find(m => m.id === ordem.motorId);
  
  const progresso = Math.round(ordem.progressoEtapas || 0);
  const previsao = ordem.dataPrevistaEntrega
    ? formatDistanceToNow(new Date(ordem.dataPrevistaEntrega), { addSuffix: true, locale: ptBR })
    : "-";

  const prioridadeVariant =
    ordem.prioridade === "urgente"
      ? "destructive"
      : ordem.prioridade === "alta"
      ? "warning"
      : ordem.prioridade === "media"
      ? "secondary"
      : "outline";

  // Tipos de serviço para exibir
  const tiposServico = ordem.servicos?.map(s => s.tipo) || [];

  // Função para determinar a cor do card baseada nos serviços
  const getCardBackgroundColor = () => {
    if (tiposServico.includes(TipoServico.BLOCO)) {
      return "bg-green-50 border-green-200 hover:border-green-300";
    }
    if (tiposServico.some(tipo => [TipoServico.VIRABREQUIM, TipoServico.EIXO_COMANDO, TipoServico.BIELA].includes(tipo))) {
      return "bg-yellow-50 border-yellow-200 hover:border-yellow-300";
    }
    if (tiposServico.includes(TipoServico.CABECOTE)) {
      return "bg-blue-50 border-blue-200 hover:border-blue-300";
    }
    if (tiposServico.some(tipo => [TipoServico.MONTAGEM, TipoServico.MONTAGEM_PARCIAL].includes(tipo))) {
      return "bg-orange-50 border-orange-200 hover:border-orange-300";
    }
    return "bg-card border-border hover:border-primary/50";
  };

  // Função para obter a variante do badge baseada no tipo de serviço
  const getServiceBadgeVariant = (tipo: TipoServico) => {
    switch (tipo) {
      case TipoServico.BLOCO:
        return "bloco";
      case TipoServico.VIRABREQUIM:
      case TipoServico.EIXO_COMANDO:
      case TipoServico.BIELA:
        return "virabrequim";
      case TipoServico.CABECOTE:
        return "cabecote";
      case TipoServico.MONTAGEM:
      case TipoServico.MONTAGEM_PARCIAL:
        return "montagem";
      default:
        return "outline";
    }
  };

  return (
    <TooltipProvider>
      <Card
        role="article"
        onClick={onClick}
        className={`relative p-2 cursor-grab select-none border-2 transition-colors h-[180px] w-full overflow-hidden ${getCardBackgroundColor()}`}
      >
        {/* Número da prioridade - canto superior direito */}
        <div className="absolute -top-1 -right-1 z-10">
          <Badge className="text-sm font-bold px-2 py-0.5 shadow-md" variant="default">#{prioridadeNumero}</Badge>
        </div>

        {/* OS # - Primeira linha, grande e negrito */}
        <div className="mb-1">
          <h3 className="text-base font-bold text-foreground truncate">OS #{ordem.id}</h3>
        </div>

        {/* Cliente - Segunda linha, negrito */}
        <div className="mb-1">
          <p className="text-xs font-bold text-foreground truncate">{ordem.cliente?.nome || 'Cliente não informado'}</p>
        </div>

        {/* Motor - Terceira linha (novo) */}
        {motor && (
          <div className="mb-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Motor:</span> {motor.marca} {motor.modelo}
              {motor.numeroCilindros && ` - ${motor.numeroCilindros}cil`}
              {motor.cilindrada && ` - ${motor.cilindrada}`}
            </p>
          </div>
        )}

        {/* Status e Prioridade - Quarta linha */}
        <div className="mb-1">
          <div className="flex items-center justify-between">
            <StatusBadge status={ordem.status} />
            <Badge variant={prioridadeVariant} className="text-xs">{ordem.prioridade}</Badge>
          </div>
        </div>

        {/* Tipos de serviço com cores - Quinta linha */}
        <div className="mb-1">
          <div className="flex flex-wrap gap-1">
            {tiposServico.map((tipo, index) => (
              <Badge 
                key={index} 
                variant={getServiceBadgeVariant(tipo)} 
                className="text-xs px-1 py-0.5"
              >
                {tipo.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Observações - Sexta linha (novo) */}
        {ordem.observacoes && (
          <div className="mb-1">
            {ordem.observacoes.length > 40 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate cursor-help">
                    <span className="font-medium">Obs:</span> {ordem.observacoes}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{ordem.observacoes}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Obs:</span> {ordem.observacoes}
              </p>
            )}
          </div>
        )}

        {/* Previsão - Última linha */}
        <div className="text-xs text-muted-foreground font-medium">
          Entrega: {previsao}
        </div>
      </Card>
    </TooltipProvider>
  );
}