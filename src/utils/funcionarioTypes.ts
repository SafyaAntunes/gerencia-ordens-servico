
// Create a new types file for funcionario status
import { OrdemServico } from "@/types/ordens";

export interface AtividadeAtual {
  ordemId: string;
  ordemNome?: string;
  etapa: string;
  servicoTipo?: string;
  inicio: Date;
}

export type FuncionarioStatus = {
  id: string;
  nome: string;
  status: "disponivel" | "ocupado" | "inativo";
  atividadeAtual?: AtividadeAtual;
  ordem?: OrdemServico;
};
