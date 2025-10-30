'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  UserCheck,
  History,
  Search,
  Settings,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { firestore } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos
interface Militar {
  id: string;
  nome: string;
  nomeCompleto: string;
  nomeDeGuerra: string;
  patente: string;
  postoGraduacao: string;
  rg: string;
  unidade: string;
  dataInclusao: Date;
  ativo?: boolean;
}

interface Processo {
  id: string;
  militarId: string;
  militarNome: string;
  militarPosto: string;
  tipoPunicao: string;
  diasPunicao: number;
  classificacao: string;
  dataAbertura: Date;
  dataFechamento?: Date;
  decisao: string;
  status: string;
}

enum ClassificacaoComportamento {
  EXCEPCIONAL = 'EXCEPCIONAL',
  OTIMO = 'ÓTIMO',
  BOM = 'BOM',
  INSUFICIENTE = 'INSUFICIENTE',
  MAU = 'MAU'
}

// Função para calcular comportamento baseado em punições
const calcularComportamento = (punicoes: Processo[], dataInclusao: Date): {
  classificacao: ClassificacaoComportamento;
  detalhes: string;
} => {
  const agora = new Date();

  // Converter punições para equivalente em prisões
  const converterParaPrisoes = (punicao: Processo): number => {
    const tipo = punicao.tipoPunicao?.toLowerCase() || '';
    const dias = punicao.diasPunicao || 0;

    if (tipo.includes('prisao') || tipo.includes('prisão')) {
      return dias;
    } else if (tipo.includes('detencao') || tipo.includes('detenção')) {
      return dias / 2; // 2 detenções = 1 prisão
    } else if (tipo.includes('repreensao') || tipo.includes('repreensão')) {
      return dias / 4; // 4 repreensões = 1 prisão
    }
    return 0;
  };

  // Filtrar punições por janela de tempo
  const filtrarPorJanela = (anos: number) => {
    const dataLimite = new Date(agora);
    dataLimite.setFullYear(dataLimite.getFullYear() - anos);

    return punicoes.filter(p => {
      const dataRef = p.dataFechamento || p.dataAbertura;
      return dataRef >= dataLimite;
    });
  };

  // Calcular total de punições equivalentes em prisões
  const calcularTotal = (punicoesJanela: Processo[]) => {
    return punicoesJanela.reduce((total, p) => total + converterParaPrisoes(p), 0);
  };

  // Verificar classificação EXCEPCIONAL (8 anos sem punições)
  const punicoes8Anos = filtrarPorJanela(8);
  if (punicoes8Anos.length === 0) {
    return {
      classificacao: ClassificacaoComportamento.EXCEPCIONAL,
      detalhes: 'Sem punições nos últimos 8 anos'
    };
  }

  // Verificar classificação ÓTIMO (4 anos com até 1 detenção)
  const punicoes4Anos = filtrarPorJanela(4);
  const total4Anos = calcularTotal(punicoes4Anos);
  if (total4Anos <= 0.5) { // Até 1 detenção (0.5 prisão)
    return {
      classificacao: ClassificacaoComportamento.OTIMO,
      detalhes: `${total4Anos.toFixed(1)} prisão(ões) equivalente(s) nos últimos 4 anos`
    };
  }

  // Verificar classificação BOM (2 anos com até 2 prisões)
  const punicoes2Anos = filtrarPorJanela(2);
  const total2Anos = calcularTotal(punicoes2Anos);
  if (total2Anos <= 2) {
    return {
      classificacao: ClassificacaoComportamento.BOM,
      detalhes: `${total2Anos.toFixed(1)} prisão(ões) equivalente(s) nos últimos 2 anos`
    };
  }

  // Verificar classificação INSUFICIENTE vs MAU (1 ano)
  const punicoes1Ano = filtrarPorJanela(1);
  const total1Ano = calcularTotal(punicoes1Ano);

  if (total1Ano <= 2) {
    return {
      classificacao: ClassificacaoComportamento.INSUFICIENTE,
      detalhes: `${total1Ano.toFixed(1)} prisão(ões) equivalente(s) no último ano`
    };
  } else {
    return {
      classificacao: ClassificacaoComportamento.MAU,
      detalhes: `${total1Ano.toFixed(1)} prisão(ões) equivalente(s) no último ano (acima de 2)`
    };
  }
};

// Verificar se é praça (tem classificação de comportamento)
const isPraca = (patente: string): boolean => {
  const pracas = ['soldado', 'cabo', 'terceiro sargento', '3º sargento',
                  'segundo sargento', '2º sargento', 'primeiro sargento',
                  '1º sargento', 'subtenente'];
  return pracas.some(p => patente.toLowerCase().includes(p.toLowerCase()));
};

export default function ComportamentoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedMilitar, setSelectedMilitar] = useState<Militar | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar militares do Firebase
  useEffect(() => {
    const militaresRef = collection(firestore, 'militares');
    const q = query(militaresRef, where('ativo', '!=', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataInclusao: doc.data().dataInclusao?.toDate() || new Date(),
      })) as Militar[];

      setMilitares(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar processos do Firebase
  useEffect(() => {
    const processosRef = collection(firestore, 'processos');
    const q = query(
      processosRef,
      where('decisao', '==', 'Punição Aplicada')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataAbertura: doc.data().dataAbertura?.toDate() || new Date(),
        dataFechamento: doc.data().dataFechamento?.toDate(),
      })) as Processo[];

      setProcessos(data);
    });

    return () => unsubscribe();
  }, []);

  // Filtrar apenas praças
  const pracas = militares.filter(m => isPraca(m.patente));

  // Filtrar militares baseado na busca
  const militaresFiltrados = pracas.filter(
    m => (m.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.nomeCompleto?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.nomeDeGuerra?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.patente?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.rg?.includes(searchQuery))
  );

  // Calcular comportamento de um militar
  const getComportamentoMilitar = (militar: Militar) => {
    const punicoesMilitar = processos.filter(p => p.militarId === militar.id);
    return calcularComportamento(punicoesMilitar, militar.dataInclusao);
  };

  // Calcular estatísticas gerais
  const calcularEstatisticas = () => {
    const distribuicao = {
      [ClassificacaoComportamento.EXCEPCIONAL]: 0,
      [ClassificacaoComportamento.OTIMO]: 0,
      [ClassificacaoComportamento.BOM]: 0,
      [ClassificacaoComportamento.INSUFICIENTE]: 0,
      [ClassificacaoComportamento.MAU]: 0,
    };

    pracas.forEach(militar => {
      const { classificacao } = getComportamentoMilitar(militar);
      distribuicao[classificacao]++;
    });

    return distribuicao;
  };

  const handleSelecionarMilitar = (militar: Militar) => {
    setSelectedMilitar(militar);
    setActiveTab('individual');
  };

  // Renderizar badge de comportamento
  const renderComportamentoBadge = (classificacao: ClassificacaoComportamento) => {
    const cores = {
      [ClassificacaoComportamento.EXCEPCIONAL]: 'bg-emerald-500 text-white',
      [ClassificacaoComportamento.OTIMO]: 'bg-blue-500 text-white',
      [ClassificacaoComportamento.BOM]: 'bg-green-500 text-white',
      [ClassificacaoComportamento.INSUFICIENTE]: 'bg-yellow-500 text-white',
      [ClassificacaoComportamento.MAU]: 'bg-red-500 text-white',
    };

    return (
      <Badge className={cores[classificacao]}>
        {classificacao}
      </Badge>
    );
  };

  const distribuicao = calcularEstatisticas();
  const totalComAtencao = distribuicao[ClassificacaoComportamento.INSUFICIENTE] +
                          distribuicao[ClassificacaoComportamento.MAU];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Sistema de Classificação de Comportamento
        </h1>
        <p className="text-muted-foreground">
          Gestão automatizada baseada no Regulamento Disciplinar do CBMERJ
        </p>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Sistema de Classificação Automática Ativo
            </p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Cálculo automático baseado em processos finalizados com punição</li>
              <li>• Melhoria automática por decurso de tempo</li>
              <li>• Aplicável exclusivamente para Praças (Sd ao SubTen)</li>
              <li>• Baseado no Art. 52 e 55 do RDCBMERJ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="consultar" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Consultar
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Individual
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Total de Praças</CardTitle>
                      <UserCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pracas.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Com classificação de comportamento
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Bom ou Melhor</CardTitle>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {pracas.length > 0
                        ? ((distribuicao[ClassificacaoComportamento.EXCEPCIONAL] +
                            distribuicao[ClassificacaoComportamento.OTIMO] +
                            distribuicao[ClassificacaoComportamento.BOM]) / pracas.length * 100).toFixed(1)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Excelente indicador
                    </p>
                  </CardContent>
                </Card>

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
              </div>

              {/* Distribuição por classificação */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Classificação</CardTitle>
                  <CardDescription>
                    Quantidade de militares em cada nível de comportamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(distribuicao).map(([classificacao, quantidade]) => {
                      const percentual = pracas.length > 0 ? (quantidade / pracas.length) * 100 : 0;
                      return (
                        <div key={classificacao} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderComportamentoBadge(classificacao as ClassificacaoComportamento)}
                              <span className="text-sm font-medium">{quantidade} militares</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {percentual.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab: Consultar */}
        <TabsContent value="consultar" className="space-y-6">
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, RG ou patente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de militares */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {militaresFiltrados.map((militar) => {
                  const { classificacao, detalhes } = getComportamentoMilitar(militar);
                  const punicoesMilitar = processos.filter(p => p.militarId === militar.id);

                  return (
                    <Card
                      key={militar.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleSelecionarMilitar(militar)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {militar.nomeDeGuerra || militar.nome}
                            </CardTitle>
                            <CardDescription>
                              {militar.patente} - RG: {militar.rg}
                            </CardDescription>
                          </div>
                          {renderComportamentoBadge(classificacao)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{militar.unidade}</p>
                          <p className="text-xs text-muted-foreground">{detalhes}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Punições registradas: <strong>{punicoesMilitar.length}</strong>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {militaresFiltrados.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma praça encontrada</p>
                <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Individual */}
        <TabsContent value="individual" className="space-y-6">
          {selectedMilitar ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Comportamento de {selectedMilitar.nomeDeGuerra || selectedMilitar.nome}
                </h3>
                <p className="text-muted-foreground">
                  {selectedMilitar.patente} - {selectedMilitar.unidade}
                </p>
              </div>

              {(() => {
                const { classificacao, detalhes } = getComportamentoMilitar(selectedMilitar);
                const punicoesMilitar = processos.filter(p => p.militarId === selectedMilitar.id);

                return (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Classificação Atual</CardTitle>
                          {renderComportamentoBadge(classificacao)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Justificativa</p>
                          <p className="mt-1">{detalhes}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Data de Inclusão</p>
                            <p className="mt-1">
                              {format(selectedMilitar.dataInclusao, "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total de Punições</p>
                            <p className="mt-1 text-2xl font-bold">{punicoesMilitar.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Histórico de Punições */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico de Punições</CardTitle>
                        <CardDescription>
                          Processos finalizados com punição aplicada
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {punicoesMilitar.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma punição registrada</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {punicoesMilitar
                              .sort((a, b) => {
                                const dataA = a.dataFechamento || a.dataAbertura;
                                const dataB = b.dataFechamento || b.dataAbertura;
                                return dataB.getTime() - dataA.getTime();
                              })
                              .map((processo) => (
                                <div
                                  key={processo.id}
                                  className="border rounded-lg p-3 space-y-2"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {processo.tipoPunicao?.toUpperCase()} - {processo.diasPunicao} dias
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(
                                          processo.dataFechamento || processo.dataAbertura,
                                          "dd 'de' MMMM 'de' yyyy",
                                          { locale: ptBR }
                                        )}
                                      </p>
                                    </div>
                                    <Badge variant="secondary">
                                      {processo.classificacao?.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Selecione um militar para ver seu comportamento</p>
              <p className="text-sm mt-1">Use a aba "Consultar" para buscar militares</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
