
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
}

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
