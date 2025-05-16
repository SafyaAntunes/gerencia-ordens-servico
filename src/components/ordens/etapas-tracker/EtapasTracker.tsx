import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { addDays, isWeekend } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useFormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { ProgressCircle } from "./ProgressCircle";
import { getStatusPercent } from "./useEtapasProgress";

interface EtapasTrackerProps {
  status: string;
  progressoEtapas?: number;
  etapasAndamento: {
    lavagem?: { concluido: boolean };
    inspecao_inicial?: { concluido: boolean };
    retifica?: { concluido: boolean };
    montagem?: { concluido: boolean };
    dinamometro?: { concluido: boolean };
    inspecao_final?: { concluido: boolean };
  };
  onStatusChange: (status: string) => void;
  onEtapaChange: (etapa: string, concluido: boolean) => void;
}

export const EtapasTracker: React.FC<EtapasTrackerProps> = ({
  status,
  progressoEtapas,
  etapasAndamento,
  onStatusChange,
  onEtapaChange,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  const handleStatusClick = (newStatus: string) => {
    onStatusChange(newStatus);
    toast({
      title: "Status atualizado!",
      description: `Status da ordem de serviço alterado para ${getStatusLabel(newStatus)}.`,
    });
  };

  const handleEtapaChange = (etapa: string, concluido: boolean) => {
    onEtapaChange(etapa, concluido);
  };

  const etapas = [
    { nome: "Lavagem", status: etapasAndamento?.lavagem?.concluido, value: "lavagem" },
    { nome: "Inspeção Inicial", status: etapasAndamento?.inspecao_inicial?.concluido, value: "inspecao_inicial" },
    { nome: "Retífica", status: etapasAndamento?.retifica?.concluido, value: "retifica" },
    { nome: "Montagem", status: etapasAndamento?.montagem?.concluido, value: "montagem" },
    { nome: "Dinamômetro", status: etapasAndamento?.dinamometro?.concluido, value: "dinamometro" },
    { nome: "Inspeção Final", status: etapasAndamento?.inspecao_final?.concluido, value: "inspecao_final" },
  ];

  const statusOptions = [
    { label: "Orçamento", value: "orcamento" },
    { label: "Aguardando Aprovação", value: "aguardando_aprovacao" },
    { label: "Autorizado", value: "autorizado" },
    { label: "Executando Serviço", value: "executando_servico" },
    { label: "Aguardando Peça (Cliente)", value: "aguardando_peca_cliente" },
    { label: "Aguardando Peça (Interno)", value: "aguardando_peca_interno" },
    { label: "Finalizado", value: "finalizado" },
    { label: "Entregue", value: "entregue" },
  ];

  const getStatusLabel = (status: string): string => {
    if (status === "orcamento") return "Orçamento";
    if (status === "aguardando_aprovacao") return "Aguardando Aprovação";
    if (status === "autorizado") return "Autorizado";
    if (status === "executando_servico") return "Executando Serviço";
    if (status === "aguardando_peca_cliente") return "Aguardando Peça (Cliente)";
    if (status === "aguardando_peca_interno") return "Aguardando Peça (Interno)";
    if (status === "finalizado") return "Finalizado";
    if (status === "entregue") return "Entregue";
    return status;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Acompanhamento da Ordem de Serviço</CardTitle>
        <CardDescription>
          Visualize e gerencie o progresso da ordem de serviço.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Progresso Geral</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe o status geral da ordem.
            </p>
          </div>
          <ProgressCircle value={getStatusPercent(status)} />
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Status</h3>
          <p className="text-sm text-muted-foreground">
            Altere o status da ordem de serviço.
          </p>
          <div className="mt-2 flex gap-2">
            {statusOptions.map((option) => (
              <Badge
                key={option.value}
                variant={status === option.value ? "secondary" : "outline"}
                onClick={() => handleStatusClick(option.value)}
                className="cursor-pointer"
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Etapas</h3>
          <p className="text-sm text-muted-foreground">
            Marque as etapas concluídas da ordem de serviço.
          </p>
          <div className="mt-2 grid gap-2">
            {etapas.map((etapa) => (
              <div key={etapa.nome} className="flex items-center justify-between">
                <Label htmlFor={etapa.nome} className="cursor-pointer">
                  {etapa.nome}
                </Label>
                <Checkbox
                  id={etapa.nome}
                  checked={etapa.status === true}
                  onCheckedChange={(checked) => handleEtapaChange(etapa.value, checked || false)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setIsDrawerOpen(true)}>
          Mostrar Detalhes Avançados
        </Button>
      </CardFooter>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalhes Avançados</DrawerTitle>
            <DrawerDescription>
              Informações detalhadas sobre a ordem de serviço.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Fechar</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
};

export default EtapasTracker;
