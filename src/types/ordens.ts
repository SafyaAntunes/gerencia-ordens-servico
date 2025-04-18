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
  | 'lavagem';

export type TipoAtividade =
  | 'lavagem'
  | 'inspecao_inicial'
  | 'inspecao_final';

export type SubAtividade = {
  id: string;
  nome: string;
  selecionada: boolean;
  concluida?: boolean;
  precoHora?: number;
  tempoEstimado?: number;
  servicoTipo?: TipoServico;
};

export type Servico = {
  tipo: TipoServico;
  descricao: string;
  concluido: boolean;
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
  | 'orcamento'
  | 'aguardando_aprovacao'
  | 'fabricacao'
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
  pausas: { inicio: Date; fim?: Date }[];
};

export type FotoBase64 = {
  nome: string;
  tipo: string;
  tamanho: number;
  data: string;
};

export type PausaRegistro = {
  inicio: Date;
  fim?: Date;
  motivo?: string;
};

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
  etapasAndamento: {
    [key in EtapaOS]?: {
      concluido?: boolean;
      funcionarioId?: string;
      funcionarioNome?: string;
      iniciado?: Date;
      finalizado?: Date;
      usarCronometro?: boolean;
      pausas?: PausaRegistro[];
      precoHora?: number;
      tempoEstimado?: number;
      servicoTipo?: TipoServico;
    }
  };
  tempoRegistros: TempoRegistro[];
  fotosEntrada?: FotoBase64[] | any[];
  fotosSaida?: FotoBase64[] | any[];
  valorTotal?: number;
  custoMaterial?: number;
  custoEstimadoMaoDeObra?: number;
  custoRealMaoDeObra?: number;
  lucroBruto?: number;
  margemLucro?: number;
};
