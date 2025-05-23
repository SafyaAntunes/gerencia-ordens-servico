
export interface Motor {
  id: string;
  marca: string;
  modelo: string;
  numeroCilindros?: number;
  combustivel?: 'gasolina' | 'diesel' | 'flex' | 'etanol' | 'gnv';
  numeroSerie?: string;
  cilindrada?: string;
  ano?: string;
  observacoes?: string;
  clienteId?: string;
  clienteNome?: string;
}
