'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  BarChart3,
  RefreshCw,
  User,
  Shield
} from 'lucide-react';
import {
  ClassificacaoComportamento,
  DashboardComportamento as DashboardData,
} from '@/types/comportamento';
import { comportamentoService } from '@/lib/comportamento/service';
import { toast } from 'sonner';

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

const getIconeClassificacao = (classificacao: ClassificacaoComportamento) => {
  switch (classificacao) {
    case ClassificacaoComportamento.EXCEPCIONAL:
    case ClassificacaoComportamento.OTIMO:
      return <Award className="w-4 h-4" />;
    case ClassificacaoComportamento.BOM:
      return <Shield className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

export default function DashboardComportamento() {
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dados = await comportamentoService.gerarDashboard();
      setDashboardData(dados);
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalcularTodos = async () => {
    try {
      setRecalculando(true);
      const atualizados = await comportamentoService.recalcularTodosComportamentos();
      toast.success(`${atualizados} comportamentos foram atualizados`);
      await carregarDados();
    } catch (error) {
      toast.error('Erro ao recalcular comportamentos');
    } finally {
      setRecalculando(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-3 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalComAtencao =
    dashboardData.distribuicaoComportamento[ClassificacaoComportamento.INSUFICIENTE] +
    dashboardData.distribuicaoComportamento[ClassificacaoComportamento.MAU];

  const percentualBomOuMelhor =
    ((dashboardData.distribuicaoComportamento[ClassificacaoComportamento.EXCEPCIONAL] +
      dashboardData.distribuicaoComportamento[ClassificacaoComportamento.OTIMO] +
      dashboardData.distribuicaoComportamento[ClassificacaoComportamento.BOM]) /
      dashboardData.totalPracas) *
    100;

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Comportamento</h2>
          <p className="text-muted-foreground">
            Visão geral da classificação comportamental da tropa
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRecalcularTodos}
          disabled={recalculando}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
          Recalcular Todos
        </Button>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Praças */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total de Praças</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPracas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Militares com classificação
            </p>
          </CardContent>
        </Card>

        {/* Comportamento Bom ou Melhor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Bom ou Melhor</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualBomOuMelhor.toFixed(1)}%</div>
            <Progress value={percentualBomOuMelhor} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Excelente indicador
            </p>
          </CardContent>
        </Card>

        {/* Requerem Atenção */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Atenção Especial</CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComAtencao}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Insuficiente ou Mau
            </p>
          </CardContent>
        </Card>

        {/* Tendência do Mês */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Tendência Mensal</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.tendenciaMensal.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    +{dashboardData.tendenciaMensal[dashboardData.tendenciaMensal.length - 1].melhorias}
                  </span>
                  <TrendingDown className="w-4 h-4 text-red-600 ml-2" />
                  <span className="text-sm font-medium">
                    -{dashboardData.tendenciaMensal[dashboardData.tendenciaMensal.length - 1].rebaixamentos}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mudanças este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Classificação */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Classificação</CardTitle>
          <CardDescription>
            Quantidade de militares em cada nível de comportamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dashboardData.distribuicaoComportamento).map(([classificacao, quantidade]) => {
              const percentual = (quantidade / dashboardData.totalPracas) * 100;
              return (
                <div key={classificacao} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getCorClassificacao(classificacao as ClassificacaoComportamento)} text-white`}>
                        {classificacao}
                      </Badge>
                      <span className="text-sm font-medium">{quantidade} militares</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {percentual.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={percentual}
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid com Militares em Atenção e Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Militares que Requerem Atenção */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Militares em Situação de Atenção</CardTitle>
                <CardDescription>
                  Comportamento Insuficiente ou Mau
                </CardDescription>
              </div>
              <Badge variant="destructive">{dashboardData.militaresAtencao.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {dashboardData.militaresAtencao.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum militar em situação de atenção</p>
                    <p className="text-sm mt-1">Excelente!</p>
                  </div>
                ) : (
                  dashboardData.militaresAtencao.map((militar) => (
                    <div
                      key={militar.militarId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {getIconeClassificacao(militar.comportamentoAtual)}
                        </div>
                        <div>
                          <p className="font-medium">{militar.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                militar.comportamentoAtual === ClassificacaoComportamento.MAU
                                  ? 'text-red-600 border-red-600'
                                  : 'text-yellow-600 border-yellow-600'
                              }`}
                            >
                              {militar.comportamentoAtual}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {militar.punicoesRecentes.toFixed(1)} punições equiv.
                            </span>
                          </div>
                        </div>
                      </div>
                      {militar.diasParaMelhoria && militar.diasParaMelhoria > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{militar.diasParaMelhoria} dias</p>
                          <p className="text-xs text-muted-foreground">para melhoria</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tendência Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>
              Melhorias e rebaixamentos nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {dashboardData.tendenciaMensal.map((mes, index) => {
                  const saldo = mes.melhorias - mes.rebaixamentos;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{mes.mes}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">+{mes.melhorias}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingDown className="w-3 h-3 text-red-600" />
                            <span className="text-red-600">-{mes.rebaixamentos}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={saldo >= 0 ? 'default' : 'destructive'}
                        className="min-w-[60px] justify-center"
                      >
                        {saldo >= 0 ? '+' : ''}{saldo}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}