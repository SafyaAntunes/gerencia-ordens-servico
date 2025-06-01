
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: string | Endereco;
  cnpj_cpf?: string;
  dataCriacao?: Date | string;
  observacoes?: string;
}

export interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}
