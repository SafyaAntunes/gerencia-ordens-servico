
// Add atividadeAtual and status to the Funcionario type
import { FuncionarioStatus, AtividadeAtual } from "@/utils/funcionarioTypes";

export interface Funcionario {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  nivelPermissao: 'admin' | 'gerente' | 'tecnico' | 'visualizador';
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
  status?: string; // Status do funcionário (ativo, inativo, etc.)
  atividadeAtual?: AtividadeAtual; // Atividade atual do funcionário
}
