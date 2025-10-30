'use client';

import { useState, useEffect } from 'react';
import { BarChart2, PieChart, TrendingUp, Users, FileText, AlertTriangle, Calendar, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Militar, Transgressao, Sindicancia } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { SindicanciaService } from '@/lib/services/sindicancia.service';
import { TransgressaoService } from '@/lib/services/transgressao.service';

interface Estatisticas {
  totalMilitares: number;
  militaresAtivos: number;
  totalTransgressoes: number;
  transgressoesNoMes: number;
  totalSindicancias: number;
  sindicanciasEmAndamento: number;
  comportamentoPorTipo: {
    excepcional: number;
    otimo: number;
    bom: number;
    insuficiente: number;
    mau: number;
  };
  transgressoesPorNatureza: {
    leve: number;
    media: number;
    grave: number;
  };
}

export default function RelatoriosPage() {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [transgressoes, setTransgressoes] = useState<Transgressao[]>([]);
  const [sindicancias, setSindicancias] = useState<Sindicancia[]>([]);
  const [periodo, setPeriodo] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar militares
      const militaresSnapshot = await getDocs(collection(db, 'militares'));
      const militaresList = militaresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Militar[];
      setMilitares(militaresList);

      // Carregar transgressões
      const transgressoesList = await TransgressaoService.listar();
      setTransgressoes(transgressoesList);

      // Carregar sindicâncias
      const sindicanciasList = await SindicanciaService.listar();
      setSindicancias(sindicanciasList);

      // Calcular estatísticas
      const stats = calcularEstatisticas(militaresList, transgressoesList, sindicanciasList);
      setEstatisticas(stats);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (
    militaresList: Militar[],
    transgressoesList: Transgressao[],
    sindicanciasList: Sindicancia[]
  ): Estatisticas => {
    const inicioMes = startOfMonth(new Date());

    return {
      totalMilitares: militaresList.length,
      militaresAtivos: militaresList.filter(m => m.status === 'Ativo').length,
      totalTransgressoes: transgressoesList.length,
      transgressoesNoMes: transgressoesList.filter(t => t.data >= inicioMes).length,
      totalSindicancias: sindicanciasList.length,
      sindicanciasEmAndamento: sindicanciasList.filter(s => s.status === 'Em Andamento').length,
      comportamentoPorTipo: {
        excepcional: militaresList.filter(m => m.comportamento === 'Excepcional').length,
        otimo: militaresList.filter(m => m.comportamento === 'Ótimo').length,
        bom: militaresList.filter(m => m.comportamento === 'Bom').length,
        insuficiente: militaresList.filter(m => m.comportamento === 'Insuficiente').length,
        mau: militaresList.filter(m => m.comportamento === 'Mau').length,
      },
      transgressoesPorNatureza: {
        leve: transgressoesList.filter(t => t.natureza === 'Leve').length,
        media: transgressoesList.filter(t => t.natureza === 'Média').length,
        grave: transgressoesList.filter(t => t.natureza === 'Grave').length,
      }
    };
  };

  const getComportamentoColor = (comportamento: string) => {
    switch (comportamento) {
      case 'Excepcional':
        return 'bg-green-600';
      case 'Ótimo':
        return 'bg-blue-600';
      case 'Bom':
        return 'bg-yellow-600';
      case 'Insuficiente':
        return 'bg-orange-600';
      case 'Mau':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const calcularPercentual = (valor: number, total: number) => {
    return total > 0 ? ((valor / total) * 100).toFixed(1) : '0';
  };

  const exportarRelatorio = (tipo: string) => {
    // TODO: Implementar exportação real
    toast.info(`Exportação de ${tipo} será implementada em breve`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Visualize estatísticas e gere relatórios do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Militares Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.militaresAtivos}</div>
            <p className="text-xs text-muted-foreground">
              de {estatisticas?.totalMilitares} militares totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transgressões no Mês</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.transgressoesNoMes}</div>
            <p className="text-xs text-muted-foreground">
              Total: {estatisticas?.totalTransgressoes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sindicâncias em Andamento</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.sindicanciasEmAndamento}</div>
            <p className="text-xs text-muted-foreground">
              Total: {estatisticas?.totalSindicancias}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Disciplina</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas && calcularPercentual(
                estatisticas.comportamentoPorTipo.excepcional + estatisticas.comportamentoPorTipo.otimo,
                estatisticas.militaresAtivos
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Comportamento Exc/Ótimo
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comportamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
          <TabsTrigger value="transgressoes">Transgressões</TabsTrigger>
          <TabsTrigger value="sindicancias">Sindicâncias</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="comportamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Comportamento</CardTitle>
              <CardDescription>
                Quantidade de militares por classificação de comportamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estatisticas && Object.entries(estatisticas.comportamentoPorTipo).map(([tipo, quantidade]) => {
                  const percentual = calcularPercentual(quantidade, estatisticas.militaresAtivos);
                  return (
                    <div key={tipo} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{tipo}</span>
                        <span className="font-medium">{quantidade} ({percentual}%)</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getComportamentoColor(tipo.charAt(0).toUpperCase() + tipo.slice(1))}`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Militares com Comportamento Crítico</CardTitle>
              <CardDescription>
                Militares com comportamento Insuficiente ou Mau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {militares
                  .filter(m => m.comportamento === 'Insuficiente' || m.comportamento === 'Mau')
                  .map(militar => (
                    <div key={militar.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{militar.postoGraduacao} {militar.nomeCompleto}</p>
                        <p className="text-sm text-gray-600">RG: {militar.rg}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          militar.comportamento === 'Insuficiente'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {militar.comportamento}
                        </Badge>
                        <Badge variant="outline">
                          {militar.diasForaDaPauta} dias
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transgressoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transgressões por Natureza</CardTitle>
              <CardDescription>
                Distribuição das transgressões registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estatisticas && Object.entries(estatisticas.transgressoesPorNatureza).map(([natureza, quantidade]) => {
                  const percentual = calcularPercentual(quantidade, estatisticas.totalTransgressoes);
                  return (
                    <div key={natureza} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{natureza}</span>
                        <span className="font-medium">{quantidade} ({percentual}%)</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            natureza === 'leve' ? 'bg-yellow-500' :
                            natureza === 'media' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transgressões Recentes</CardTitle>
              <CardDescription>
                Últimas transgressões registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transgressoes.slice(0, 5).map(transgressao => (
                  <div key={transgressao.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transgressao.militarPosto} {transgressao.militarNome}</p>
                      <p className="text-sm text-gray-600">{transgressao.tipo}</p>
                      <p className="text-xs text-gray-500">
                        {format(transgressao.data, 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        transgressao.natureza === 'Leve' ? 'bg-yellow-100 text-yellow-800' :
                        transgressao.natureza === 'Média' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {transgressao.natureza}
                      </Badge>
                      <Badge variant="outline">
                        {transgressao.diasPunicao} dias
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sindicancias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status das Sindicâncias</CardTitle>
              <CardDescription>
                Visão geral das sindicâncias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{estatisticas?.sindicanciasEmAndamento}</p>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {sindicancias.filter(s => s.status === 'Concluída').length}
                  </p>
                  <p className="text-sm text-gray-600">Concluídas</p>
                </div>
              </div>

              <div className="space-y-3">
                {sindicancias
                  .filter(s => s.status === 'Em Andamento')
                  .slice(0, 5)
                  .map(sindicancia => {
                    const diasRestantes = Math.ceil(
                      (sindicancia.dataLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const critico = diasRestantes <= 5;

                    return (
                      <div key={sindicancia.id} className={`p-3 border rounded-lg ${critico ? 'border-red-500' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{sindicancia.tipo} Nº {sindicancia.numero}</p>
                            <p className="text-sm text-gray-600">{sindicancia.assunto}</p>
                            <p className="text-xs text-gray-500">
                              Encarregado: {sindicancia.encarregadoPosto} {sindicancia.encarregadoNome}
                            </p>
                          </div>
                          <Badge className={critico ? 'bg-red-100 text-red-800' : ''}>
                            {diasRestantes} dias restantes
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exportar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatórios</CardTitle>
              <CardDescription>
                Gere relatórios em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Relatório de Comportamento</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Relatório completo com a situação disciplinar de todos os militares
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => exportarRelatorio('comportamento-pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportarRelatorio('comportamento-excel')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Relatório de Transgressões</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Histórico detalhado de todas as transgressões do período selecionado
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => exportarRelatorio('transgressoes-pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportarRelatorio('transgressoes-excel')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Relatório de Sindicâncias</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Status e distribuição de todas as sindicâncias
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => exportarRelatorio('sindicancias-pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportarRelatorio('sindicancias-excel')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Relatório Gerencial</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Relatório consolidado com todas as informações do sistema
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => exportarRelatorio('gerencial-pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportarRelatorio('gerencial-excel')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}