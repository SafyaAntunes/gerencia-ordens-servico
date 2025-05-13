
export interface ServicoStatus {
  isLoading: boolean;
  isUpdating: boolean;
  isError: boolean;
  error: Error | null;
}

// Define the status types for serviços
export type ServicoStatusType = 'concluido' | 'em_andamento' | 'pausado' | 'nao_iniciado';
