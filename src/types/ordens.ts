
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
  clienteId?: string;
  clienteNome?: string;
};

// Define TipoServico as an enum so it can be used as a value
export enum TipoServico {
  BLOCO = 'bloco',
  BIELA = 'biela',
  CABECOTE = 'cabecote',
  VIRABREQUIM = 'virabrequim',
  EIXO_COMANDO = 'eixo_comando',
  MONTAGEM = 'montagem',
  MONTAGEM_PARCIAL = 'montagem_parcial',
  DINAMOMETRO = 'dinamometro',
  LAVAGEM = 'lavagem',
  INSPECAO_INICIAL = 'inspecao_inicial',
  INSPECAO_FINAL = 'inspecao_final'
}

export type TipoAtividade =
  | 'lavagem'
  | 'inspecao_inicial'
  | 'inspecao_final';

export type SubAtividade = {
  id: string;
  nome: string;
  selecionada: boolean;
  concluida?: boolean;
  tempoEstimado?: number;
  servicoTipo?: TipoServico | null;
  tipoAtividade?: string;
  descricao?: string;
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
  funcionarioId?: string;
  funcionarioNome?: string;
  dataConclusao?: Date;
};

export type StatusOS = 
  | 'desmontagem'
  | 'inspecao_inicial'
  | 'orcamento'
  | 'aguardando_aprovacao'
  | 'autorizado'
  | 'executando_servico'
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
  ordemId?: string;
  ordemNome?: string;
  servicoTipo?: string;
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

import { TimerState } from '@/types/timer';

export type OrdemServico = {
  id: string;
  nome: string;
  cliente: Cliente;
  motorId?: string;
  dataAbertura: Date;
  dataPrevistaEntrega: Date;
  prioridade: Prioridade;
  servicos: Servico[];
  status: StatusOS;
  progressoEtapas?: number;
  observacoes?: string;
  etapasAndamento: {
    [key in EtapaOS]?: {
      concluido: boolean;
      funcionarioId?: string;
      funcionarioNome?: string;
      iniciado?: Date;
      finalizado?: Date;
      usarCronometro?: boolean;
      pausas?: PausaRegistro[];
      tempoEstimado?: number;
      servicoTipo?: TipoServico;
    }
  };
  tempoRegistros: TempoRegistro[];
  fotosEntrada?: FotoBase64[] | any[];
  fotosSaida?: FotoBase64[] | any[];
  tempoTotalEstimado?: number;
  timers?: {
    [key: string]: TimerState;
  };
};
