
export interface Motor {
  id: string;
  marca: string;
  modelo: string;
  descricao?: string;
  familia?: string;
  potencia?: string;
  cilindros?: string;
  disp_cilindros?: string;
  valvulas?: string;
  combustivel: 'gasolina' | 'diesel' | 'flex' | 'etanol' | 'gnv';
  peso?: string;
  cilindrada?: string;
  aplicacao?: string;
  ativo: boolean;
}
