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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DecisaoTipo = 'justificar' | 'justificar_parte' | 'punir';
export type ClassificacaoTransgressao = 'leve' | 'media' | 'grave';
export type TipoPunicao = 'advertencia' | 'repreensao' | 'detencao' | 'prisao';

interface AtenuanteOption {
  id: string;
  label: string;
}

interface AgravanteOption {
  id: string;
  label: string;
  hasNumberInput?: boolean;
}

interface ConcluirPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConclusaoPadData) => Promise<void>;
  processoId: string;
  isLoading?: boolean;
}

export interface ConclusaoPadData {
  decisao: DecisaoTipo;
  justificativa?: string;
  observacoes?: string;
  atenuantes?: string[];
  agravantes?: string[];
  reincidenciaVerbalVezes?: number;
  classificacao?: ClassificacaoTransgressao;
  tipoPunicao?: TipoPunicao;
  diasPunicao?: number;
  dataInicioPunicao?: Date;
}

const ATENUANTES: AtenuanteOption[] = [
  { id: 'bom_comportamento', label: 'Bom comportamento' },
  { id: 'servicos_relevantes', label: 'Relevância de serviços prestados' },
  { id: 'evitar_mal_maior', label: 'Ter sido cometida a transgressão para evitar mal maior' },
  {
    id: 'defesa_propria',
    label: 'Ter sido cometida a transgressão em defesa própria, de seus direitos ou de outrem, desde que não constitua causa de justificação'
  },
  { id: 'falta_pratica_servico', label: 'Falta da prática do serviço' },
];

const AGRAVANTES: AgravanteOption[] = [
  { id: 'mau_comportamento', label: 'Mau comportamento' },
  { id: 'pratica_simultanea', label: 'Prática simultânea de duas ou mais transgressões' },
  {
    id: 'reincidencia_verbal',
    label: 'Reincidência de transgressão mesmo punida verbalmente',
    hasNumberInput: true
  },
  { id: 'conluio', label: 'Conluio de duas ou mais pessoas' },
  { id: 'durante_servico', label: 'Ser praticada a transgressão durante execução de serviço' },
  { id: 'presenca_subordinado', label: 'Ser cometida a falta em presença de subordinado' },
  { id: 'abuso_autoridade', label: 'Ter abusado o transgressor de sua autoridade hierárquica' },
  { id: 'premeditacao', label: 'Ter praticado a transgressão com premeditação' },
  { id: 'presenca_tropa', label: 'Ter sido praticada a transgressão em presença de tropa' },
  { id: 'presenca_publico', label: 'Ter sido praticada a transgressão em presença de público' },
];

const PUNIÇÃO_BASE: Record<ClassificacaoTransgressao, number> = {
  leve: 1,
  media: 2,
  grave: 4,
};

export function ConcluirPadModal({
  isOpen,
  onClose,
  onSubmit,
  processoId,
  isLoading = false,
}: ConcluirPadModalProps) {
  const [decisao, setDecisao] = useState<DecisaoTipo | ''>('');
  const [justificativa, setJustificativa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Campos para cenário de punição
  const [atenuantesSelecionados, setAtenuantesSelecionados] = useState<string[]>([]);
  const [agravantesSelecionados, setAgravantesSelecionados] = useState<string[]>([]);
  const [reincidenciaVerbalVezes, setReincidenciaVerbalVezes] = useState<number>(0);
  const [classificacao, setClassificacao] = useState<ClassificacaoTransgressao | ''>('');
  const [tipoPunicao, setTipoPunicao] = useState<TipoPunicao | ''>('');
  const [diasPunicao, setDiasPunicao] = useState<number>(0);
  const [dataInicioPunicao, setDataInicioPunicao] = useState<Date | undefined>(new Date());

  // Cálculo automático dos dias de punição
  useEffect(() => {
    if (decisao !== 'punir' || !classificacao) {
      setDiasPunicao(0);
      return;
    }

    // Se for advertência ou repreensão, não tem dias de punição
    if (tipoPunicao === 'advertencia' || tipoPunicao === 'repreensao') {
      setDiasPunicao(0);
      return;
    }

    const punicaoBase = PUNIÇÃO_BASE[classificacao];
    const totalAtenuantes = atenuantesSelecionados.length;
    const totalAgravantes = agravantesSelecionados.length;

    // Fórmula: Dias = Punição Base + 2 * (Total Agravantes - Total Atenuantes)
    const diasCalculados = punicaoBase + 2 * (totalAgravantes - totalAtenuantes);

    // Não pode ser menor que 0
    setDiasPunicao(Math.max(0, diasCalculados));
  }, [decisao, classificacao, atenuantesSelecionados, agravantesSelecionados, tipoPunicao]);

  const handleAtenuanteChange = (atenuanteId: string, checked: boolean) => {
    setAtenuantesSelecionados(prev =>
      checked
        ? [...prev, atenuanteId]
        : prev.filter(id => id !== atenuanteId)
    );
  };

  const handleAgravanteChange = (agravanteId: string, checked: boolean) => {
    setAgravantesSelecionados(prev =>
      checked
        ? [...prev, agravanteId]
        : prev.filter(id => id !== agravanteId)
    );

    // Resetar o campo de vezes se desmarcar a reincidência verbal
    if (agravanteId === 'reincidencia_verbal' && !checked) {
      setReincidenciaVerbalVezes(0);
    }
  };

  const handleSubmit = async () => {
    if (!decisao) {
      return;
    }

    const data: ConclusaoPadData = {
      decisao,
    };

    if (decisao === 'justificar' || decisao === 'justificar_parte') {
      // Cenário A: Justificar
      if (!justificativa.trim()) {
        alert('Por favor, preencha a justificativa.');
        return;
      }
      data.justificativa = justificativa;
      data.observacoes = observacoes;
    } else {
      // Cenário B: Punir
      if (!classificacao || !tipoPunicao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      data.atenuantes = atenuantesSelecionados;
      data.agravantes = agravantesSelecionados;
      data.reincidenciaVerbalVezes = agravantesSelecionados.includes('reincidencia_verbal')
        ? reincidenciaVerbalVezes
        : undefined;
      data.classificacao = classificacao;
      data.tipoPunicao = tipoPunicao;
      data.diasPunicao = diasPunicao;
      data.dataInicioPunicao = dataInicioPunicao;
      data.observacoes = observacoes;
    }

    await onSubmit(data);
  };

  const resetForm = () => {
    setDecisao('');
    setJustificativa('');
    setObservacoes('');
    setAtenuantesSelecionados([]);
    setAgravantesSelecionados([]);
    setReincidenciaVerbalVezes(0);
    setClassificacao('');
    setTipoPunicao('');
    setDiasPunicao(0);
    setDataInicioPunicao(new Date());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isScenarioA = decisao === 'justificar' || decisao === 'justificar_parte';
  const isScenarioB = decisao === 'punir';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Concluir Processo Administrativo Disciplinar</DialogTitle>
          <DialogDescription>
            Preencha as informações para finalizar o PAD #{processoId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Campo de Decisão - Sempre visível */}
            <div className="space-y-2">
              <Label htmlFor="decisao" className="text-base font-semibold">
                Decisão <span className="text-red-500">*</span>
              </Label>
              <Select value={decisao} onValueChange={(value) => setDecisao(value as DecisaoTipo)}>
                <SelectTrigger id="decisao">
                  <SelectValue placeholder="Selecione a decisão..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="justificar">Justificar Transgressão</SelectItem>
                  <SelectItem value="justificar_parte">Justificar Transgressão em Parte</SelectItem>
                  <SelectItem value="punir">Aplicar Punição (Não Justifica)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CENÁRIO A: Justificar */}
            {isScenarioA && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="justificativa" className="text-base font-semibold">
                    Justificativa <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Descreva o motivo da justificativa..."
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes-a" className="text-base font-semibold">
                    Observações Finais
                  </Label>
                  <Textarea
                    id="observacoes-a"
                    placeholder="Observações adicionais sobre a conclusão..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {/* CENÁRIO B: Aplicar Punição */}
            {isScenarioB && (
              <>
                {/* Atenuantes */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Atenuantes</Label>
                  <div className="space-y-3 pl-2">
                    {ATENUANTES.map((atenuante) => (
                      <div key={atenuante.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`atenuante-${atenuante.id}`}
                          checked={atenuantesSelecionados.includes(atenuante.id)}
                          onCheckedChange={(checked) =>
                            handleAtenuanteChange(atenuante.id, checked as boolean)
                          }
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`atenuante-${atenuante.id}`}
                          className="text-sm font-normal leading-relaxed cursor-pointer"
                        >
                          {atenuante.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agravantes */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Agravantes</Label>
                  <div className="space-y-3 pl-2">
                    {AGRAVANTES.map((agravante) => (
                      <div key={agravante.id} className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={`agravante-${agravante.id}`}
                            checked={agravantesSelecionados.includes(agravante.id)}
                            onCheckedChange={(checked) =>
                              handleAgravanteChange(agravante.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <Label
                            htmlFor={`agravante-${agravante.id}`}
                            className="text-sm font-normal leading-relaxed cursor-pointer flex-1"
                          >
                            {agravante.label}
                          </Label>
                        </div>

                        {/* Campo numérico para reincidência verbal */}
                        {agravante.hasNumberInput && agravantesSelecionados.includes(agravante.id) && (
                          <div className="ml-9 flex items-center space-x-2">
                            <Label htmlFor="reincidencia-vezes" className="text-sm whitespace-nowrap">
                              Nº de vezes:
                            </Label>
                            <Input
                              id="reincidencia-vezes"
                              type="number"
                              min="0"
                              value={reincidenciaVerbalVezes}
                              onChange={(e) => setReincidenciaVerbalVezes(parseInt(e.target.value) || 0)}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classificação da Transgressão */}
                <div className="space-y-2">
                  <Label htmlFor="classificacao" className="text-base font-semibold">
                    Classificação da Transgressão <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={classificacao}
                    onValueChange={(value) => setClassificacao(value as ClassificacaoTransgressao)}
                  >
                    <SelectTrigger id="classificacao">
                      <SelectValue placeholder="Selecione a classificação..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Punição */}
                <div className="space-y-2">
                  <Label htmlFor="tipo-punicao" className="text-base font-semibold">
                    Tipo de Punição <span className="text-red-500">*</span>
                  </Label>
                  <Select value={tipoPunicao} onValueChange={(value) => setTipoPunicao(value as TipoPunicao)}>
                    <SelectTrigger id="tipo-punicao">
                      <SelectValue placeholder="Selecione o tipo de punição..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advertencia">Advertência por Escrito</SelectItem>
                      <SelectItem value="repreensao">Repreensão</SelectItem>
                      <SelectItem value="detencao">Detenção</SelectItem>
                      <SelectItem value="prisao">Prisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dias de Punição e Data de Início - Ocultar se for advertência ou repreensão */}
                {tipoPunicao !== 'advertencia' && tipoPunicao !== 'repreensao' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dias-punicao" className="text-base font-semibold">
                        Dias de Punição <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dias-punicao"
                        type="number"
                        min="0"
                        value={diasPunicao}
                        onChange={(e) => setDiasPunicao(parseInt(e.target.value) || 0)}
                        className="font-semibold text-lg"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Calculado automaticamente: Base ({classificacao ? PUNIÇÃO_BASE[classificacao] : 0}) + 2 × (
                        {agravantesSelecionados.length} agravantes - {atenuantesSelecionados.length} atenuantes). Você pode ajustar manualmente.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Data de Início da Punição <span className="text-red-500">*</span>
                      </Label>
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
                            {dataInicioPunicao ? format(dataInicioPunicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
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
                  </>
                )}

                {/* Observações Finais */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes-b" className="text-base font-semibold">
                    Observações Finais
                  </Label>
                  <Textarea
                    id="observacoes-b"
                    placeholder="Observações adicionais sobre a conclusão..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !decisao}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Concluir PAD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
