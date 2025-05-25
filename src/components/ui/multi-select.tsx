
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecionar itens...",
  disabled = false,
  className,
  emptyMessage = "Nenhum item encontrado.",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Ensure selected is always an array
  const safeSelected = React.useMemo(() => 
    Array.isArray(selected) ? selected : [], 
  [selected]);

  // Ensure options is always an array and filter out invalid entries
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.filter(option => 
      option && 
      typeof option === 'object' && 
      typeof option.value === 'string' && 
      typeof option.label === 'string'
    );
  }, [options]);

  const handleUnselect = React.useCallback((value: string) => {
    if (!value || typeof value !== 'string') return;
    const newSelected = safeSelected.filter((item) => item !== value);
    onChange(newSelected);
  }, [safeSelected, onChange]);

  // Map of selected values to their labels
  const selectedLabelsMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (safeOptions.length > 0) {
      safeOptions.forEach((option) => {
        if (safeSelected.includes(option.value)) {
          map.set(option.value, option.label);
        }
      });
    }
    return map;
  }, [safeSelected, safeOptions]);

  const handleSelect = React.useCallback((optionValue: string) => {
    if (!optionValue || typeof optionValue !== 'string') return;
    
    const newSelected = safeSelected.includes(optionValue)
      ? safeSelected.filter((item) => item !== optionValue)
      : [...safeSelected, optionValue];
    onChange(newSelected);
  }, [safeSelected, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            disabled ? "cursor-not-allowed opacity-50" : "",
            className
          )}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {safeSelected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {safeSelected.length > 0 && (
              <>
                {safeSelected.slice(0, 2).map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    {selectedLabelsMap.get(value) || value}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                    />
                  </Badge>
                ))}
                {safeSelected.length > 2 && (
                  <Badge variant="secondary">
                    + {safeSelected.length - 2} mais
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Procurar item..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.length > 0 && safeOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    safeSelected.includes(option.value)
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
