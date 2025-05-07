
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";

// Extensão para o jsPDF-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    previousAutoTable?: {
      finalY: number;
    };
  }
}

export type PDFProgressoData = {
  progressoEtapas: Record<string, number>;
  progressoServicos: Record<string, number>;
  progressoTotal: number;
};

export type PDFTempoData = {
  temposPorEtapa: Record<string, number>;
  tempoTotalRegistrado: number;
  tempoEstimado: number;
  diasEmAndamento: number;
};
