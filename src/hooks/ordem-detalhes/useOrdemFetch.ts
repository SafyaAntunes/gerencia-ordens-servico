
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";

export const useOrdemFetch = (id: string | undefined) => {
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função auxiliar para otimizar imagens
  const otimizarImagensBase64 = (imagens: any[] | undefined) => {
    if (!imagens || imagens.length === 0) return imagens;
    
    return imagens.map(img => {
      // Se não tiver dados ou não for base64, retorna a imagem original
      if (!img || !img.data || !img.data.startsWith('data:image')) return img;
      
      try {
        // Reduzir qualidade para 70% - suficiente para visualização web
        const qualidade = 0.7;
        const maxWidth = 800; // Largura máxima para visualização web
        
        // Criar uma imagem temporária para processar
        const imgTemp = new Image();
        imgTemp.src = img.data;
        
        // Se a imagem já é menor que o limite, retorna a original
        if (imgTemp.width <= maxWidth) return img;
        
        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return img;
        
        // Calcular nova altura mantendo proporção
        const ratio = maxWidth / imgTemp.width;
        const newHeight = imgTemp.height * ratio;
        
        canvas.width = maxWidth;
        canvas.height = newHeight;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(imgTemp, 0, 0, maxWidth, newHeight);
        
        // Gerar nova imagem base64 com qualidade reduzida
        const novaImagem = {
          ...img,
          data: canvas.toDataURL(img.tipo || 'image/jpeg', qualidade)
        };
        
        return novaImagem;
      } catch (error) {
        console.error("Erro ao otimizar imagem:", error);
        return img; // Em caso de erro, retorna a imagem original
      }
    });
  };

  useEffect(() => {
    if (!id) return;
    fetchOrdem();
  }, [id]);

  const fetchOrdem = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "ordens_servico", id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Otimizar imagens para carregamento web
        const fotosEntradaOtimizadas = otimizarImagensBase64(data.fotosEntrada);
        const fotosSaidaOtimizadas = otimizarImagensBase64(data.fotosSaida);
        
        const ordemFormatada: OrdemServico = {
          ...data,
          id: docSnap.id,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          fotosEntrada: fotosEntradaOtimizadas,
          fotosSaida: fotosSaidaOtimizadas
        } as OrdemServico;
        
        setOrdem(ordemFormatada);
      } else {
        toast.error("Ordem não encontrada");
        navigate("/ordens");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Erro ao carregar dados da ordem");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMotorDetails = async (clienteId: string, motorId: string) => {
    try {
      if (!clienteId || !motorId) return;
      
      const motorRef = doc(db, `clientes/${clienteId}/motores`, motorId);
      const motorDoc = await getDoc(motorRef);
      
      if (motorDoc.exists()) {
        console.log("Motor details fetched successfully");
      }
    } catch (error) {
      console.error("Error fetching motor details:", error);
    }
  };

  return {
    ordem,
    setOrdem: setOrdem as SetOrdemFunction,
    isLoading,
    fetchMotorDetails
  };
};
