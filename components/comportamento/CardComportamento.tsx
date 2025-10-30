'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { ClassificacaoComportamento, ComportamentoMilitar } from '@/types/comportamento';

interface CardComportamentoProps {
  comportamento: ComportamentoMilitar;
  nomeMilitar: string;
  posto: string;
}

const getCorClassificacao = (classificacao: ClassificacaoComportamento) => {
  switch (classificacao) {
    case ClassificacaoComportamento.EXCEPCIONAL:
      return 'bg-emerald-500';
    case ClassificacaoComportamento.OTIMO:
      return 'bg-blue-500';
    case ClassificacaoComportamento.BOM:
      return 'bg-green-500';
    case ClassificacaoComportamento.INSUFICIENTE:
      return 'bg-yellow-500';
    case ClassificacaoComportamento.MAU:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getProgressoMelhoria = (classificacao: ClassificacaoComportamento) => {
  switch (classificacao) {
    case ClassificacaoComportamento.EXCEPCIONAL:
      return 100;
    case ClassificacaoComportamento.OTIMO:
      return 80;
    case ClassificacaoComportamento.BOM:
      return 60;
    case ClassificacaoComportamento.INSUFICIENTE:
      return 30;
    case ClassificacaoComportamento.MAU:
      return 10;
    default:
      return 0;
  }
};

export default function CardComportamento({
  comportamento,
  nomeMilitar,
  posto,
}: CardComportamentoProps) {
  const diasParaMelhoria = comportamento.dataProximaRevisao
    ? Math.ceil(
        (comportamento.dataProximaRevisao.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const temAlerta =
    comportamento.classificacaoAtual === ClassificacaoComportamento.INSUFICIENTE ||
    comportamento.classificacaoAtual === ClassificacaoComportamento.MAU;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{nomeMilitar}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{posto}</p>
          </div>
          <Badge
            className={`${getCorClassificacao(comportamento.classificacaoAtual)} text-white`}
          >
            {comportamento.classificacaoAtual}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de progresso visual do comportamento */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nível de Comportamento</span>
            <span className="font-medium">
              {getProgressoMelhoria(comportamento.classificacaoAtual)}%
            </span>
          </div>
          <Progress
            value={getProgressoMelhoria(comportamento.classificacaoAtual)}
            className="h-2"
          />
        </div>

        {/* Estatísticas de punições */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-semibold">
              {comportamento.punicoesAcumuladas.repreensoes}
            </p>
            <p className="text-xs text-muted-foreground">Repreensões</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">
              {comportamento.punicoesAcumuladas.detencoes}
            </p>
            <p className="text-xs text-muted-foreground">Detenções</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">
              {comportamento.punicoesAcumuladas.prisoes}
            </p>
            <p className="text-xs text-muted-foreground">Prisões</p>
          </div>
        </div>

        {/* Equivalente total */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Equivalente em Prisões
            </span>
            <span className="font-semibold">
              {comportamento.punicoesAcumuladas.equivalentePrisoes.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="space-y-2 pt-2 border-t">
          {diasParaMelhoria && diasParaMelhoria > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>
                Possível melhoria em <strong>{diasParaMelhoria} dias</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Última atualização:</span>
            <span>
              {new Date(comportamento.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {temAlerta && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="w-4 h-4" />
              <span>Comportamento requer atenção especial</span>
            </div>
          )}
        </div>

        {/* Indicador de tendência */}
        {comportamento.historicoClassificacoes.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {comportamento.historicoClassificacoes[0].classificacaoNova >
            comportamento.historicoClassificacoes[0].classificacaoAnterior ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Comportamento melhorou recentemente</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Comportamento rebaixado recentemente</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}