
import { TipoServico } from './ordens';

export type Funcionario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especialidades: TipoServico[];
  ativo: boolean;
};
