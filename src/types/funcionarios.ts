
import { TipoServico } from './ordens';

export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao';

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especialidades: TipoServico[];
  ativo: boolean;
  nivelPermissao: NivelPermissao;
  dataCriacao?: Date | string;
  senha?: string; // Temporary field for creation only
  nomeUsuario?: string; // Temporary field for creation only
}

export const permissoesLabels: Record<NivelPermissao, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  tecnico: 'Técnico',
  visualizacao: 'Visualização'
};

export const tipoServicoLabels: Record<TipoServico, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};
