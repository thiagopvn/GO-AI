'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  FileText,
  Download,
  FileDown,
  Calendar,
  AlertCircle,
  Loader2,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { ref, set, increment } from 'firebase/database';
import { db, realtimeDB } from '@/lib/firebase/config';
import {
  ProcessoDisciplinar,
  StatusProcesso,
  TipoProcesso,
  Militar,
  Transgressao,
  TipoPunicao
} from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DocumentService } from '@/lib/services/document.service';
import { ComportamentoService } from '@/lib/services/comportamento.service';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { ITENS_TIPIFICACAO } from '@/lib/constants/tipificacao';
import { ConcluirPadModal, ConclusaoPadData } from '@/components/modals/ConcluirPadModal';
import { EditarPunicaoModal } from '@/components/modals/EditarPunicaoModal';
import { PADService } from '@/lib/services/PADService';
import { useAuth } from '@/contexts/AuthContext';

export default function ProcessosPage() {
  const { user } = useAuth();
  const padService = new PADService();
  const [processos, setProcessos] = useState<ProcessoDisciplinar[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingPAD, setIsGeneratingPAD] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConcluirModalOpen, setIsConcluirModalOpen] = useState(false);
  const [isEditarPunicaoModalOpen, setIsEditarPunicaoModalOpen] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoDisciplinar | null>(null);
  const [isConcluindo, setIsConcluindo] = useState(false);
  const [isEditandoPunicao, setIsEditandoPunicao] = useState(false);

  // Form state para novo PAD - CORRIGIDO: campos de ACUSAÇÃO, não de punição
  const [formData, setFormData] = useState({
    numeroPAD: '',
    militarId: '',
    dataTransgressao: '',
    descricaoFato: '',
    itemTipificacao: '',
    observacoes: ''
  });

  // Conclusão do PAD será gerenciada pelo ConcluirPadModal

  // Carregar processos
  useEffect(() => {
    const q = query(
      collection(db, 'processos'),
      where('tipo', '==', TipoProcesso.PAD),
      orderBy('dataAbertura', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dataAbertura: doc.data().dataAbertura?.toDate() || new Date(),
        dataFechamento: doc.data().dataFechamento?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ProcessoDisciplinar[];

      setProcessos(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar militares
  useEffect(() => {
    const loadMilitares = async () => {
      const q = query(collection(db, 'militares'), orderBy('nome'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dataInclusao: doc.data().dataInclusao?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Militar[];
      setMilitares(data);
    };

    loadMilitares();
  }, []);

  // Função para baixar documento com nome correto
  const downloadDocumento = async (url: string, numeroPad: string, tipoDoc: string = 'PAD') => {
    try {
      // Criar nome do arquivo baseado no número do PAD
      const nomeArquivo = `${tipoDoc}_${numeroPad.replace(/\//g, '-')}.docx`;

      // Abrir em nova aba para download
      // O Firebase Storage já envia o header correto para forçar download
      window.open(url, '_blank');

      // Informar o usuário sobre o nome do arquivo
      toast.info(`Baixando arquivo: ${nomeArquivo}`);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar o documento');
    }
  };

  // Função para buscar e baixar documento Despacho
  const downloadDespacho = async (processo: ProcessoDisciplinar) => {
    try {
      if (!processo.padId) {
        toast.error('Documento Despacho não encontrado');
        return;
      }

      // Buscar o PAD para obter a URL do documento Despacho
      const pad = await padService.buscarPorId(processo.padId);
      if (!pad || !pad.documentoUrl) {
        toast.error('Documento Despacho não disponível');
        return;
      }

      // Baixar o documento
      downloadDocumento(pad.documentoUrl, processo.numero, 'DESPACHO');
    } catch (error) {
      console.error('Erro ao baixar Despacho:', error);
      toast.error('Erro ao baixar o documento Despacho');
    }
  };

  // Verificar reincidência
  const verificarReincidencia = async (militarId: string): Promise<boolean> => {
    const q = query(
      collection(db, 'transgressoes'),
      where('militarId', '==', militarId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size > 0;
  };

  // Gerar número do PAD
  const gerarNumeroPAD = () => {
    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999) + 1;
    return `${ano}${mes}${String(random).padStart(4, '0')}`;
  };

  // Emitir PAD - CORRIGIDO para novo fluxo de ACUSAÇÃO
  const handleEmitirPAD = async () => {
    try {
      setIsGeneratingPAD(true);

      // Validações
      if (!formData.numeroPAD || !formData.militarId || !formData.dataTransgressao ||
          !formData.descricaoFato || !formData.itemTipificacao) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Buscar dados do militar
      const militarDoc = await getDoc(doc(db, 'militares', formData.militarId));
      if (!militarDoc.exists()) {
        toast.error('Militar não encontrado');
        return;
      }

      const militar = {
        id: militarDoc.id,
        ...militarDoc.data(),
        dataInclusao: militarDoc.data().dataInclusao?.toDate() || new Date(),
        createdAt: militarDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: militarDoc.data().updatedAt?.toDate() || new Date()
      } as Militar;

      // Verificar reincidência
      const reincidente = await verificarReincidencia(formData.militarId);
      if (reincidente) {
        toast.warning('Militar é REINCIDENTE! Notificação enviada.');
      }

      // Usar o número informado pelo usuário diretamente
      // Criar processo PAD (sem punição definida ainda - apenas acusação)
      const processo: Partial<ProcessoDisciplinar> = {
        tipo: TipoProcesso.PAD,
        numero: formData.numeroPAD,
        militarId: formData.militarId,
        militarNome: militar.nomeCompleto || militar.nome,
        militarPosto: militar.postoGraduacao || militar.patente,
        dataAbertura: new Date(),
        status: StatusProcesso.EM_ANDAMENTO,
        motivo: formData.descricaoFato,
        observacoes: formData.observacoes,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      const processoRef = await addDoc(collection(db, 'processos'), processo);

      // Preparar dados completos para geração do documento
      const processoCompleto = {
        ...processo,
        id: processoRef.id,
        dataAbertura: new Date()
      } as ProcessoDisciplinar;

      // Gerar documento .docx com o novo formato
      const { PADNovoService } = await import('@/lib/services/pad-novo.service');
      const blob = await PADNovoService.gerarDocumentoPAD(
        processoCompleto,
        militar,
        {
          descricaoFato: formData.descricaoFato,
          itemTipificacao: parseInt(formData.itemTipificacao),
          dataTransgressao: new Date(formData.dataTransgressao)
        }
      );

      // Salvar documento no Firebase Storage
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase/config');

      // Criar nome do arquivo baseado no número do PAD (removendo caracteres especiais)
      const nomeArquivo = formData.numeroPAD.replace(/\//g, '-');
      const docRef = storageRef(storage, `pads/${nomeArquivo}.docx`);
      await uploadBytes(docRef, blob);
      const documentUrl = await getDownloadURL(docRef);

      // Atualizar processo com URL do documento
      await updateDoc(processoRef, {
        documentoUrl: documentUrl
      });

      // Atualizar estatísticas no Realtime Database
      const statsRef = ref(realtimeDB, 'dashboard/stats');
      await set(statsRef, {
        padsEmAndamento: increment(1)
      });

      if (reincidente) {
        await set(ref(realtimeDB, 'dashboard/stats/totalReincidentes'), increment(1));
      }

      toast.success('PAD emitido com sucesso! Documento gerado.');
      setIsAddModalOpen(false);
      resetForm();

    } catch (error) {
      console.error('Erro ao emitir PAD:', error);
      toast.error('Erro ao emitir PAD: ' + (error as Error).message);
    } finally {
      setIsGeneratingPAD(false);
    }
  };

  // Função auxiliar para remover campos undefined
  const removeUndefinedFields = (obj: any): any => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
  };

  // Concluir PAD com novo modal e geração de documento Despacho
  const handleConcluirPAD = async (data: ConclusaoPadData) => {
    try {
      if (!selectedProcesso || !user) return;

      setIsConcluindo(true);

      // Buscar informações do comandante (usuário logado)
      // Para fins de demonstração, vamos usar dados padrão
      const comandanteInfo = {
        nome: user.displayName || 'Vinícius Novaes Bonelá',
        posto: 'Ten Cel BM',
        rg: '31.288',
        funcao: 'Comandante do GOCG',
        uid: user.uid
      };

      // Criar o PAD na coleção 'pads' com o novo serviço
      const padData = {
        numeroProcesso: selectedProcesso.numero,
        militarId: selectedProcesso.militarId,
        militarNome: selectedProcesso.militarNome,
        militarPosto: selectedProcesso.militarPosto,
        dataAbertura: selectedProcesso.dataAbertura,
        status: 'em_andamento' as const,
        descricao: selectedProcesso.motivo,
        criadoPor: user.uid
      };

      // Criar o PAD se ainda não existir
      let padId = selectedProcesso.padId;
      if (!padId) {
        padId = await padService.criar(padData);
        // Atualizar o processo com o ID do PAD
        await updateDoc(doc(db, 'processos', selectedProcesso.id), { padId });
      }

      // Concluir o PAD com o serviço, que vai gerar o documento Despacho
      await padService.concluir(padId, data, comandanteInfo);

      // Atualizar o processo original
      const processoRef = doc(db, 'processos', selectedProcesso.id);
      const updateData: any = {
        status: StatusProcesso.FINALIZADO,
        dataFechamento: new Date(),
        decisao: data.decisao === 'justificar' ? 'Justificado'
               : data.decisao === 'justificar_parte' ? 'Justificado em Parte'
               : 'Punição Aplicada',
        updatedAt: serverTimestamp()
      };

      // Se houver punição, adicionar campos de punição ao processo
      if (data.decisao === 'punir') {
        updateData.tipoPunicao = data.tipoPunicao;
        updateData.classificacao = data.classificacao;
        updateData.diasPunicao = data.diasPunicao || 0;
        updateData.dataInicioPunicao = data.dataInicioPunicao || null;
        updateData.atenuantes = data.atenuantes || [];
        updateData.agravantes = data.agravantes || [];
      }

      await updateDoc(processoRef, updateData);

      // Se houver punição, atualizar comportamento do militar
      if (data.decisao === 'punir' && selectedProcesso.militarId) {
        const militar = militares.find(m => m.id === selectedProcesso.militarId);
        if (militar) {
          await ComportamentoService.atualizarComportamentoDoMilitar(militar);
        }
      }

      // Atualizar estatísticas
      const statsRef = ref(realtimeDB, 'dashboard/stats');
      await set(statsRef, {
        padsEmAndamento: increment(-1),
        padsFinalizados: increment(1)
      });

      const mensagem = data.decisao === 'punir'
        ? 'PAD concluído com punição aplicada! Documento Despacho gerado.'
        : data.decisao === 'justificar'
        ? 'PAD concluído - transgressão justificada! Documento Despacho gerado.'
        : 'PAD concluído - transgressão justificada em parte! Documento Despacho gerado.';

      toast.success(mensagem);
      setIsConcluirModalOpen(false);
      setSelectedProcesso(null);

    } catch (error) {
      console.error('Erro ao concluir PAD:', error);
      toast.error('Erro ao concluir PAD');
      throw error;
    } finally {
      setIsConcluindo(false);
    }
  };

  // Editar punição após conclusão
  const handleEditarPunicao = async (diasPunicao: number, dataInicioPunicao: Date) => {
    try {
      if (!selectedProcesso || !selectedProcesso.padId) return;

      setIsEditandoPunicao(true);

      // Atualizar punição no PAD
      await padService.editarPunicao(selectedProcesso.padId, diasPunicao, dataInicioPunicao);

      // Atualizar o processo local
      await updateDoc(doc(db, 'processos', selectedProcesso.id), {
        diasPunicao,
        dataInicioPunicao,
        updatedAt: serverTimestamp()
      });

      toast.success('Punição atualizada com sucesso!');
      setIsEditarPunicaoModalOpen(false);
      setSelectedProcesso(null);

    } catch (error) {
      console.error('Erro ao editar punição:', error);
      toast.error('Erro ao editar punição');
    } finally {
      setIsEditandoPunicao(false);
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      numeroPAD: '',
      militarId: '',
      dataTransgressao: '',
      descricaoFato: '',
      itemTipificacao: '',
      observacoes: ''
    });
  };

  // Filtrar processos
  const processosFiltrados = processos.filter(processo => {
    const matchesSearch = processo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         processo.motivo.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === 'todos') return matchesSearch;
    if (selectedTab === 'andamento') return matchesSearch && processo.status === StatusProcesso.EM_ANDAMENTO;
    if (selectedTab === 'finalizado') return matchesSearch && processo.status === StatusProcesso.FINALIZADO;

    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processos Administrativos Disciplinares</h1>
          <p className="text-gray-600 mt-2">
            Gestão e emissão de PADs
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Emitir PAD
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Emitir Processo Administrativo Disciplinar</DialogTitle>
              <DialogDescription>
                Preencha os dados da ACUSAÇÃO para gerar o PAD. O militar terá 5 dias úteis para defesa.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="grid gap-4 py-4 px-1">
                <div className="grid gap-2">
                  <Label htmlFor="numeroPAD">Número Completo do PAD *</Label>
                  <Input
                    id="numeroPAD"
                    value={formData.numeroPAD}
                    onChange={(e) => setFormData({ ...formData, numeroPAD: e.target.value })}
                    placeholder="Ex: CBMERJ/GOCG/PAD/00001/2025"
                  />
                  <p className="text-xs text-gray-500">
                    Digite o número completo do PAD que será usado no documento.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="militar">Militar *</Label>
                  <Combobox
                    options={militares.map((militar): ComboboxOption => ({
                      value: militar.id,
                      label: `${militar.patente || militar.postoGraduacao || ''} ${militar.nome || militar.nomeCompleto} - RG: ${militar.matricula}`,
                      searchableText: `${militar.patente || militar.postoGraduacao || ''} ${militar.nome || militar.nomeCompleto} ${militar.matricula} ${militar.nomeGuerra || ''}`
                    }))}
                    value={formData.militarId}
                    onChange={(value) => setFormData({ ...formData, militarId: value })}
                    placeholder="Selecione o militar"
                    searchPlaceholder="Buscar por nome, matrícula ou posto..."
                    emptyMessage="Nenhum militar encontrado."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataTransgressao">Data da Transgressão *</Label>
                  <Input
                    id="dataTransgressao"
                    type="date"
                    value={formData.dataTransgressao}
                    onChange={(e) => setFormData({ ...formData, dataTransgressao: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricaoFato">Descrição Detalhada do Fato *</Label>
                  <Textarea
                    id="descricaoFato"
                    value={formData.descricaoFato}
                    onChange={(e) => setFormData({ ...formData, descricaoFato: e.target.value })}
                    placeholder="Descreva detalhadamente o fato que constitui a transgressão..."
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    Este texto será inserido na peça acusatória do PAD.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="itemTipificacao">Item da Tipificação (Anexo I - RDCBMERJ) *</Label>
                  <Combobox
                    options={ITENS_TIPIFICACAO.map((item): ComboboxOption => ({
                      value: item.id.toString(),
                      label: `${item.id}. ${item.text}`,
                      searchableText: `${item.id} ${item.text}`
                    }))}
                    value={formData.itemTipificacao}
                    onChange={(value) => setFormData({ ...formData, itemTipificacao: value })}
                    placeholder="Selecione o item de tipificação"
                    searchPlaceholder="Buscar por número ou descrição..."
                    emptyMessage="Nenhum item encontrado."
                  />
                  {formData.itemTipificacao && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Item Selecionado:</p>
                      <p className="text-sm text-blue-800">
                        {ITENS_TIPIFICACAO.find(item => item.id.toString() === formData.itemTipificacao)?.text}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="observacoes">Observações Adicionais (Opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Anotações internas que não aparecerão no documento..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEmitirPAD}
                className="bg-red-600 hover:bg-red-700"
                disabled={isGeneratingPAD}
              >
                {isGeneratingPAD ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PAD...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar PAD
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search e Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="andamento">Em Andamento</TabsTrigger>
            <TabsTrigger value="finalizado">Finalizados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Processos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : processosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum processo encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processosFiltrados.map((processo, index) => (
            <motion.div
              key={processo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        PAD Nº {processo.numero}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Aberto em {format(processo.dataAbertura, "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant={
                      processo.status === StatusProcesso.EM_ANDAMENTO ? 'default' :
                      processo.status === StatusProcesso.FINALIZADO ? 'secondary' :
                      'destructive'
                    }>
                      {processo.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{processo.motivo}</p>

                  <div className="flex flex-wrap gap-2">
                    {processo.documentoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocumento(processo.documentoUrl!, processo.numero)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PAD
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProcesso(processo);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>

                    {processo.status === StatusProcesso.EM_ANDAMENTO && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedProcesso(processo);
                          setIsConcluirModalOpen(true);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir PAD
                      </Button>
                    )}

                    {processo.status === StatusProcesso.FINALIZADO && processo.decisao && (
                      <>
                        <Badge variant={processo.decisao.includes('Punição') ? 'destructive' : 'secondary'}>
                          {processo.decisao}
                        </Badge>

                        {/* Botão para baixar Despacho (Solução) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDespacho(processo)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          title="Baixar documento Despacho com a solução do PAD"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Baixar Despacho
                        </Button>

                        {(processo.decisao.includes('Punição') || processo.tipoPunicao) && (processo.tipoPunicao === 'detencao' || processo.tipoPunicao === 'prisao') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProcesso(processo);
                              setIsEditarPunicaoModalOpen(true);
                            }}
                            title="Editar dias e data de início da punição"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Punição
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Visualização do PAD */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do PAD</DialogTitle>
            <DialogDescription>
              Visualização completa do Processo Administrativo Disciplinar
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número do PAD</p>
                    <p className="mt-1 font-semibold">{selectedProcesso.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className="mt-1" variant={
                      selectedProcesso.status === StatusProcesso.EM_ANDAMENTO ? 'default' :
                      selectedProcesso.status === StatusProcesso.FINALIZADO ? 'secondary' : 'destructive'
                    }>
                      {selectedProcesso.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Militar</p>
                  <p className="mt-1">{selectedProcesso.militarPosto} {selectedProcesso.militarNome}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Abertura</p>
                  <p className="mt-1">{format(selectedProcesso.dataAbertura, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>

                {selectedProcesso.dataFechamento && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Conclusão</p>
                    <p className="mt-1">{format(selectedProcesso.dataFechamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Descrição do Fato (Acusação)</p>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{selectedProcesso.motivo}</p>
                </div>

                {selectedProcesso.decisao && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Decisão</p>
                    <p className="mt-1 font-semibold">{selectedProcesso.decisao}</p>
                  </div>
                )}

                {selectedProcesso.tipoPunicao && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Punição</p>
                      <p className="mt-1">{selectedProcesso.tipoPunicao}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dias de Punição</p>
                      <p className="mt-1">{selectedProcesso.diasPunicao} dias</p>
                    </div>
                  </div>
                )}

                {selectedProcesso.justificativa && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Justificativa</p>
                    <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{selectedProcesso.justificativa}</p>
                  </div>
                )}

                {selectedProcesso.observacoes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Observações</p>
                    <p className="mt-1 text-sm text-gray-600">{selectedProcesso.observacoes}</p>
                  </div>
                )}

                {selectedProcesso.documentoUrl && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadDocumento(selectedProcesso.documentoUrl!, selectedProcesso.numero)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Documento PAD
                    </Button>
                  </div>
                )}

                {selectedProcesso.status === StatusProcesso.FINALIZADO && selectedProcesso.decisao && (
                  <div>
                    <Button
                      variant="outline"
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => downloadDespacho(selectedProcesso)}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Baixar Despacho (Solução)
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Conclusão do PAD - Novo Modal Dinâmico */}
      <ConcluirPadModal
        isOpen={isConcluirModalOpen}
        onClose={() => {
          setIsConcluirModalOpen(false);
          setSelectedProcesso(null);
        }}
        onSubmit={handleConcluirPAD}
        processoId={selectedProcesso?.numero || ''}
        isLoading={isConcluindo}
      />

      {/* Modal de Edição de Punição */}
      <EditarPunicaoModal
        isOpen={isEditarPunicaoModalOpen}
        onClose={() => {
          setIsEditarPunicaoModalOpen(false);
          setSelectedProcesso(null);
        }}
        onSubmit={handleEditarPunicao}
        diasPunicaoAtual={selectedProcesso?.diasPunicao || 0}
        dataInicioPunicaoAtual={selectedProcesso?.dataInicioPunicao || new Date()}
        isLoading={isEditandoPunicao}
      />
    </div>
  );
}