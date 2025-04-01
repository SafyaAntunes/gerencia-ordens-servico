
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
  // Additional properties needed by components
  especialidades: string[];
  nivelPermissao: NivelPermissao;
  dataCriacao?: Date;
}

// Define NivelPermissao type
export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao';

// Add the labels for permissions
export const permissoesLabels: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  tecnico: 'Técnico',
  visualizacao: 'Visualização',
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
  montagem: 'Montagem'
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
