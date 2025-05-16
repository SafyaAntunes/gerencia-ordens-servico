import { useEffect, useState } from "react";
import { useOrdemFetch } from "@/hooks/ordem-detalhes/useOrdemFetch";

interface UseOrdemDetalhesProps {
  id: string;
}

export const useOrdemDetalhes = ({ id }: UseOrdemDetalhesProps) => {
  const { ordem, isLoading, error } = useOrdemFetch({ id });
  const [motorDetails, setMotorDetails] = useState(null);
  
  const fetchMotorDetails = async (clienteId: string, motorId: string) => {
    // Implement this function if needed
  };
  
  return { 
    ordem, 
    isLoading, 
    error,
    motorDetails,
    setOrdem: () => {}, // Add mock function to satisfy type requirements
    fetchMotorDetails
  };
};
