
export interface TempoRegistro {
  id: string;
  timestamp: Date;
  duracao: number;
  usuario: string;
  acao: string;
  observacao?: string;
}

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
};

export type TipoServico = 
  | 'bloco' 
  | 'biela' 
  | 'cabecote' 
  | 'virabrequim' 
  | 'eixo_comando';

export type Servico = {
  tipo: TipoServico;
  descricao: string;
  concluido: boolean;
};

export type StatusOS = 
  | 'orcamento' 
  | 'aguardando_aprovacao' 
  | 'fabricacao' 
  | 'espera_cliente' 
  | 'finalizado' 
  | 'entregue';

export type EtapaOS = 
  | 'lavagem' 
  | 'inspecao_inicial' 
  | 'retifica' 
  | 'montagem_final' 
  | 'teste' 
  | 'inspecao_final';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export type OrdemServico = {
  id: string;
  nome: string;
  cliente: Cliente;
  dataAbertura: Date;
  dataPrevistaEntrega: Date;
  prioridade: Prioridade;
  servicos: Servico[];
  status: StatusOS;
  etapasAndamento: {
    [key in EtapaOS]?: {
      concluido: boolean;
      funcionarioId?: string;
      iniciado?: Date;
      finalizado?: Date;
    }
  };
  tempoRegistros: TempoRegistro[];
};
