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
  selectedMotorId?: string; // ID do motor selecionado
}

export interface Motor {
  id: string;
  modelo: string;
  marca: string;
  ano?: string;
  numeroSerie?: string;
  cilindrada?: string; // Changed from cilindradas
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
