
export interface ServicoStatus {
  isLoading: boolean;
  isUpdating: boolean;
  isError: boolean;
  error: Error | null;
}
