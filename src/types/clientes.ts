
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  dataCadastro?: Date;
}
