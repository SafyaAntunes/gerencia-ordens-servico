
import React, { useEffect } from "react";

interface ServicoTagProps {
  servico: any;
  emAndamento: boolean;
  pausado: boolean;
}

export default function ServicoTag({ servico, emAndamento, pausado }: ServicoTagProps) {
  // Log para debugging dos props recebidos
  useEffect(() => {
    console.log(`ServicoTag - ${servico.tipo}: concluido=${servico.concluido}, emAndamento=${emAndamento}, pausado=${pausado}`);
  }, [servico, emAndamento, pausado]);

  // Define a cor de fundo para cada serviço de acordo com seu status
  const getServicoStatusColor = () => {
    if (servico.concluido) {
      return "bg-green-100 text-green-800"; // Verde para serviços concluídos
    } else if (pausado) {
      return "bg-yellow-100 text-yellow-800"; // Amarelo para serviços pausados
    } else if (emAndamento) {
      return "bg-blue-100 text-blue-800"; // Azul para serviços em andamento
    } else {
      return "bg-red-100 text-red-800"; // Vermelho para serviços não iniciados
    }
  };

  return (
    <span 
      className={`text-xs px-2 py-0.5 rounded-full ${getServicoStatusColor()}`}
      data-status={servico.concluido ? "concluido" : (pausado ? "pausado" : (emAndamento ? "andamento" : "nao-iniciado"))}
    >
      {servico.tipo.replace('_', ' ')}
    </span>
  );
}
