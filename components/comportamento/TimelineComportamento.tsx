'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Circle,
  ArrowUp,
  ArrowDown,
  Calendar,
  FileText,
  Clock
} from 'lucide-react';
import { ClassificacaoComportamento, HistoricoComportamento } from '@/types/comportamento';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineComportamentoProps {
  historico: HistoricoComportamento[];
  militarNome?: string;
}

const getCorClassificacao = (classificacao: ClassificacaoComportamento) => {
  switch (classificacao) {
    case ClassificacaoComportamento.EXCEPCIONAL:
      return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950';
    case ClassificacaoComportamento.OTIMO:
      return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
    case ClassificacaoComportamento.BOM:
      return 'text-green-500 bg-green-50 dark:bg-green-950';
    case ClassificacaoComportamento.INSUFICIENTE:
      return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
    case ClassificacaoComportamento.MAU:
      return 'text-red-500 bg-red-50 dark:bg-red-950';
    default:
      return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
  }
};

const getTipoMudanca = (anterior: ClassificacaoComportamento, nova: ClassificacaoComportamento) => {
  const ordem = {
    [ClassificacaoComportamento.EXCEPCIONAL]: 5,
    [ClassificacaoComportamento.OTIMO]: 4,
    [ClassificacaoComportamento.BOM]: 3,
    [ClassificacaoComportamento.INSUFICIENTE]: 2,
    [ClassificacaoComportamento.MAU]: 1,
  };

  if (ordem[nova] > ordem[anterior]) {
    return 'melhoria';
  } else if (ordem[nova] < ordem[anterior]) {
    return 'rebaixamento';
  }
  return 'igual';
};

export default function TimelineComportamento({
  historico,
  militarNome
}: TimelineComportamentoProps) {
  if (historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comportamento</CardTitle>
          <CardDescription>
            {militarNome ? `Histórico de ${militarNome}` : 'Sem alterações registradas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma alteração de comportamento registrada</p>
            <p className="text-sm mt-1">
              As mudanças aparecerão aqui quando houver alterações
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Comportamento</CardTitle>
        <CardDescription>
          {militarNome
            ? `Evolução do comportamento de ${militarNome}`
            : 'Linha do tempo das alterações'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {/* Linha vertical central */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            {/* Eventos da timeline */}
            <div className="space-y-6">
              {historico.map((evento, index) => {
                const tipoMudanca = getTipoMudanca(
                  evento.classificacaoAnterior,
                  evento.classificacaoNova
                );

                return (
                  <div key={evento.id} className="relative flex gap-4">
                    {/* Ícone do evento */}
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="bg-background border-2 border-border rounded-full p-2">
                        {tipoMudanca === 'melhoria' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : tipoMudanca === 'rebaixamento' ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do evento */}
                    <div className="flex-1 pb-6">
                      <div className="bg-card border rounded-lg p-4 space-y-3">
                        {/* Header com data e tipo */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {format(
                                new Date(evento.dataAlteracao),
                                "dd 'de' MMMM 'de' yyyy",
                                { locale: ptBR }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(evento.dataAlteracao), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {evento.calculoAutomatico && (
                            <Badge variant="secondary" className="text-xs">
                              Automático
                            </Badge>
                          )}
                        </div>

                        {/* Mudança de classificação */}
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getCorClassificacao(evento.classificacaoAnterior)}`}
                          >
                            {evento.classificacaoAnterior}
                          </Badge>

                          <div className="flex items-center">
                            {tipoMudanca === 'melhoria' ? (
                              <ArrowUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>

                          <Badge
                            className={`${getCorClassificacao(evento.classificacaoNova)}`}
                          >
                            {evento.classificacaoNova}
                          </Badge>
                        </div>

                        {/* Motivo da alteração */}
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Motivo:</span> {evento.motivoAlteracao}
                          </p>
                        </div>

                        {/* Referência ao processo, se houver */}
                        {evento.punicaoRelacionadaId && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>Punição ID: {evento.punicaoRelacionadaId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Marcador de início (inclusão) */}
              <div className="relative flex gap-4">
                <div className="relative z-10 flex items-center justify-center">
                  <div className="bg-background border-2 border-primary rounded-full p-2">
                    <Circle className="w-4 h-4 text-primary fill-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Início do Registro</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Militar incluído com comportamento BOM (padrão inicial)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}