
import React from "react";

interface ServicoTagProps {
  servico: any;
  emAndamento: boolean;
  pausado: boolean;
}

export default function ServicoTag({ servico, emAndamento, pausado }: ServicoTagProps) {
  // Define a cor de fundo para cada serviço de acordo com seu status
  const getServicoStatusColor = (concluido: boolean, estaEmAndamento: boolean = false, estaPausado: boolean = false) => {
    if (concluido) {
      return "bg-green-100 text-green-800"; // Verde para serviços concluídos
    } else if (estaPausado) {
      return "bg-yellow-100 text-yellow-800"; // Amarelo para serviços pausados
    } else if (estaEmAndamento) {
      return "bg-blue-100 text-blue-800"; // Azul para serviços em andamento
    } else {
      return "bg-red-100 text-red-800"; // Vermelho para serviços não iniciados
    }
  };

  return (
    <span 
      className={`text-xs px-2 py-0.5 rounded-full ${
        getServicoStatusColor(servico.concluido, emAndamento, pausado)
      }`}
    >
      {servico.tipo.replace('_', ' ')}
    </span>
  );
}
