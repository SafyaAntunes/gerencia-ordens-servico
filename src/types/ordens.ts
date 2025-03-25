
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

export type TempoRegistro = {
  inicio: Date;
  fim?: Date;
  funcionarioId: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  pausas: { inicio: Date; fim?: Date }[];
};

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
