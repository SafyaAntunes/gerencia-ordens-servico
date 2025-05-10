import { FirebaseService } from './base';
import { Cliente, Motor } from '@/types/clientes';
import { where, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export class ClienteService extends FirebaseService {
  constructor() {
    super('clientes');
  }

  async getClienteById(id: string): Promise<Cliente | null> {
    const data = await this.getById(id);
    if (!data) return null;
    return this.formatClienteData(data);
  }

  async getAllClientes(): Promise<Cliente[]> {
    const data = await this.getAll();
    return data.map(this.formatClienteData);
  }

  async getClientesByNome(nome: string): Promise<Cliente[]> {
    const data = await this.getWhere([where('nome', '>=', nome), where('nome', '<=', nome + '\uf8ff')]);
    return data.map(this.formatClienteData);
  }

  async createCliente(cliente: Omit<Cliente, 'id'>): Promise<string | null> {
    const clienteData = this.prepareClienteData(cliente);
    return this.create(clienteData);
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<boolean> {
    const clienteData = this.prepareClienteData(cliente);
    return this.update(id, clienteData);
  }

  async addMotorToCliente(clienteId: string, motor: Motor): Promise<boolean> {
    try {
      const cliente = await this.getClienteById(clienteId);
      if (!cliente) {
        toast.error('Cliente não encontrado');
        return false;
      }

      const motores = [...(cliente.motores || []), motor];
      await this.update(clienteId, { motores });
      return true;
    } catch (error) {
      console.error('Error adding motor to cliente:', error);
      toast.error('Erro ao adicionar motor ao cliente');
      return false;
    }
  }

  async updateMotorInCliente(clienteId: string, motorId: string, motorData: Partial<Motor>): Promise<boolean> {
    try {
      const cliente = await this.getClienteById(clienteId);
      if (!cliente) {
        toast.error('Cliente não encontrado');
        return false;
      }

      const motores = cliente.motores?.map(motor => 
        motor.id === motorId ? { ...motor, ...motorData } : motor
      ) || [];

      await this.update(clienteId, { motores });
      return true;
    } catch (error) {
      console.error('Error updating motor in cliente:', error);
      toast.error('Erro ao atualizar motor do cliente');
      return false;
    }
  }

  async removeMotorFromCliente(clienteId: string, motorId: string): Promise<boolean> {
    try {
      const cliente = await this.getClienteById(clienteId);
      if (!cliente) {
        toast.error('Cliente não encontrado');
        return false;
      }

      const motores = cliente.motores?.filter(motor => motor.id !== motorId) || [];
      await this.update(clienteId, { motores });
      return true;
    } catch (error) {
      console.error('Error removing motor from cliente:', error);
      toast.error('Erro ao remover motor do cliente');
      return false;
    }
  }

  private formatClienteData(data: any): Cliente {
    return {
      ...data,
      dataCadastro: data.dataCadastro?.toDate?.() || new Date(data.dataCadastro),
      dataAtualizacao: data.dataAtualizacao?.toDate?.() || (data.dataAtualizacao ? new Date(data.dataAtualizacao) : null)
    };
  }

  private prepareClienteData(cliente: Partial<Cliente>): any {
    const data: any = { ...cliente };
    
    if (data.dataCadastro instanceof Date) {
      data.dataCadastro = Timestamp.fromDate(data.dataCadastro);
    }
    
    if (data.dataAtualizacao instanceof Date) {
      data.dataAtualizacao = Timestamp.fromDate(data.dataAtualizacao);
    }

    return data;
  }
} 