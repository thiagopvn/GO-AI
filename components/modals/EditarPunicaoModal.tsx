'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EditarPunicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (diasPunicao: number, dataInicioPunicao: Date) => Promise<void>;
  diasPunicaoAtual?: number;
  dataInicioPunicaoAtual?: Date;
  isLoading?: boolean;
}

export function EditarPunicaoModal({
  isOpen,
  onClose,
  onSubmit,
  diasPunicaoAtual = 0,
  dataInicioPunicaoAtual = new Date(),
  isLoading = false,
}: EditarPunicaoModalProps) {
  const [diasPunicao, setDiasPunicao] = useState(diasPunicaoAtual);
  const [dataInicioPunicao, setDataInicioPunicao] = useState<Date | undefined>(dataInicioPunicaoAtual);

  const handleSubmit = async () => {
    if (!dataInicioPunicao) {
      alert('Por favor, selecione a data de início da punição.');
      return;
    }

    await onSubmit(diasPunicao, dataInicioPunicao);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Punição</DialogTitle>
          <DialogDescription>
            Ajuste os dias de punição e a data de início conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dias-punicao-edit">
              Dias de Punição
            </Label>
            <Input
              id="dias-punicao-edit"
              type="number"
              min="0"
              value={diasPunicao}
              onChange={(e) => setDiasPunicao(parseInt(e.target.value) || 0)}
              className="font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Início da Punição</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicioPunicao && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataInicioPunicao
                    ? format(dataInicioPunicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dataInicioPunicao}
                  onSelect={setDataInicioPunicao}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}