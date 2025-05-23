
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco?: string;
  cnpj_cpf?: string;
  observacoes?: string;
  motores?: Motor[];
};

export type Motor = {
  id: string;
  marca: string;
  modelo: string;
  ano?: string;
  numeroSerie?: string;
  cilindradas?: string;
  observacoes?: string;
};

export type TipoServico = 
  | 'bloco' 
  | 'biela' 
  | 'cabecote' 
  | 'virabrequim' 
  | 'eixo_comando'
  | 'montagem'
  | 'dinamometro'
  | 'lavagem'         // Adicionado como serviço 
  | 'inspecao_inicial' // Adicionado como serviço
  | 'inspecao_final';  // Adicionado como serviço

export type TipoAtividade =
  | 'lavagem'
  | 'inspecao_inicial'
  | 'inspecao_final';

export type SubAtividade = {
  id: string;
  nome: string;
  selecionada: boolean;
  concluida?: boolean;
  tempoEstimado?: number; // Tempo estimado em horas
  servicoTipo?: TipoServico | null; // A qual tipo de serviço esta subatividade se relaciona
  tipoAtividade?: string; // Added this property
  descricao?: string; // Descrição opcional da subatividade
};

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export type Servico = {
  tipo: TipoServico;
  descricao: string;
  concluido: boolean;
  status?: ServicoStatus;
  subatividades?: SubAtividade[];
  atividadesRelacionadas?: {
    lavagem?: SubAtividade[];
    inspecao_inicial?: SubAtividade[];
    inspecao_final?: SubAtividade[];
  };
  funcionarioId?: string; // ID do funcionário que concluiu o serviço
  funcionarioNome?: string; // Nome do funcionário que concluiu o serviço
  dataConclusao?: Date; // Data de conclusão do serviço
};

export type StatusOS = 
  | 'desmontagem'
  | 'inspecao_inicial'
  | 'orcamento'
  | 'aguardando_aprovacao'
  | 'autorizado'  // Added new status
  | 'executando_servico'  // Changed from 'fabricacao'
  | 'aguardando_peca_cliente'
  | 'aguardando_peca_interno'
  | 'finalizado'
  | 'entregue';

export type EtapaOS = 
  | 'lavagem' 
  | 'inspecao_inicial' 
  | 'retifica' 
  | 'montagem' 
  | 'dinamometro' 
  | 'inspecao_final';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export type TempoRegistro = {
  inicio: Date;
  fim?: Date;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  ordemId?: string;  // Added this property
  ordemNome?: string; // Added for completeness
  servicoTipo?: string; // Added this property
  pausas: { inicio: Date; fim?: Date }[];
};

export type FotoBase64 = {
  nome: string;
  tipo: string;
  tamanho: number;
  data: string;
};

export type PausaRegistro = {
  inicio: number;
  fim?: number;
  motivo?: string;
};

// Importar tipo TimerState para o tipo timers
import { TimerState } from '@/types/timer';

export type OrdemServico = {
  id: string;
  nome: string;
  cliente: Cliente;
  motorId?: string; // Referência ao motor selecionado
  dataAbertura: Date;
  dataPrevistaEntrega: Date;
  prioridade: Prioridade;
  servicos: Servico[];
  status: StatusOS;
  progressoEtapas?: number; // Valor entre 0 e 1 representando o percentual de conclusão
  etapasAndamento: {
    [key in EtapaOS]?: {
      concluido: boolean;
      funcionarioId?: string;
      funcionarioNome?: string;
      iniciado?: Date;
      finalizado?: Date;
      usarCronometro?: boolean;
      pausas?: PausaRegistro[];
      tempoEstimado?: number; // Tempo estimado para esta etapa
      servicoTipo?: TipoServico; // Para associar etapas específicas a serviços
    }
  };
  tempoRegistros: TempoRegistro[];
  fotosEntrada?: FotoBase64[] | any[];
  fotosSaida?: FotoBase64[] | any[];
  tempoTotalEstimado?: number; // Tempo total estimado para todas as etapas e subatividades
  // Adicionar propriedade timers para armazenar estado dos timers de serviços
  timers?: {
    [key: string]: TimerState;
  };
};
