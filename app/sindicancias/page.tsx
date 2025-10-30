'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Calendar, User, AlertCircle, ChevronRight, Clock, BarChart2, Eye, CheckCircle, XCircle, RotateCcw, Upload } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SindicanciaService } from '@/lib/services/sindicancia.service';
import { Sindicancia, DistribuicaoSindicancia, Militar } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { LoadingPage } from '@/components/ui/loading-page';

const POSTOS_OFICIAIS = [
  'Aspirante',
  '2º Tenente',
  '1º Tenente',
  'Capitão',
  'Major',
  'Tenente Coronel',
  'Coronel'
];

export default function SindicanciasPage() {
  const [sindicancias, setSindicancias] = useState<Sindicancia[]>([]);
  const [distribuicao, setDistribuicao] = useState<DistribuicaoSindicancia[]>([]);
  const [oficiais, setOficiais] = useState<Militar[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [prorrogarDialogOpen, setProrrogarDialogOpen] = useState(false);
  const [concluirDialogOpen, setConcluirDialogOpen] = useState(false);
  const [arquivarDialogOpen, setArquivarDialogOpen] = useState(false);

  const [selectedSindicancia, setSelectedSindicancia] = useState<Sindicancia | null>(null);

  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'Sindicância' as Sindicancia['tipo'],
    encarregadoId: '',
    militarInvestigadoId: '',
    assunto: '',
    dataInstauracao: format(new Date(), 'yyyy-MM-dd'),
    prazoInicial: 30,
    observacoes: ''
  });

  const [prorrogacaoData, setProrrogacaoData] = useState({
    diasProrrogacao: 30,
    motivo: ''
  });

  const [conclusaoData, setConclusaoData] = useState({
    decisao: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo para melhorar performance
      const [sindicanciasList, distribuicaoList, militaresSnapshot] = await Promise.all([
        SindicanciaService.listar().catch(err => {
          console.error('Erro ao carregar sindicâncias:', err);
          return [];
        }),
        SindicanciaService.obterDistribuicao().catch(err => {
          console.error('Erro ao carregar distribuição:', err);
          return [];
        }),
        getDocs(
          query(collection(db, 'militares'), firestoreOrderBy('nome'))
        ).catch(err => {
          console.error('Erro ao carregar militares:', err);
          return { docs: [] };
        })
      ]);

      setSindicancias(sindicanciasList);
      setDistribuicao(distribuicaoList);

      // Processar militares apenas se houver dados
      if (militaresSnapshot.docs.length > 0) {
        const militaresList = militaresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataInclusao: doc.data().dataInclusao?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Militar[];
        setMilitares(militaresList);

        // Filtrar apenas oficiais (incluindo Aspirante)
        // Verifica tanto postoGraduacao quanto patente
        const oficiaisList = militaresList.filter(m => {
          const posto = m.postoGraduacao || m.patente || '';
          const isAtivo = m.status === 'Ativo' || !m.status; // Se não tiver status, considera ativo
          return isAtivo && POSTOS_OFICIAIS.includes(posto);
        });
        setOficiais(oficiaisList);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const oficial = oficiais.find(o => o.id === formData.encarregadoId);
      if (!oficial) {
        toast.error('Selecione um oficial encarregado');
        return;
      }

      const dataInstauracao = new Date(formData.dataInstauracao);
      const dataLimite = addDays(dataInstauracao, formData.prazoInicial);

      const militarInvestigado = formData.militarInvestigadoId && formData.militarInvestigadoId !== 'none'
        ? militares.find(m => m.id === formData.militarInvestigadoId)
        : null;

      await SindicanciaService.criar({
        numero: formData.numero,
        tipo: formData.tipo,
        encarregadoId: formData.encarregadoId,
        encarregadoNome: oficial.nomeCompleto || oficial.nome,
        encarregadoPosto: oficial.postoGraduacao || oficial.patente || '',
        militarInvestigadoId: formData.militarInvestigadoId && formData.militarInvestigadoId !== 'none' ? formData.militarInvestigadoId : undefined,
        militarInvestigadoNome: militarInvestigado?.nomeCompleto || militarInvestigado?.nome,
        assunto: formData.assunto,
        dataInstauracao,
        prazoInicial: formData.prazoInicial,
        prorrogacoes: 0,
        dataLimite,
        status: 'Em Andamento',
        observacoes: formData.observacoes,
        createdBy: 'user-id' // TODO: Pegar do contexto de autenticação
      });

      toast.success('Processo investigativo instaurado com sucesso');
      setDialogOpen(false);
      carregarDados();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar processo investigativo:', error);
      toast.error('Erro ao criar processo investigativo');
    }
  };

  const handleProrrogar = async () => {
    if (!selectedSindicancia) return;

    try {
      const novaDataLimite = addDays(
        selectedSindicancia.dataLimite,
        prorrogacaoData.diasProrrogacao
      );

      await SindicanciaService.atualizar(selectedSindicancia.id, {
        dataLimite: novaDataLimite,
        prorrogacoes: selectedSindicancia.prorrogacoes + 1,
        observacoes: selectedSindicancia.observacoes
          ? `${selectedSindicancia.observacoes}\n\n[PRORROGAÇÃO ${selectedSindicancia.prorrogacoes + 1}] ${format(new Date(), 'dd/MM/yyyy')}: +${prorrogacaoData.diasProrrogacao} dias - ${prorrogacaoData.motivo}`
          : `[PRORROGAÇÃO 1] ${format(new Date(), 'dd/MM/yyyy')}: +${prorrogacaoData.diasProrrogacao} dias - ${prorrogacaoData.motivo}`
      });

      toast.success(`Prazo prorrogado por ${prorrogacaoData.diasProrrogacao} dias`);
      setProrrogarDialogOpen(false);
      setSelectedSindicancia(null);
      setProrrogacaoData({ diasProrrogacao: 30, motivo: '' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao prorrogar:', error);
      toast.error('Erro ao prorrogar sindicância');
    }
  };

  const handleConcluir = async () => {
    if (!selectedSindicancia) return;

    try {
      await SindicanciaService.atualizar(selectedSindicancia.id, {
        status: 'Concluída',
        decisao: conclusaoData.decisao,
        observacoes: selectedSindicancia.observacoes
          ? `${selectedSindicancia.observacoes}\n\n[CONCLUSÃO] ${format(new Date(), 'dd/MM/yyyy')}: ${conclusaoData.observacoes}`
          : `[CONCLUSÃO] ${format(new Date(), 'dd/MM/yyyy')}: ${conclusaoData.observacoes}`
      });

      toast.success('Sindicância concluída com sucesso');
      setConcluirDialogOpen(false);
      setSelectedSindicancia(null);
      setConclusaoData({ decisao: '', observacoes: '' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao concluir:', error);
      toast.error('Erro ao concluir sindicância');
    }
  };

  const handleArquivar = async (motivo: string) => {
    if (!selectedSindicancia) return;

    try {
      await SindicanciaService.atualizar(selectedSindicancia.id, {
        status: 'Arquivada',
        observacoes: selectedSindicancia.observacoes
          ? `${selectedSindicancia.observacoes}\n\n[ARQUIVAMENTO] ${format(new Date(), 'dd/MM/yyyy')}: ${motivo}`
          : `[ARQUIVAMENTO] ${format(new Date(), 'dd/MM/yyyy')}: ${motivo}`
      });

      toast.success('Sindicância arquivada com sucesso');
      setArquivarDialogOpen(false);
      setSelectedSindicancia(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast.error('Erro ao arquivar sindicância');
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      tipo: 'Sindicância',
      encarregadoId: '',
      militarInvestigadoId: '',
      assunto: '',
      dataInstauracao: format(new Date(), 'yyyy-MM-dd'),
      prazoInicial: 30,
      observacoes: ''
    });
  };

  const getStatusColor = (status: Sindicancia['status']) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800';
      case 'Concluída':
        return 'bg-green-100 text-green-800';
      case 'Arquivada':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calcularDiasRestantes = (dataLimite: Date) => {
    const hoje = new Date();
    const dias = Math.ceil((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return dias;
  };

  const sindicanciasFiltradas = sindicancias.filter(s =>
    s.numero.toLowerCase().includes(filtro.toLowerCase()) ||
    s.assunto.toLowerCase().includes(filtro.toLowerCase()) ||
    s.encarregadoNome.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return <LoadingPage message="Carregando sindicâncias..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">{error}</div>
        <Button onClick={carregarDados} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sindicâncias</h1>
          <p className="text-gray-600 mt-2">
            Controle e distribuição de sindicâncias e procedimentos administrativos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Processo Investigativo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Novo Processo Investigativo</DialogTitle>
                <DialogDescription>
                  Preencha os dados para instaurar um novo processo investigativo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      placeholder="Ex: 001/2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: Sindicancia['tipo']) =>
                        setFormData({...formData, tipo: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sindicância">Sindicância</SelectItem>
                        <SelectItem value="IPM">IPM</SelectItem>
                        <SelectItem value="Conselho de Disciplina">Conselho de Disciplina</SelectItem>
                        <SelectItem value="Apuratória">Apuratória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encarregado">Oficial Encarregado *</Label>
                  <Select
                    value={formData.encarregadoId}
                    onValueChange={(value) => setFormData({...formData, encarregadoId: value})}
                    required
                    disabled={distribuicao.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        distribuicao.length === 0
                          ? "Nenhum oficial disponível"
                          : "Selecione o oficial"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {distribuicao.length === 0 ? (
                        <SelectItem value="no-officials" disabled>
                          Nenhum oficial cadastrado
                        </SelectItem>
                      ) : (
                        distribuicao.map(d => (
                          <SelectItem key={d.oficialId} value={d.oficialId}>
                            <div className="flex items-center justify-between w-full">
                              <span>{d.oficialPosto} {d.oficialNome}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({d.sindicanciasEmAndamento} em andamento)
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {distribuicao.length === 0 ? (
                    <p className="text-sm text-red-600">
                      ⚠️ Cadastre oficiais (Aspirante a Coronel) na página de Militares
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {distribuicao.length} oficial(is) disponível(is) - ordenados por distribuição equitativa
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investigado">Militar Investigado/Sindicado (Opcional)</Label>
                  <Select
                    value={formData.militarInvestigadoId || 'none'}
                    onValueChange={(value) => setFormData({...formData, militarInvestigadoId: value === 'none' ? '' : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o militar (se aplicável)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {militares.map(militar => (
                        <SelectItem key={militar.id} value={militar.id}>
                          {militar.postoGraduacao || militar.patente} {militar.nomeCompleto || militar.nome} - RG: {militar.matricula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Textarea
                    id="assunto"
                    value={formData.assunto}
                    onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                    placeholder="Descrição do assunto da sindicância"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInstauracao">Data de Instauração *</Label>
                    <Input
                      id="dataInstauracao"
                      type="date"
                      value={formData.dataInstauracao}
                      onChange={(e) => setFormData({...formData, dataInstauracao: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo">Prazo Inicial (dias) *</Label>
                    <Input
                      id="prazo"
                      type="number"
                      value={formData.prazoInicial}
                      onChange={(e) => setFormData({...formData, prazoInicial: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Prazo limite: {format(addDays(new Date(formData.dataInstauracao), formData.prazoInicial), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Instaurar Processo</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sindicancias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sindicancias">
            Sindicâncias ({sindicancias.length})
          </TabsTrigger>
          <TabsTrigger value="distribuicao">
            Distribuição ({distribuicao.length} oficiais)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sindicancias" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número, assunto ou encarregado..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {sindicanciasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma sindicância encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sindicanciasFiltradas.map(sindicancia => {
                const diasRestantes = calcularDiasRestantes(sindicancia.dataLimite);
                const critico = diasRestantes <= 5 && sindicancia.status === 'Em Andamento';

                return (
                  <Card key={sindicancia.id} className={critico ? 'border-red-500' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {sindicancia.tipo} Nº {sindicancia.numero}
                            {sindicancia.prorrogacoes > 0 && (
                              <Badge variant="outline" className="ml-2">
                                {sindicancia.prorrogacoes} prorrogação(ões)
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {sindicancia.assunto}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(sindicancia.status)}>
                          {sindicancia.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">Encarregado</p>
                            <p className="text-gray-600">{sindicancia.encarregadoPosto} {sindicancia.encarregadoNome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">Instauração</p>
                            <p className="text-gray-600">
                              {format(sindicancia.dataInstauracao, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">Prazo</p>
                            <p className={`${critico ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {sindicancia.status === 'Em Andamento'
                                ? diasRestantes > 0
                                  ? `${diasRestantes} dias restantes`
                                  : `Vencido há ${Math.abs(diasRestantes)} dias`
                                : format(sindicancia.dataLimite, 'dd/MM/yyyy', { locale: ptBR })
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {sindicancia.militarInvestigadoNome && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">
                            <User className="h-4 w-4 inline mr-1" />
                            Militar Investigado: {sindicancia.militarInvestigadoNome}
                          </p>
                        </div>
                      )}

                      {critico && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {diasRestantes > 0
                              ? 'Prazo próximo do vencimento!'
                              : 'Prazo vencido! Ação urgente necessária.'}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSindicancia(sindicancia);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Button>

                        {sindicancia.status === 'Em Andamento' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSindicancia(sindicancia);
                                setProrrogarDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Prorrogar
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedSindicancia(sindicancia);
                                setConcluirDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-600"
                              onClick={() => {
                                setSelectedSindicancia(sindicancia);
                                setArquivarDialogOpen(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Arquivar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Encargos</CardTitle>
              <CardDescription>
                Distribuição equitativa de sindicâncias entre oficiais (Aspirante a Coronel)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {distribuicao.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium mb-2">Nenhum oficial cadastrado</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Para instaurar sindicâncias, é necessário cadastrar oficiais com os seguintes postos:
                  </p>
                  <div className="inline-block text-left bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Postos de Oficiais:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Aspirante</li>
                      <li>• 2º Tenente</li>
                      <li>• 1º Tenente</li>
                      <li>• Capitão</li>
                      <li>• Major</li>
                      <li>• Tenente Coronel</li>
                      <li>• Coronel</li>
                    </ul>
                  </div>
                  <div>
                    <Button onClick={() => window.location.href = '/militares'}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ir para Cadastro de Militares
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {distribuicao.map((oficial, index) => (
                  <div key={oficial.oficialId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${index === 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {oficial.oficialPosto} {oficial.oficialNome}
                          </p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>Total: {oficial.totalSindicancias}</span>
                            <span>Em andamento: {oficial.sindicanciasEmAndamento}</span>
                            {oficial.ultimaSindicancia && (
                              <span>
                                Última: {format(oficial.ultimaSindicancia, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {oficial.disponivel ? (
                          <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Ocupado</Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Próximo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {oficial.sindicanciasEmAndamento > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((oficial.sindicanciasEmAndamento / 3) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {oficial.sindicanciasEmAndamento} de 3 sindicâncias simultâneas
                        </p>
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo Investigativo</DialogTitle>
          </DialogHeader>
          {selectedSindicancia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Número</p>
                  <p className="mt-1">{selectedSindicancia.tipo} Nº {selectedSindicancia.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(selectedSindicancia.status)}`}>
                    {selectedSindicancia.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Assunto</p>
                <p className="mt-1">{selectedSindicancia.assunto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Oficial Encarregado</p>
                  <p className="mt-1">{selectedSindicancia.encarregadoPosto} {selectedSindicancia.encarregadoNome}</p>
                </div>
                {selectedSindicancia.militarInvestigadoNome && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Militar Investigado</p>
                    <p className="mt-1">{selectedSindicancia.militarInvestigadoNome}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Instauração</p>
                  <p className="mt-1">{format(selectedSindicancia.dataInstauracao, 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Prazo Limite</p>
                  <p className="mt-1">{format(selectedSindicancia.dataLimite, 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Prorrogações</p>
                  <p className="mt-1">{selectedSindicancia.prorrogacoes}</p>
                </div>
              </div>

              {selectedSindicancia.decisao && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Decisão</p>
                  <p className="mt-1">{selectedSindicancia.decisao}</p>
                </div>
              )}

              {selectedSindicancia.observacoes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Observações e Histórico</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedSindicancia.observacoes}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Prorrogação */}
      <Dialog open={prorrogarDialogOpen} onOpenChange={setProrrogarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prorrogar Prazo</DialogTitle>
            <DialogDescription>
              Conceda mais tempo para conclusão do processo investigativo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diasProrrogacao">Dias de Prorrogação *</Label>
              <Input
                id="diasProrrogacao"
                type="number"
                value={prorrogacaoData.diasProrrogacao}
                onChange={(e) => setProrrogacaoData({...prorrogacaoData, diasProrrogacao: parseInt(e.target.value)})}
                min="1"
                required
              />
              {selectedSindicancia && (
                <p className="text-sm text-gray-500">
                  Nova data limite: {format(addDays(selectedSindicancia.dataLimite, prorrogacaoData.diasProrrogacao), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivoProrrogacao">Motivo *</Label>
              <Textarea
                id="motivoProrrogacao"
                value={prorrogacaoData.motivo}
                onChange={(e) => setProrrogacaoData({...prorrogacaoData, motivo: e.target.value})}
                placeholder="Justificativa para a prorrogação"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProrrogarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProrrogar}>
              Prorrogar Prazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Conclusão */}
      <Dialog open={concluirDialogOpen} onOpenChange={setConcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Processo Investigativo</DialogTitle>
            <DialogDescription>
              Finalize o processo investigativo com a decisão tomada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decisao">Decisão *</Label>
              <Textarea
                id="decisao"
                value={conclusaoData.decisao}
                onChange={(e) => setConclusaoData({...conclusaoData, decisao: e.target.value})}
                placeholder="Decisão final da sindicância"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoesConclusao">Observações Finais</Label>
              <Textarea
                id="observacoesConclusao"
                value={conclusaoData.observacoes}
                onChange={(e) => setConclusaoData({...conclusaoData, observacoes: e.target.value})}
                placeholder="Observações sobre a conclusão"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcluirDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConcluir}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Arquivamento */}
      <Dialog open={arquivarDialogOpen} onOpenChange={setArquivarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar Processo Investigativo</DialogTitle>
            <DialogDescription>
              Arquive o processo investigativo sem conclusão formal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivoArquivamento">Motivo do Arquivamento *</Label>
              <Textarea
                id="motivoArquivamento"
                placeholder="Justificativa para o arquivamento"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArquivarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const motivo = (document.getElementById('motivoArquivamento') as HTMLTextAreaElement)?.value;
                if (motivo) handleArquivar(motivo);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
