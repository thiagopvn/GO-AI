'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TipoPunicao } from '@/types/comportamento';
import { comportamentoService } from '@/lib/comportamento/service';
import { toast } from 'sonner';

interface FormularioPunicaoProps {
  militarId: string;
  nomeMilitar: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FormularioPunicao({
  militarId,
  nomeMilitar,
  onSuccess,
  onCancel,
}: FormularioPunicaoProps) {
  const [loading, setLoading] = useState(false);
  const [simulacao, setSimulacao] = useState<{
    comportamentoAnterior: string;
    comportamentoAtual: string;
    pontosAntes: number;
    pontosDepois: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    tipo: TipoPunicao.REPREENSAO,
    dias: 1,
    dataAplicacao: new Date(),
    motivo: '',
    numeroProcesso: '',
    observacoes: '',
  });

  const handleSimular = async () => {
    try {
      const resultado = await comportamentoService.simularPunicao(
        militarId,
        formData.tipo,
        formData.dias
      );
      setSimulacao(resultado);
    } catch (error) {
      toast.error('Erro ao simular punição');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await comportamentoService.registrarPunicao(
        militarId,
        formData.tipo,
        formData.dias,
        formData.motivo,
        formData.numeroProcesso,
        formData.observacoes
      );

      toast.success('Punição registrada com sucesso!', {
        description: 'O comportamento foi recalculado automaticamente.',
      });

      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao registrar punição');
    } finally {
      setLoading(false);
    }
  };

  const getDescricaoPunicao = (tipo: TipoPunicao) => {
    switch (tipo) {
      case TipoPunicao.REPREENSAO:
        return 'Punição mais leve, aplicada para faltas de menor gravidade';
      case TipoPunicao.DETENCAO:
        return 'Punição intermediária, o militar fica detido mas pode trabalhar';
      case TipoPunicao.PRISAO:
        return 'Punição mais grave, com restrição total de liberdade';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrar Nova Punição</CardTitle>
        <CardDescription>
          Registre uma punição disciplinar para {nomeMilitar}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Punição */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Punição *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => {
                setFormData({ ...formData, tipo: value as TipoPunicao });
                setSimulacao(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TipoPunicao.REPREENSAO}>Repreensão</SelectItem>
                <SelectItem value={TipoPunicao.DETENCAO}>Detenção</SelectItem>
                <SelectItem value={TipoPunicao.PRISAO}>Prisão</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getDescricaoPunicao(formData.tipo)}
            </p>
          </div>

          {/* Dias de Punição */}
          <div className="space-y-2">
            <Label htmlFor="dias">Quantidade de Dias *</Label>
            <Input
              id="dias"
              type="number"
              min="1"
              max="30"
              value={formData.dias}
              onChange={(e) => {
                setFormData({ ...formData, dias: parseInt(e.target.value) || 1 });
                setSimulacao(null);
              }}
              required
            />
            <p className="text-sm text-muted-foreground">
              Duração da punição em dias (1 a 30 dias)
            </p>
          </div>

          {/* Data de Aplicação */}
          <div className="space-y-2">
            <Label>Data de Aplicação *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.dataAplicacao && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dataAplicacao ? (
                    format(formData.dataAplicacao, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dataAplicacao}
                  onSelect={(date) =>
                    setFormData({ ...formData, dataAplicacao: date || new Date() })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Punição *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Descreva o motivo da punição..."
              rows={3}
              required
            />
          </div>

          {/* Número do Processo */}
          <div className="space-y-2">
            <Label htmlFor="processo">Número do Processo</Label>
            <Input
              id="processo"
              value={formData.numeroProcesso}
              onChange={(e) =>
                setFormData({ ...formData, numeroProcesso: e.target.value })
              }
              placeholder="Ex: SIND-2024-001"
            />
            <p className="text-sm text-muted-foreground">
              Referência ao processo de sindicância ou transgressão (opcional)
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais relevantes..."
              rows={2}
            />
          </div>

          {/* Simulação de Impacto */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Simulação de Impacto</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimular}
                disabled={!formData.motivo}
              >
                Simular
              </Button>
            </div>

            {simulacao && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Comportamento Atual:
                  </span>
                  <span className="font-medium">{simulacao.classificacaoAtual}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Comportamento Após Punição:
                  </span>
                  <span className="font-medium">{simulacao.classificacaoAposSimulacao}</span>
                </div>
                {simulacao.mudaria ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Esta punição causará rebaixamento do comportamento
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">
                      Esta punição não alterará a classificação atual
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.motivo}>
              {loading ? 'Registrando...' : 'Registrar Punição'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}