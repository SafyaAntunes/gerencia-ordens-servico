
import { useState, useEffect } from "react";
import { Funcionario } from "@/types/funcionarios";
import { getFuncionarios } from "@/services/funcionarioService";

export function useFuncionarioSelect() {
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData && funcionariosData.length > 0) {
          setFuncionariosOptions(funcionariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };
    
    carregarFuncionarios();
  }, []);
  
  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  return {
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange,
    setFuncionarioSelecionadoId,
    setFuncionarioSelecionadoNome
  };
}
