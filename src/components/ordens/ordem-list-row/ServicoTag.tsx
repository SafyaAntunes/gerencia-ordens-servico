
import React from "react";
import { TipoServico } from "@/types/ordens";

interface ServicoTagProps {
  tipo: TipoServico;
  concluido: boolean;
  emAndamento?: boolean;
  pausado?: boolean;
}

export default function ServicoTag({ tipo, concluido, emAndamento = false, pausado = false }: ServicoTagProps) {
  // Define a cor de fundo para cada serviço de acordo com seu status
  const getServicoStatusColor = () => {
    if (concluido) {
      return "bg-green-100 text-green-800"; // Verde para serviços concluídos
    } else if (pausado) {
      return "bg-yellow-100 text-yellow-800"; // Amarelo para serviços pausados
    } else if (emAndamento) {
      return "bg-blue-100 text-blue-800"; // Azul para serviços em andamento
    } else {
      return "bg-gray-100 text-gray-800"; // Cinza para serviços não iniciados
    }
  };

  return (
    <span 
      className={`text-xs px-2 py-0.5 rounded-full ${getServicoStatusColor()}`}
      data-status={concluido ? "concluido" : (pausado ? "pausado" : (emAndamento ? "andamento" : "nao-iniciado"))}
    >
      {tipo.replace('_', ' ')}
    </span>
  );
}
