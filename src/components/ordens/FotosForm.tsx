
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload } from "lucide-react";

interface FotosFormProps {
  fotosEntrada: File[];
  fotosSaida: File[];
  onChangeFotosEntrada: (fotos: File[]) => void;
  onChangeFotosSaida: (fotos: File[]) => void;
}

export default function FotosForm({
  fotosEntrada = [],
  fotosSaida = [],
  onChangeFotosEntrada,
  onChangeFotosSaida,
}: FotosFormProps) {
  const [activeTab, setActiveTab] = useState("entrada");

  const handleAddFotoEntrada = (file: File | null) => {
    if (file) {
      onChangeFotosEntrada([...fotosEntrada, file]);
    }
  };

  const handleRemoveFotoEntrada = (index: number) => {
    const newFotos = [...fotosEntrada];
    newFotos.splice(index, 1);
    onChangeFotosEntrada(newFotos);
  };

  const handleAddFotoSaida = (file: File | null) => {
    if (file) {
      onChangeFotosSaida([...fotosSaida, file]);
    }
  };

  const handleRemoveFotoSaida = (index: number) => {
    const newFotos = [...fotosSaida];
    newFotos.splice(index, 1);
    onChangeFotosSaida(newFotos);
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
            Fotos de Entrada
          </TabsTrigger>
          <TabsTrigger value="saida" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Fotos de Saída
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="entrada" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosEntrada.map((foto, index) => (
              <FileUpload
                key={index}
                value={foto}
                onRemove={() => handleRemoveFotoEntrada(index)}
              />
            ))}
            <FileUpload onChange={handleAddFotoEntrada} />
          </div>
        </TabsContent>
        
        <TabsContent value="saida" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosSaida.map((foto, index) => (
              <FileUpload
                key={index}
                value={foto}
                onRemove={() => handleRemoveFotoSaida(index)}
              />
            ))}
            <FileUpload onChange={handleAddFotoSaida} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
