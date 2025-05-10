import { FirebaseService } from './base';
import { OrdemServico, EtapaOS, TipoServico } from '@/types/ordens';
import { Timestamp, where } from 'firebase/firestore';
import { toast } from 'sonner';

export class OrdemService extends FirebaseService {
  constructor() {
    super('ordens_servico');
  }

  async getOrdemById(id: string): Promise<OrdemServico | null> {
    const data = await this.getById(id);
    if (!data) return null;
    return this.formatOrdemData(data);
  }

  async getAllOrdens(): Promise<OrdemServico[]> {
    const data = await this.getAll();
    return data.map(this.formatOrdemData);
  }

  async getOrdensByStatus(status: string): Promise<OrdemServico[]> {
    const data = await this.getWhere([where('status', '==', status)]);
    return data.map(this.formatOrdemData);
  }

  async createOrdem(ordem: Omit<OrdemServico, 'id'>): Promise<string | null> {
    const ordemData = this.prepareOrdemData(ordem);
    return this.create(ordemData);
  }

  async updateOrdem(id: string, ordem: Partial<OrdemServico>): Promise<boolean> {
    const ordemData = this.prepareOrdemData(ordem);
    return this.update(id, ordemData);
  }

  async updateEtapaStatus(
    ordemId: string, 
    etapa: EtapaOS, 
    status: { concluido: boolean; tempoEstimado?: number }
  ): Promise<boolean> {
    try {
      const ordemRef = this.getDocRef(ordemId);
      const ordemDoc = await this.getById(ordemId);
      
      if (!ordemDoc) {
        toast.error('Ordem não encontrada');
        return false;
      }

      const etapasAndamento = ordemDoc.etapasAndamento || {};
      etapasAndamento[etapa] = {
        ...etapasAndamento[etapa],
        ...status,
        updatedAt: new Date().toISOString()
      };

      await this.update(ordemId, { etapasAndamento });
      return true;
    } catch (error) {
      console.error('Error updating etapa status:', error);
      toast.error('Erro ao atualizar status da etapa');
      return false;
    }
  }

  async updateServicoStatus(
    ordemId: string,
    servicoTipo: TipoServico,
    status: { concluido: boolean; subatividades?: any[] }
  ): Promise<boolean> {
    try {
      const ordemRef = this.getDocRef(ordemId);
      const ordemDoc = await this.getById(ordemId);
      
      if (!ordemDoc) {
        toast.error('Ordem não encontrada');
        return false;
      }

      const servicos = ordemDoc.servicos || [];
      const servicoIndex = servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        toast.error('Serviço não encontrado na ordem');
        return false;
      }

      servicos[servicoIndex] = {
        ...servicos[servicoIndex],
        ...status,
        updatedAt: new Date().toISOString()
      };

      await this.update(ordemId, { servicos });
      return true;
    } catch (error) {
      console.error('Error updating servico status:', error);
      toast.error('Erro ao atualizar status do serviço');
      return false;
    }
  }

  private formatOrdemData(data: any): OrdemServico {
    return {
      ...data,
      dataAbertura: data.dataAbertura?.toDate?.() || new Date(data.dataAbertura),
      dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate?.() || new Date(data.dataPrevistaEntrega),
      dataConclusao: data.dataConclusao?.toDate?.() || (data.dataConclusao ? new Date(data.dataConclusao) : null)
    };
  }

  private prepareOrdemData(ordem: Partial<OrdemServico>): any {
    const data: any = { ...ordem };
    
    if (data.dataAbertura instanceof Date) {
      data.dataAbertura = Timestamp.fromDate(data.dataAbertura);
    }
    
    if (data.dataPrevistaEntrega instanceof Date) {
      data.dataPrevistaEntrega = Timestamp.fromDate(data.dataPrevistaEntrega);
    }
    
    if (data.dataConclusao instanceof Date) {
      data.dataConclusao = Timestamp.fromDate(data.dataConclusao);
    }

    return data;
  }
} 