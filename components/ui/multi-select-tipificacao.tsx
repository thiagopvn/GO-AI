"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ITENS_TIPIFICACAO_ENRIQUECIDOS,
  buscarItensInteligente,
  ItemTipificacaoEnriquecido
} from "@/lib/constants/tipificacao-enriquecida"

interface MultiSelectTipificacaoProps {
  values: number[]
  onChange: (values: number[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelectTipificacao({
  values,
  onChange,
  placeholder = "Selecione os itens da tipificacao...",
  className,
  disabled = false
}: MultiSelectTipificacaoProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [filteredItems, setFilteredItems] = React.useState<ItemTipificacaoEnriquecido[]>(ITENS_TIPIFICACAO_ENRIQUECIDOS)

  // Busca inteligente quando o texto muda
  React.useEffect(() => {
    if (searchValue.trim()) {
      const resultados = buscarItensInteligente(searchValue)
      setFilteredItems(resultados)
    } else {
      setFilteredItems(ITENS_TIPIFICACAO_ENRIQUECIDOS)
    }
  }, [searchValue])

  const selectedItems = ITENS_TIPIFICACAO_ENRIQUECIDOS.filter(item => values.includes(item.id))

  const toggleItem = (itemId: number) => {
    if (values.includes(itemId)) {
      onChange(values.filter(id => id !== itemId))
    } else {
      onChange([...values, itemId])
    }
  }

  const removeItem = (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(values.filter(id => id !== itemId))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-[42px] h-auto",
              selectedItems.length === 0 && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1">
              {selectedItems.length === 0 ? (
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {placeholder}
                </span>
              ) : (
                <>
                  {selectedItems.slice(0, 3).map(item => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="mr-1 mb-1 text-xs"
                    >
                      Item {item.id}
                      <button
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => removeItem(item.id, e)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                  {selectedItems.length > 3 && (
                    <Badge variant="outline" className="mb-1 text-xs">
                      +{selectedItems.length - 3} mais
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {selectedItems.length > 0 && (
                <button
                  className="p-1 rounded hover:bg-muted"
                  onClick={clearAll}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite para buscar... (ex: briga, mentir, falta, embriaguez)"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p>Nenhuma transgressao encontrada.</p>
                  <p className="text-muted-foreground mt-1">
                    Tente termos como: briga, mentir, falta, atraso, alcool
                  </p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {filteredItems.map((item) => {
                    const isSelected = values.includes(item.id)
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id.toString()}
                        onSelect={() => toggleItem(item.id)}
                        className={cn(
                          "flex items-start gap-2 py-2 cursor-pointer",
                          isSelected && "bg-accent"
                        )}
                      >
                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5",
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-primary mr-2">
                            Item {item.id}
                          </span>
                          <span className="text-sm">
                            {item.text}
                          </span>
                          {searchValue && item.keywords.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.keywords.slice(0, 4).map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Lista de itens selecionados com texto completo */}
      {selectedItems.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-sm font-semibold text-gray-700">
            Itens selecionados ({selectedItems.length}):
          </p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {selectedItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md"
              >
                <Badge variant="default" className="shrink-0 mt-0.5">
                  {item.id}
                </Badge>
                <p className="text-sm text-blue-900 flex-1">
                  {item.text}
                </p>
                <button
                  onClick={(e) => removeItem(item.id, e)}
                  className="shrink-0 p-1 rounded hover:bg-blue-100"
                >
                  <X className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
