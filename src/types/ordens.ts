
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
  precoHora?: number; // Preço por hora da subatividade
  tempoEstimado?: number; // Tempo estimado em horas
};

export type ServicoInspecao = {
  inicial: boolean; // Indica se a inspeção inicial foi realizada
  final: boolean;   // Indica se a inspeção final foi realizada
  observacoes?: string; // Observações da inspeção
  responsavelId?: string; // ID do funcionário responsável pela inspeção
  responsavelNome?: string; // Nome do funcionário responsável pela inspeção
  dataInspecaoInicial?: Date; // Data da inspeção inicial
  dataInspecaoFinal?: Date; // Data da inspeção final
};

export type Servico = {
  tipo: TipoServico;
  descricao: string;
  concluido: boolean;
  subatividades?: SubAtividade[];
  funcionarioId?: string; // ID do funcionário que concluiu o serviço
  funcionarioNome?: string; // Nome do funcionário que concluiu o serviço
  dataConclusao?: Date; // Data de conclusão do serviço
  inspecao: ServicoInspecao; // Inspeções específicas para o serviço
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
  valorTotal?: number; // Valor total do orçamento
  custoMaterial?: number; // Custo com materiais
  custoEstimadoMaoDeObra?: number; // Custo estimado da mão de obra
  custoRealMaoDeObra?: number; // Custo real da mão de obra
  lucroBruto?: number; // Lucro bruto (valorTotal - custoMaterial - custoRealMaoDeObra)
  margemLucro?: number; // Margem de lucro em porcentagem
};
