export interface TempoRegistro {
  id: string;
  timestamp: Date;
  duracao: number; // Add this property
  usuario: string;
  acao: string;
  observacao?: string;
}
