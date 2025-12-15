'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShieldX
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Militar, ProcessoDisciplinar, ComportamentoMilitar, isPraca } from '@/types';
import { ComportamentoService } from '@/lib/services/ComportamentoService';
import { toast } from 'sonner';

// Lazy load componentes pesados
const ScrollArea = dynamic(() => import('@/components/ui/scroll-area').then(mod => ({ default: mod.ScrollArea })));

export default function ComportamentoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [processos, setProcessos] = useState<ProcessoDisciplinar[]>([]);
  const [selectedMilitar, setSelectedMilitar] = useState<Militar | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comportamentoDetalhes, setComportamentoDetalhes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar todos os militares
      const militaresSnapshot = await getDocs(collection(db, 'militares'));
      const militaresData = militaresSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataInclusao: data.dataInclusao?.toDate?.() || data.dataInclusao,
          comportamento: data.comportamento || null, // Garantir que o campo comportamento seja incluído
        };
      }) as Militar[];

      // Buscar todos os processos finalizados com punição
      const processosQuery = query(
        collection(db, 'processos'),
        where('status', '==', 'Finalizado'),
        where('decisao', '==', 'Punição Aplicada'),
        orderBy('dataFechamento', 'desc')
      );

      const processosSnapshot = await getDocs(processosQuery);
      const processosData = processosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataFechamento: data.dataFechamento?.toDate?.() || data.dataFechamento,
          dataAbertura: data.dataAbertura?.toDate?.() || data.dataAbertura
        };
      }) as ProcessoDisciplinar[];

      setMilitares(militaresData);
      setProcessos(processosData);

      // Log para debug
      const pracasDebug = militaresData.filter(m => isPraca(m.patente));
      console.log('Militares carregados:', militaresData.length);
      console.log('Praças:', pracasDebug.length);
      console.log('Amostra de comportamentos:', pracasDebug.slice(0, 5).map(m => ({
        nome: m.nome,
        comportamento: m.comportamento
      })));

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Recalcular comportamento de todos os praças
  const handleRecalcularTodos = async () => {
    setRefreshing(true);
    try {
      const pracasParaAtualizar = militares.filter(m => isPraca(m.patente));
      let atualizados = 0;
      let erros = 0;

      for (const militar of pracasParaAtualizar) {
        if (militar.dataInclusao) {
          try {
            await ComportamentoService.calcularEAtualizarComportamento(militar.id);
            atualizados++;
          } catch (err) {
            console.error(`Erro ao atualizar militar ${militar.nome}:`, err);
            erros++;
          }
        }
      }

      if (atualizados > 0) {
        toast.success(`Comportamento de ${atualizados} militares atualizado!`);
      }

      if (erros > 0) {
        toast.warning(`${erros} militares não puderam ser atualizados`);
      }

      // Recarregar dados para atualizar a interface
      await carregarDados();
    } catch (error) {
      console.error('Erro ao recalcular comportamentos:', error);
      toast.error('Erro ao recalcular comportamentos');
    } finally {
      setRefreshing(false);
    }
  };

  // Obter detalhes do cálculo de comportamento de um militar
  const carregarDetalhesComportamento = async (militarId: string) => {
    try {
      const detalhes = await ComportamentoService.obterDetalhesCalculo(militarId);
      setComportamentoDetalhes(detalhes);
      return detalhes;
    } catch (error) {
      console.error('Erro ao obter detalhes:', error);
      return null;
    }
  };

  // Filtrar praças
  const pracas = militares.filter(m => isPraca(m.patente));

  // Filtrar militares por busca
  const militaresFiltrados = pracas.filter(m =>
    m.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nomeCompleto?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nomeDeGuerra?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.patente?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.rg?.includes(searchQuery)
  );

  // Calcular estatísticas gerais
  const calcularEstatisticas = () => {
    const distribuicao: {[key: string]: number} = {
      'EXCEPCIONAL': 0,
      'ÓTIMO': 0,
      'BOM': 0,
      'INSUFICIENTE': 0,
      'MAU': 0,
    };

    // Contar comportamentos dos praças
    pracas.forEach(militar => {
      const comportamento = militar.comportamento;

      if (!comportamento) {
        // Se não tem comportamento definido, considerar como BOM (padrão)
        distribuicao['BOM']++;
        return;
      }

      // Normalizar o comportamento para maiúsculas para garantir compatibilidade
      const comportamentoNormalizado = comportamento.toString().toUpperCase();

      // Mapear valores possíveis
      switch (comportamentoNormalizado) {
        case 'EXCEPCIONAL':
          distribuicao['EXCEPCIONAL']++;
          break;
        case 'ÓTIMO':
        case 'OTIMO':
          distribuicao['ÓTIMO']++;
          break;
        case 'BOM':
          distribuicao['BOM']++;
          break;
        case 'INSUFICIENTE':
          distribuicao['INSUFICIENTE']++;
          break;
        case 'MAU':
          distribuicao['MAU']++;
          break;
        default:
          // Se não reconhecido, considerar como BOM
          distribuicao['BOM']++;
          break;
      }
    });

    // Log resumido para debug
    console.log(`Estatísticas: ${pracas.length} praças - Excepcional: ${distribuicao['EXCEPCIONAL']}, Ótimo: ${distribuicao['ÓTIMO']}, Bom: ${distribuicao['BOM']}, Insuficiente: ${distribuicao['INSUFICIENTE']}, Mau: ${distribuicao['MAU']}`);

    return distribuicao;
  };

  const handleSelecionarMilitar = async (militar: Militar) => {
    setSelectedMilitar(militar);
    setComportamentoDetalhes(null);
    setActiveTab('individual');

    // Carregar detalhes do comportamento
    if (militar.id) {
      await carregarDetalhesComportamento(militar.id);
    }
  };

  // Renderizar badge de comportamento
  const renderComportamentoBadge = (classificacao: string | ComportamentoMilitar | null | undefined) => {
    if (!classificacao) return <Badge variant="outline">Não definido</Badge>;

    const cores: { [key: string]: string } = {
      'EXCEPCIONAL': 'bg-emerald-500 text-white',
      'ÓTIMO': 'bg-blue-500 text-white',
      'BOM': 'bg-green-500 text-white',
      'INSUFICIENTE': 'bg-yellow-500 text-white',
      'MAU': 'bg-red-500 text-white',
    };

    return (
      <Badge className={cores[classificacao.toString()] || 'bg-gray-500 text-white'}>
        {classificacao}
      </Badge>
    );
  };

  // Obter ícone do comportamento
  const getComportamentoIcon = (classificacao: string | null | undefined) => {
    switch (classificacao) {
      case 'EXCEPCIONAL':
        return <ShieldCheck className="h-5 w-5 text-emerald-500" />;
      case 'ÓTIMO':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'BOM':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'INSUFICIENTE':
        return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case 'MAU':
        return <ShieldX className="h-5 w-5 text-red-500" />;
      default:
        return <ShieldOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const estatisticas = calcularEstatisticas();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Comportamento</h1>
          <p className="text-muted-foreground">
            Sistema de classificação comportamental dos militares
          </p>
        </div>
        <Button
          onClick={handleRecalcularTodos}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Recalcular Todos
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="lista">Lista de Militares</TabsTrigger>
          <TabsTrigger value="individual" disabled={!selectedMilitar}>
            Análise Individual
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(estatisticas).map(([classificacao, quantidade]) => (
              <Card key={classificacao}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {classificacao}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quantidade as number}</div>
                  <div className="text-xs text-muted-foreground">
                    {pracas.length > 0
                      ? `${(((quantidade as number) / pracas.length) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </div>
                  <div className="mt-2">
                    {getComportamentoIcon(classificacao)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Card de Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Geral</CardTitle>
              <CardDescription>
                Análise do comportamento de {pracas.length} praças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de Praças</span>
                  <span className="font-semibold">{pracas.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processos Punitivos</span>
                  <span className="font-semibold">{processos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precisam Atenção</span>
                  <span className="font-semibold text-red-500">
                    {(estatisticas['INSUFICIENTE'] || 0) + (estatisticas['MAU'] || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lista de Militares Tab */}
        <TabsContent value="lista" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, patente ou RG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Militares ({militaresFiltrados.length})</CardTitle>
              <CardDescription>
                Clique em um militar para ver análise detalhada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {militaresFiltrados.map((militar) => (
                    <Card
                      key={militar.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelecionarMilitar(militar)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {militar.patente} {militar.nomeDeGuerra || militar.nome}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              RG: {militar.rg} | Unidade: {militar.unidade}
                            </p>
                            {militar.dataInclusao && (
                              <p className="text-xs text-muted-foreground">
                                Inclusão: {new Date(militar.dataInclusao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getComportamentoIcon(militar.comportamento)}
                            {renderComportamentoBadge(militar.comportamento)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise Individual Tab */}
        <TabsContent value="individual" className="space-y-6">
          {selectedMilitar && (
            <>
              {/* Informações do Militar */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {selectedMilitar.patente} {selectedMilitar.nomeDeGuerra || selectedMilitar.nome}
                      </CardTitle>
                      <CardDescription>
                        RG: {selectedMilitar.rg} | Unidade: {selectedMilitar.unidade}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await ComportamentoService.calcularEAtualizarComportamento(selectedMilitar.id);
                          await carregarDetalhesComportamento(selectedMilitar.id);
                          await carregarDados();
                          toast.success('Comportamento atualizado!');
                        } catch {
                          toast.error('Erro ao atualizar comportamento');
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recalcular
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {comportamentoDetalhes ? (
                    <div className="space-y-4">
                      {/* Dados do Militar */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Informações do Militar</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Data de Inclusão:</span>
                            <span className="ml-2 font-medium">
                              {comportamentoDetalhes.dadosMilitar?.dataInclusao
                                ? new Date(comportamentoDetalhes.dadosMilitar.dataInclusao).toLocaleDateString('pt-BR')
                                : 'Não informada'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tempo de Serviço:</span>
                            <span className="ml-2 font-medium">
                              {comportamentoDetalhes.dadosMilitar?.tempoServicoAnos?.toFixed(1) || '0'} anos
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Comportamento Atual */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">Comportamento Atual</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {getComportamentoIcon(comportamentoDetalhes.comportamentoCalculado)}
                          {renderComportamentoBadge(comportamentoDetalhes.comportamentoCalculado)}
                        </div>
                      </div>

                      {/* Análise por Janela de Tempo */}
                      <div>
                        <h3 className="font-semibold mb-3">Análise por Período</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs">Últimos 8 Anos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {typeof comportamentoDetalhes.detalhes.punicoes8Anos === 'number'
                                  ? comportamentoDetalhes.detalhes.punicoes8Anos
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {typeof comportamentoDetalhes.detalhes.punicoes8Anos === 'string'
                                  ? comportamentoDetalhes.detalhes.punicoes8Anos
                                  : 'punições'}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs">Últimos 4 Anos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {typeof comportamentoDetalhes.detalhes.punicoes4Anos.total === 'number'
                                  ? comportamentoDetalhes.detalhes.punicoes4Anos.total
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {typeof comportamentoDetalhes.detalhes.punicoes4Anos.total === 'string'
                                  ? comportamentoDetalhes.detalhes.punicoes4Anos.total
                                  : `${comportamentoDetalhes.detalhes.punicoes4Anos.detencoesEquivalentes} det. equiv.`}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs">Últimos 2 Anos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {typeof comportamentoDetalhes.detalhes.punicoes2Anos.total === 'number'
                                  ? comportamentoDetalhes.detalhes.punicoes2Anos.total
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {typeof comportamentoDetalhes.detalhes.punicoes2Anos.total === 'string'
                                  ? comportamentoDetalhes.detalhes.punicoes2Anos.total
                                  : `${comportamentoDetalhes.detalhes.punicoes2Anos.prisoesEquivalentes} prisões equiv.`}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs">Último Ano</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {typeof comportamentoDetalhes.detalhes.punicoes1Ano.total === 'number'
                                  ? comportamentoDetalhes.detalhes.punicoes1Ano.total
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {typeof comportamentoDetalhes.detalhes.punicoes1Ano.total === 'string'
                                  ? comportamentoDetalhes.detalhes.punicoes1Ano.total
                                  : `${comportamentoDetalhes.detalhes.punicoes1Ano.prisoesEquivalentes} prisões equiv.`}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Histórico de Punições */}
                      {comportamentoDetalhes.detalhes.processos.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Histórico de Punições</h3>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {comportamentoDetalhes.detalhes.processos.map((processo: ProcessoDisciplinar) => (
                              <Card key={processo.id}>
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-sm">{processo.numero || 'Processo s/n'}</p>
                                      <p className="text-xs text-muted-foreground">{processo.motivo}</p>
                                      <p className="text-xs mt-1">
                                        Fechamento: {processo.dataFechamento
                                          ? new Date(processo.dataFechamento).toLocaleDateString('pt-BR')
                                          : 'Não informado'}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {processo.tipoPunicao}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explicação das Regras */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              Regras de Classificação
                            </p>
                            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                              <li>• <strong>Excepcional:</strong> 8 anos sem punições (requer 8+ anos de serviço)</li>
                              <li>• <strong>Ótimo:</strong> Máx. 1 detenção em 4 anos (requer 4+ anos de serviço)</li>
                              <li>• <strong>Bom:</strong> Menos de 2 prisões equiv. no último ano (comportamento inicial)</li>
                              <li>• <strong>Insuficiente:</strong> Exatamente 2 prisões equiv. no último ano</li>
                              <li>• <strong>Mau:</strong> Mais de 2 prisões equiv. no último ano</li>
                            </ul>
                            <p className="mt-2 text-xs">
                              Conversões: 2 repreensões = 1 detenção | 2 detenções = 1 prisão
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando detalhes do comportamento...
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}