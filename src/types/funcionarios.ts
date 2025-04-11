
import { TipoServico } from './ordens';

export type TipoFuncionario = 'admin' | 'gerente' | 'tecnico' | 'visualizador';

export interface Funcionario {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  dataNascimento?: Date;
  endereco?: string;
  dataContratacao?: Date;
  dataDemissao?: Date;
  cargo?: string;
  setor?: string;
  tipo: TipoFuncionario;
  ativo?: boolean;
  observacoes?: string;
  isAdmin?: boolean;
  nomeUsuario?: string;
  senha?: string;
  fotoPerfil?: string;
  especializacoes?: TipoServico[]; // Especialização para técnicos
}

export interface Credentials {
  nomeUsuario: string;
  senha: string;
}

export interface LoginResponse {
  funcionario: Funcionario;
  token: string;
}
