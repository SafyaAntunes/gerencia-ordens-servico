
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

  // Add debugging for tracking props
  React.useEffect(() => {
    console.log("MultiSelect props:", {
      options: options,
      selected: selected,
      hasOptions: Array.isArray(options),
      hasSelected: Array.isArray(selected),
      optionsLength: options?.length,
      selectedLength: selected?.length
    });
  }, [options, selected]);

  // Ensure selected is always an array with additional safety
  const safeSelected = React.useMemo(() => {
    if (!selected) {
      console.warn("MultiSelect: selected prop is undefined/null, using empty array");
      return [];
    }
    if (!Array.isArray(selected)) {
      console.warn("MultiSelect: selected prop is not an array, converting:", selected);
      return [];
    }
    // Filter out any invalid values
    return selected.filter(item => item != null && typeof item === 'string');
  }, [selected]);

  // Ensure options is always an array and filter out invalid entries
  const safeOptions = React.useMemo(() => {
    if (!options) {
      console.warn("MultiSelect: options prop is undefined/null, using empty array");
      return [];
    }
    if (!Array.isArray(options)) {
      console.warn("MultiSelect: options prop is not an array, using empty array:", options);
      return [];
    }
    return options.filter(option => 
      option && 
      typeof option === 'object' && 
      typeof option.value === 'string' && 
      typeof option.label === 'string'
    );
  }, [options]);

  // Robust onChange wrapper
  const handleOnChange = React.useCallback((newSelected: string[]) => {
    if (!onChange || typeof onChange !== 'function') {
      console.error("MultiSelect: onChange prop is not a function");
      return;
    }
    
    // Ensure we always pass a valid array
    const validSelected = Array.isArray(newSelected) ? newSelected : [];
    console.log("MultiSelect onChange called with:", validSelected);
    
    try {
      onChange(validSelected);
    } catch (error) {
      console.error("MultiSelect: Error in onChange callback:", error);
    }
  }, [onChange]);

  const handleUnselect = React.useCallback((value: string) => {
    if (!value || typeof value !== 'string') {
      console.warn("MultiSelect: handleUnselect called with invalid value:", value);
      return;
    }
    const newSelected = safeSelected.filter((item) => item !== value);
    handleOnChange(newSelected);
  }, [safeSelected, handleOnChange]);

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
    if (!optionValue || typeof optionValue !== 'string') {
      console.warn("MultiSelect: handleSelect called with invalid value:", optionValue);
      return;
    }
    
    const newSelected = safeSelected.includes(optionValue)
      ? safeSelected.filter((item) => item !== optionValue)
      : [...safeSelected, optionValue];
    handleOnChange(newSelected);
  }, [safeSelected, handleOnChange]);

  // Error boundary wrapper for the Command component
  const renderCommandContent = React.useCallback(() => {
    try {
      return (
        <>
          <CommandInput placeholder="Procurar item..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.length > 0 ? safeOptions.map((option) => (
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
            )) : (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhuma opção disponível
              </div>
            )}
          </CommandGroup>
        </>
      );
    } catch (error) {
      console.error("MultiSelect: Error rendering command content:", error);
      return (
        <div className="p-4 text-center text-red-500">
          Erro ao carregar opções
        </div>
      );
    }
  }, [safeOptions, safeSelected, handleSelect, emptyMessage]);

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
          {renderCommandContent()}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
