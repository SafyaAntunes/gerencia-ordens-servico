
export interface Funcionario {
  id: string;
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
  dataAdmissao?: Date;
  dataDemissao?: Date | null;
  ativo?: boolean;
  observacoes?: string;
  departamentos?: string[];
  funcoes?: string[];
  permissoes?: Record<string, boolean>;
  salario?: number;
  foto?: string;
  nomeUsuario?: string;
  senha?: string;
  especialidades: string[];
  nivelPermissao: NivelPermissao;
  dataCriacao?: Date;
}

// Define NivelPermissao type com descrições claras
export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao';

// Add the labels for permissions with descriptions
export const permissoesLabels: Record<string, string> = {
  admin: 'Administrador', // Acesso completo ao sistema
  gerente: 'Gerente',     // Acesso aos dados administrativos e operacionais, exceto configurações
  tecnico: 'Técnico',     // Acesso às ordens de serviço atribuídas
  visualizacao: 'Visualização', // Acesso somente leitura ao Dashboard
};

// Import TipoServico from ordens.ts and re-export a label mapping
import { TipoServico } from './ordens';

// Labels for service types
export const tipoServicoLabels: Record<TipoServico, string> = {
  bloco: 'Bloco',
  biela: 'Biela',
  cabecote: 'Cabeçote',
  virabrequim: 'Virabrequim',
  eixo_comando: 'Eixo de Comando',
  montagem: 'Montagem',
  dinamometro: 'Dinamômetro'
};

// Descrição detalhada de permissões por nível
export const permissoesDescricao: Record<NivelPermissao, string> = {
  admin: 'Acesso total ao sistema, configurações e dados financeiros',
  gerente: 'Gestão de ordens, clientes, funcionários e agenda. Acesso a relatórios de produção',
  tecnico: 'Visualização e atualização de ordens de serviço atribuídas',
  visualizacao: 'Visualização do dashboard e listagem de ordens'
};

export interface FuncionarioPermissoes {
  admin?: boolean;
  clientes?: boolean;
  ordens?: boolean;
  relatorios?: boolean;
  financeiro?: boolean;
  estoque?: boolean;
  funcionarios?: boolean;
}

export interface Departamento {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string;
  departamentoId?: string;
}
