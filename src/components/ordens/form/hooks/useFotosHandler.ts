
import { useState, useEffect } from "react";

export const useFotosHandler = (
  defaultFotosEntrada: any[] = [], 
  defaultFotosSaida: any[] = []
) => {
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);

  // Process default fotos
  useEffect(() => {
    const processDefaultFotos = () => {
      if (defaultFotosEntrada?.length > 0) {
        const processedFotos = defaultFotosEntrada.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosEntrada(processedFotos as any);
      }

      if (defaultFotosSaida?.length > 0) {
        const processedFotos = defaultFotosSaida.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosSaida(processedFotos as any);
      }
    };

    processDefaultFotos();
  }, [defaultFotosEntrada, defaultFotosSaida]);

  return {
    fotosEntrada,
    fotosSaida,
    setFotosEntrada,
    setFotosSaida
  };
};
