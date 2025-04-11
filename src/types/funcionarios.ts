
import { TipoServico } from './ordens';

export type TipoFuncionario = 'admin' | 'gerente' | 'tecnico' | 'visualizador';
export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao';

export const permissoesLabels: Record<NivelPermissao, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  tecnico: 'Técnico',
  visualizacao: 'Visualizador'
};

export const tipoServicoLabels: Record<TipoServico, string> = {
  bloco: 'Retífica de Bloco',
  cabecote: 'Retífica de Cabeçote',
  virabrequim: 'Retífica de Virabrequim',
  biela: 'Balanceamento de Bielas',
  eixo_comando: 'Eixo de Comando',
  montagem: 'Montagem de Motor',
  dinamometro: 'Dinamômetro'
};

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
  
  // New properties previously missing in the interface
  nivelPermissao: NivelPermissao;
  especializacoes?: TipoServico[]; // Renamed from 'especialidades'
  dataCriacao?: Date;
  especialidades?: TipoServico[]; // Keep for backwards compatibility during transition
}

export interface Credentials {
  nomeUsuario: string;
  senha: string;
}

export interface LoginResponse {
  funcionario: Funcionario;
  token: string;
}
