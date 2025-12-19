'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, AlertTriangle, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Militar } from '@/types';

export type TipoPunicaoAntiga = 'repreensao' | 'detencao' | 'prisao';

export interface PunicaoAntigaData {
  militarId: string;
  militarNome: string;
  militarPosto: string;
  tipoPunicao: TipoPunicaoAntiga;
  dataPunicao: Date;
  diasPunicao: number;
  dataInicioPunicao?: Date;
  descricao: string;
  observacoes?: string;
}

interface LancarPunicaoAntigaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PunicaoAntigaData) => Promise<void>;
  militares: Militar[];
  militarPreSelecionado?: Militar | null;
  isLoading?: boolean;
}

const TIPOS_PUNICAO = [
  { value: 'repreensao', label: 'Repreensao', diasMinimos: 0 },
  { value: 'detencao', label: 'Detencao', diasMinimos: 1 },
  { value: 'prisao', label: 'Prisao', diasMinimos: 1 },
];

export function LancarPunicaoAntigaModal({
  isOpen,
  onClose,
  onSubmit,
  militares,
  militarPreSelecionado = null,
  isLoading = false,
}: LancarPunicaoAntigaModalProps) {
  const [militarId, setMilitarId] = useState('');
  const [tipoPunicao, setTipoPunicao] = useState<TipoPunicaoAntiga | ''>('');
  const [dataPunicao, setDataPunicao] = useState<Date | undefined>(undefined);
  const [diasPunicao, setDiasPunicao] = useState<number>(0);
  const [dataInicioPunicao, setDataInicioPunicao] = useState<Date | undefined>(undefined);
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Atualizar militarId quando o militar pre-selecionado mudar
  useEffect(() => {
    if (militarPreSelecionado) {
      setMilitarId(militarPreSelecionado.id);
    }
  }, [militarPreSelecionado]);

  // Resetar dias quando muda o tipo de punicao
  useEffect(() => {
    if (tipoPunicao === 'repreensao') {
      setDiasPunicao(0);
      setDataInicioPunicao(undefined);
    }
  }, [tipoPunicao]);

  const handleSubmit = async () => {
    // Validacoes
    if (!militarId) {
      alert('Por favor, selecione o militar.');
      return;
    }

    if (!tipoPunicao) {
      alert('Por favor, selecione o tipo de punicao.');
      return;
    }

    if (!dataPunicao) {
      alert('Por favor, selecione a data da punicao.');
      return;
    }

    if ((tipoPunicao === 'detencao' || tipoPunicao === 'prisao') && diasPunicao <= 0) {
      alert('Por favor, informe a quantidade de dias de punicao.');
      return;
    }

    if (!descricao.trim()) {
      alert('Por favor, informe a descricao da transgressao.');
      return;
    }

    // Buscar dados do militar selecionado
    const militarSelecionado = militares.find(m => m.id === militarId);
    if (!militarSelecionado) {
      alert('Militar nao encontrado.');
      return;
    }

    const data: PunicaoAntigaData = {
      militarId,
      militarNome: militarSelecionado.nomeCompleto || militarSelecionado.nome,
      militarPosto: militarSelecionado.postoGraduacao || militarSelecionado.patente,
      tipoPunicao,
      dataPunicao,
      diasPunicao: tipoPunicao === 'repreensao' ? 0 : diasPunicao,
      dataInicioPunicao: tipoPunicao === 'repreensao' ? undefined : dataInicioPunicao,
      descricao: descricao.trim(),
      observacoes: observacoes.trim() || undefined,
    };

    await onSubmit(data);
  };

  const resetForm = () => {
    if (!militarPreSelecionado) {
      setMilitarId('');
    }
    setTipoPunicao('');
    setDataPunicao(undefined);
    setDiasPunicao(0);
    setDataInicioPunicao(undefined);
    setDescricao('');
    setObservacoes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const mostrarCamposDias = tipoPunicao === 'detencao' || tipoPunicao === 'prisao';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-orange-600" />
            Lancar Punicao do Sistema DGP
          </DialogTitle>
          <DialogDescription>
            Registre uma punicao antiga que ja foi aplicada no sistema DGP para que seja contabilizada no calculo de comportamento.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Aviso importante */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-1">
                  Importante
                </p>
                <p className="text-amber-700">
                  Este lancamento e para registrar punicoes ja aplicadas anteriormente no sistema DGP.
                  A punicao sera contabilizada no calculo de comportamento a partir da data informada.
                </p>
              </div>
            </div>

            {/* Selecao de Militar */}
            {!militarPreSelecionado && (
              <div className="space-y-2">
                <Label htmlFor="militar" className="text-base font-semibold">
                  Militar <span className="text-red-500">*</span>
                </Label>
                <Combobox
                  options={militares.map((militar): ComboboxOption => ({
                    value: militar.id,
                    label: `${militar.patente || militar.postoGraduacao || ''} ${militar.nome || militar.nomeCompleto} - RG: ${militar.rg || militar.matricula}`,
                    searchableText: `${militar.patente || militar.postoGraduacao || ''} ${militar.nome || militar.nomeCompleto} ${militar.rg || militar.matricula} ${militar.nomeDeGuerra || ''}`
                  }))}
                  value={militarId}
                  onChange={setMilitarId}
                  placeholder="Selecione o militar"
                  searchPlaceholder="Buscar por nome, RG ou patente..."
                  emptyMessage="Nenhum militar encontrado."
                />
              </div>
            )}

            {/* Militar pre-selecionado */}
            {militarPreSelecionado && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Militar: </span>
                  {militarPreSelecionado.patente || militarPreSelecionado.postoGraduacao} {militarPreSelecionado.nome || militarPreSelecionado.nomeCompleto}
                </p>
              </div>
            )}

            {/* Tipo de Punicao */}
            <div className="space-y-2">
              <Label htmlFor="tipoPunicao" className="text-base font-semibold">
                Tipo de Punicao <span className="text-red-500">*</span>
              </Label>
              <Select value={tipoPunicao} onValueChange={(value) => setTipoPunicao(value as TipoPunicaoAntiga)}>
                <SelectTrigger id="tipoPunicao">
                  <SelectValue placeholder="Selecione o tipo de punicao..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PUNICAO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data da Punicao */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Data da Punicao <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Data em que a punicao foi aplicada/registrada no sistema DGP.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataPunicao && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataPunicao ? format(dataPunicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataPunicao}
                    onSelect={setDataPunicao}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Dias de Punicao e Data de Inicio - apenas para detencao e prisao */}
            {mostrarCamposDias && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="diasPunicao" className="text-base font-semibold">
                    Quantidade de Dias <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="diasPunicao"
                    type="number"
                    min="1"
                    value={diasPunicao}
                    onChange={(e) => setDiasPunicao(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 5"
                    className="font-semibold text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Data de Inicio da Punicao
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Data em que o militar comecou a cumprir a punicao (opcional).
                  </p>
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
                        {dataInicioPunicao ? format(dataInicioPunicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione a data (opcional)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataInicioPunicao}
                        onSelect={setDataInicioPunicao}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Descricao */}
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-base font-semibold">
                Descricao da Transgressao <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descricao"
                placeholder="Descreva brevemente o motivo da punicao..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Observacoes */}
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-base font-semibold">
                Observacoes (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informacoes adicionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !tipoPunicao || !dataPunicao || !militarId}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <History className="mr-2 h-4 w-4" />
            Lancar Punicao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
