import { FirebaseService } from './base';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';
import { where, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export class FuncionarioService extends FirebaseService {
  constructor() {
    super('funcionarios');
  }

  async getFuncionarioById(id: string): Promise<Funcionario | null> {
    const data = await this.getById(id);
    if (!data) return null;
    return this.formatFuncionarioData(data);
  }

  async getAllFuncionarios(): Promise<Funcionario[]> {
    const data = await this.getAll();
    return data.map(this.formatFuncionarioData);
  }

  async getFuncionariosByNivelPermissao(nivelPermissao: NivelPermissao): Promise<Funcionario[]> {
    const data = await this.getWhere([where('nivelPermissao', '==', nivelPermissao)]);
    return data.map(this.formatFuncionarioData);
  }

  async getFuncionariosAtivos(): Promise<Funcionario[]> {
    const data = await this.getWhere([where('ativo', '==', true)]);
    return data.map(this.formatFuncionarioData);
  }

  async createFuncionario(funcionario: Omit<Funcionario, 'id'>): Promise<string | null> {
    const funcionarioData = this.prepareFuncionarioData(funcionario);
    return this.create(funcionarioData);
  }

  async updateFuncionario(id: string, funcionario: Partial<Funcionario>): Promise<boolean> {
    const funcionarioData = this.prepareFuncionarioData(funcionario);
    return this.update(id, funcionarioData);
  }

  async updateFuncionarioStatus(id: string, ativo: boolean): Promise<boolean> {
    try {
      await this.update(id, { ativo });
      return true;
    } catch (error) {
      console.error('Error updating funcionario status:', error);
      toast.error('Erro ao atualizar status do funcionário');
      return false;
    }
  }

  async updateFuncionarioPermissao(id: string, nivelPermissao: NivelPermissao): Promise<boolean> {
    try {
      await this.update(id, { nivelPermissao });
      return true;
    } catch (error) {
      console.error('Error updating funcionario permissao:', error);
      toast.error('Erro ao atualizar permissão do funcionário');
      return false;
    }
  }

  private formatFuncionarioData(data: any): Funcionario {
    return {
      ...data,
      dataCriacao: data.dataCriacao?.toDate?.() || new Date(data.dataCriacao),
      dataAtualizacao: data.dataAtualizacao?.toDate?.() || (data.dataAtualizacao ? new Date(data.dataAtualizacao) : null)
    };
  }

  private prepareFuncionarioData(funcionario: Partial<Funcionario>): any {
    const data: any = { ...funcionario };
    
    if (data.dataCriacao instanceof Date) {
      data.dataCriacao = Timestamp.fromDate(data.dataCriacao);
    }
    
    if (data.dataAtualizacao instanceof Date) {
      data.dataAtualizacao = Timestamp.fromDate(data.dataAtualizacao);
    }

    return data;
  }
} 