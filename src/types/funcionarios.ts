
import { TipoServico } from './ordens';

export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao';

export type Funcionario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especialidades: TipoServico[];
  ativo: boolean;
  nivelPermissao?: NivelPermissao;
  senha?: string; // Armazenada apenas temporariamente para criação de usuário
};

export const permissoesLabels: Record<NivelPermissao, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  tecnico: 'Técnico',
  visualizacao: 'Visualização'
};

