
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: string | Endereco;
  cnpj_cpf?: string;
  motores?: Motor[];
  dataCriacao?: Date | string;
  observacoes?: string;
}

export interface Motor {
  id: string;
  modelo: string;
  marca: string;
  ano?: string;
  numeracao?: string;
  cilindrada?: string;
  combustivel?: 'gasolina' | 'diesel' | 'flex' | 'etanol' | 'gnv';
  observacoes?: string;
  fotos?: string[];
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
