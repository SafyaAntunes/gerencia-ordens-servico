
// Let's update line 492 where we need to change "fabricacao" to "executando_servico"
// The line looks like: if (status === "fabricacao") return "Fabricação";

// This is only part of the file to fix the specific error
export const getStatusLabel = (status: string): string => {
  if (status === "orcamento") return "Orçamento";
  if (status === "aguardando_aprovacao") return "Aguardando Aprovação";
  if (status === "autorizado") return "Autorizado";
  if (status === "executando_servico") return "Executando Serviço"; // Changed from fabricacao
  if (status === "aguardando_peca_cliente") return "Aguardando Peça (Cliente)";
  if (status === "aguardando_peca_interno") return "Aguardando Peça (Interno)";
  if (status === "finalizado") return "Finalizado";
  if (status === "entregue") return "Entregue";
  return status;
};
