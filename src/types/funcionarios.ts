
// Add missing types and exports to the funcionarios.ts file
import { FuncionarioStatus, AtividadeAtual } from "@/utils/funcionarioTypes";

export interface Funcionario {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  nivelPermissao: NivelPermissao;
  especialidades?: string[];
  ativo?: boolean;
  codigoAcesso?: string;
  senhaTecnico?: string;
  cores?: {
    primaria: string;
    secundaria: string;
  };
  avatar?: string;
  equipe?: string;
  dataContratacao?: Date;
  ultimoAcesso?: Date;
  observacoes?: string;
  limitacao?: string;
  dataCriacao?: Date;
  status?: string;
  atividadeAtual?: AtividadeAtual;
  // Add missing properties
  nomeUsuario?: string;
  senha?: string;
  foto?: string;
}

export type NivelPermissao = 'admin' | 'gerente' | 'tecnico' | 'visualizacao' | 'visualizador';

// Add the missing labels
export const permissoesLabels: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  tecnico: 'Técnico',
  visualizacao: 'Visualizador',
  visualizador: 'Visualizador'
};

export const tipoServicoLabels: Record<string, string> = {
  bloco: 'Bloco',
  biela: 'Biela',
  cabecote: 'Cabeçote',
  virabrequim: 'Virabrequim',
  eixo_comando: 'Eixo Comando',
  montagem: 'Montagem',
  dinamometro: 'Dinamômetro',
  lavagem: 'Lavagem',
  inspecao_inicial: 'Inspeção Inicial',
  inspecao_final: 'Inspeção Final'
};
