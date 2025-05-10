export { FirebaseService } from './base';
export { OrdemService } from './ordemService';
export { FuncionarioService } from './funcionarioService';
export { ClienteService } from './clienteService';

// Create singleton instances
import { OrdemService } from './ordemService';
import { FuncionarioService } from './funcionarioService';
import { ClienteService } from './clienteService';

export const ordemService = new OrdemService();
export const funcionarioService = new FuncionarioService();
export const clienteService = new ClienteService(); 