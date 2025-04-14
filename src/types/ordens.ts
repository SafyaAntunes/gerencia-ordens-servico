
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

export type SubAtividade = {
  id: string;
  nome: string;
  selecionada: boolean;
  concluida?: boolean;
};

export type Servico = {
  tipo: TipoServico;
  descricao: string;
  concluido: boolean;
  subatividades?: SubAtividade[];
  custoMaterial?: number;
  custoMaoDeObra?: number;
  precoVenda?: number;
  precoTabela?: number;
};

export type StatusOS = 
  | 'orcamento'
  | 'aguardando_aprovacao'
  | 'fabricacao'  // Alterado de 'retifica' para 'fabricacao'
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
  inicio: number;
  fim?: number;
  motivo?: string;
};

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
    }
  };
  tempoRegistros: TempoRegistro[];
  fotosEntrada?: FotoBase64[] | any[];
  fotosSaida?: FotoBase64[] | any[];
  custoTotal?: number;
  precoTotal?: number;
  precoTabelaTotal?: number;
  formaPagamento?: 'dinheiro' | 'cartao' | 'pix' | 'boleto' | 'transferencia';
  observacoesCusto?: string;
};

// Nova tabela de preços temporários
export type TabelaPrecos = {
  [key in TipoServico]?: {
    precoBase: number;
    subatividades?: Record<string, number>;
  }
};

// Tabela temporária de preços padrão
export const TABELA_PRECOS_PADRAO: TabelaPrecos = {
  bloco: {
    precoBase: 850,
    subatividades: {
      'RETÍFICA DE CILINDRO': 250,
      'ENCAMISAR': 350,
      'BRUNIR': 120,
      'RETIFICAR MANCAL': 280,
      'LAVAGEM QUÍMICA': 180,
      'RETIFICA DE FAZE': 220,
      'SERVIÇO DE SOLDA': 300,
      'MEDIR MANCAL': 80,
      'EXTRAIR PRISIONEIRO': 150,
      'RETÍFICA DE ROSCA': 180
    }
  },
  cabecote: {
    precoBase: 680,
    subatividades: {
      'DESCARBONIZAR': 120,
      'SERVIÇO DE SOLDA': 300,
      'RETÍFICA FACE': 220,
      'MUDAR GUIA': 180,
      'MUDAR SEDE': 220,
      'RETÍFICA DE SEDE': 180,
      'RETÍFICA DE VÁLVULAS': 150,
      'ESMERILHAR': 120,
      'CALIBRAR VÁLVULAS': 100,
      'DESMONTAR': 80,
      'MONTAR VÁLVULAR': 120,
      'FACE LATERAL': 180,
      'EXTRAIR PRISIONEIRO': 150,
      'RECUPERAR ROSCA': 180,
      'RETÍFICA MANCAL DE COMANDO': 250,
      'TESTE DE TRINCA': 150,
      'TESTADO': 80,
      'TESTAR MOLAS': 100
    }
  },
  virabrequim: {
    precoBase: 750,
    subatividades: {
      'RETÍFICA BB-BC': 320,
      'POLIR': 180,
      'DESEMPENAR': 250,
      'TESTE DE TRINCA': 150
    }
  },
  eixo_comando: {
    precoBase: 450,
    subatividades: {
      'RETIFICAR': 280,
      'POLIR': 180
    }
  },
  biela: {
    precoBase: 480,
    subatividades: {
      'RETIFICA BUCHA DE BIELA': 180,
      'RETIFICA DE AÇO DE BIELA': 220,
      'MUDAR PISTÃO': 280,
      'MEDIR AÇO DE BIELA': 80
    }
  },
  montagem: {
    precoBase: 950,
    subatividades: {
      'TOTAL': 950,
      'PARCIAL': 650,
      'IN-LOCO': 1200
    }
  },
  dinamometro: {
    precoBase: 380,
    subatividades: {
      'POTÊNCIA': 180,
      'TORQUE': 180,
      'CONSUMO': 150
    }
  },
  lavagem: {
    precoBase: 250,
    subatividades: {
      'PREPARAÇÃO': 50,
      'LAVAGEM QUÍMICA': 150,
      'SECAGEM': 30,
      'INSPEÇÃO': 80
    }
  }
};
