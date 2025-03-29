
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Camera, Upload } from "lucide-react";
import { useImages } from "@/hooks/useFirebase";
import { toast } from "sonner";

interface FotosFormProps {
  fotosEntrada: any[]; // Pode ser File ou string URL
  fotosSaida: any[]; // Pode ser File ou string URL
  onChangeFotosEntrada: (fotos: any[]) => void;
  onChangeFotosSaida: (fotos: any[]) => void;
  ordemId?: string; // ID da ordem para organizar os uploads
}

export default function FotosForm({
  fotosEntrada = [],
  fotosSaida = [],
  onChangeFotosEntrada,
  onChangeFotosSaida,
  ordemId = "temp",
}: FotosFormProps) {
  const [activeTab, setActiveTab] = useState("entrada");
  const { uploadFile, deleteFile } = useImages();

  const handleAddFotoEntrada = async (file: File | null) => {
    if (file) {
      try {
        // Se estamos em uma ordem existente, podemos fazer upload imediatamente
        if (ordemId !== "temp") {
          const url = await uploadFile(file, `ordens/${ordemId}/entrada`);
          if (url) {
            onChangeFotosEntrada([...fotosEntrada, url]);
            toast.success("Arquivo carregado com sucesso!");
          }
        } else {
          // Caso contrário, mantemos o arquivo para upload posterior
          onChangeFotosEntrada([...fotosEntrada, file]);
        }
      } catch (error) {
        toast.error("Erro ao processar arquivo");
      }
    }
  };

  const handleRemoveFotoEntrada = async (index: number) => {
    const foto = fotosEntrada[index];
    const newFotos = [...fotosEntrada];
    newFotos.splice(index, 1);
    onChangeFotosEntrada(newFotos);

    // Se for uma URL, tentar excluir do storage
    if (typeof foto === 'string' && foto.startsWith('http')) {
      try {
        await deleteFile(foto);
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
      }
    }
  };

  const handleAddFotoSaida = async (file: File | null) => {
    if (file) {
      try {
        // Se estamos em uma ordem existente, podemos fazer upload imediatamente
        if (ordemId !== "temp") {
          const url = await uploadFile(file, `ordens/${ordemId}/saida`);
          if (url) {
            onChangeFotosSaida([...fotosSaida, url]);
            toast.success("Arquivo carregado com sucesso!");
          }
        } else {
          // Caso contrário, mantemos o arquivo para upload posterior
          onChangeFotosSaida([...fotosSaida, file]);
        }
      } catch (error) {
        toast.error("Erro ao processar arquivo");
      }
    }
  };

  const handleRemoveFotoSaida = async (index: number) => {
    const foto = fotosSaida[index];
    const newFotos = [...fotosSaida];
    newFotos.splice(index, 1);
    onChangeFotosSaida(newFotos);

    // Se for uma URL, tentar excluir do storage
    if (typeof foto === 'string' && foto.startsWith('http')) {
      try {
        await deleteFile(foto);
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
      }
    }
  };

  return (
    <div>
      <Tabs 
        defaultValue="entrada" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="entrada" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Arquivos de Entrada
          </TabsTrigger>
          <TabsTrigger value="saida" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Arquivos de Saída
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="entrada" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosEntrada.map((foto, index) => (
              <FileUpload
                key={index}
                value={foto}
                onRemove={() => handleRemoveFotoEntrada(index)}
                accept="image/*,video/*"
              />
            ))}
            <FileUpload onChange={handleAddFotoEntrada} accept="image/*,video/*" />
          </div>
        </TabsContent>
        
        <TabsContent value="saida" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosSaida.map((foto, index) => (
              <FileUpload
                key={index}
                value={foto}
                onRemove={() => handleRemoveFotoSaida(index)}
                accept="image/*,video/*"
              />
            ))}
            <FileUpload onChange={handleAddFotoSaida} accept="image/*,video/*" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
