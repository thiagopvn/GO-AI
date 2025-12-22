'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  User,
  FileText,
  Loader2,
  Trash2,
  MoreVertical,
  Edit2,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  History
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
  where
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Militar, Patente, isPraca, Transgressao, ProcessoDisciplinar, StatusProcesso, TipoProcesso } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComportamentoService } from '@/lib/services/ComportamentoService';
import { useAuth } from '@/contexts/AuthContext';
import { LancarPunicaoAntigaModal, PunicaoAntigaData } from '@/components/modals/LancarPunicaoAntigaModal';
import { Timestamp } from 'firebase/firestore';

// Lazy load componentes pesados - só carrega quando necessário
const Tabs = dynamic(() => import('@/components/ui/tabs').then(mod => ({ default: mod.Tabs })));
const TabsContent = dynamic(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsContent })));
const TabsList = dynamic(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsList })));
const TabsTrigger = dynamic(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsTrigger })));
const AlertDialog = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialog })));
const AlertDialogAction = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogAction })));
const AlertDialogCancel = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogCancel })));
const AlertDialogContent = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogContent })));
const AlertDialogDescription = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogDescription })));
const AlertDialogFooter = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogFooter })));
const AlertDialogHeader = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogHeader })));
const AlertDialogTitle = dynamic(() => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialogTitle })));
const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })));
const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogContent })));
const DialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogDescription })));
const DialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogFooter })));
const DialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogHeader })));
const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTitle })));
const DialogTrigger = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTrigger })));
const Select = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.Select })));
const SelectContent = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectContent })));
const SelectGroup = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectGroup })));
const SelectItem = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectItem })));
const SelectLabel = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectLabel })));
const SelectSeparator = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectSeparator })));
const SelectTrigger = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectTrigger })));
const SelectValue = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectValue })));
const Textarea = dynamic(() => import('@/components/ui/textarea').then(mod => ({ default: mod.Textarea })));
const ScrollArea = dynamic(() => import('@/components/ui/scroll-area').then(mod => ({ default: mod.ScrollArea })));

enum ClassificacaoComportamento {
  EXCEPCIONAL = 'EXCEPCIONAL',
  OTIMO = 'ÓTIMO',
  BOM = 'BOM',
  INSUFICIENTE = 'INSUFICIENTE',
  MAU = 'MAU'
}

// Agrupamento de patentes para o filtro
const PATENTES_OFICIAIS = [
  Patente.CORONEL,
  Patente.TENENTE_CORONEL,
  Patente.MAJOR,
  Patente.CAPITAO,
  Patente.PRIMEIRO_TENENTE,
  Patente.SEGUNDO_TENENTE,
  Patente.ASPIRANTE
];

const PATENTES_PRACAS = [
  Patente.SUBTENENTE,
  Patente.PRIMEIRO_SARGENTO,
  Patente.SEGUNDO_SARGENTO,
  Patente.TERCEIRO_SARGENTO,
  Patente.CABO,
  Patente.SOLDADO
];

// Remover função de cálculo local - agora usamos ComportamentoService

export default function MilitaresPage() {
  const { user } = useAuth();
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patenteFilter, setPatenteFilter] = useState<string>('todas');
  const [selectedMilitar, setSelectedMilitar] = useState<Militar | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [militarToDelete, setMilitarToDelete] = useState<Militar | null>(null);
  const [transgressoes, setTransgressoes] = useState<Transgressao[]>([]);
  const [processos, setProcessos] = useState<ProcessoDisciplinar[]>([]);
  const [, setTodosProcessos] = useState<ProcessoDisciplinar[]>([]);

  // Estados para o modal de lançar punição antiga
  const [isLancarPunicaoModalOpen, setIsLancarPunicaoModalOpen] = useState(false);
  const [militarParaPunicao, setMilitarParaPunicao] = useState<Militar | null>(null);
  const [isLancandoPunicao, setIsLancandoPunicao] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    nomeDeGuerra: '',
    patente: '',
    rg: '',
    unidade: '',
    dataInclusao: '',
    observacoes: ''
  });

  // Carregar militares
  useEffect(() => {
    const q = query(collection(firestore, 'militares'), orderBy('nome'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dataInclusao: doc.data().dataInclusao?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Militar[];

      setMilitares(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar todos os processos para cálculo de comportamento
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
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ProcessoDisciplinar[];

      setTodosProcessos(data);
    });

    return () => unsubscribe();
  }, []);

  // Carregar dados do militar selecionado
  useEffect(() => {
    if (!selectedMilitar) return;

    // Buscar transgressões
    const transgressoesQuery = query(
      collection(firestore, 'transgressoes'),
      where('militarId', '==', selectedMilitar.id),
      orderBy('data', 'desc')
    );

    const unsubscribeTransgressoes = onSnapshot(transgressoesQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Transgressao[];
      setTransgressoes(data);
    });

    // Buscar processos
    const processosQuery = query(
      collection(firestore, 'processos'),
      where('militarId', '==', selectedMilitar.id),
      orderBy('dataAbertura', 'desc')
    );

    const unsubscribeProcessos = onSnapshot(processosQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dataAbertura: doc.data().dataAbertura.toDate(),
        dataFechamento: doc.data().dataFechamento?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as ProcessoDisciplinar[];
      setProcessos(data);
    });

    return () => {
      unsubscribeTransgressoes();
      unsubscribeProcessos();
    };
  }, [selectedMilitar]);

  // Adicionar militar
  const handleAddMilitar = async () => {
    try {
      if (!formData.nome || !formData.nomeDeGuerra || !formData.patente || !formData.rg || !formData.unidade || !formData.dataInclusao) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const dataInclusao = new Date(formData.dataInclusao);
      const comportamentoInicial = ComportamentoService.getComportamentoInicial({ patente: formData.patente as Patente });

      await addDoc(collection(firestore, 'militares'), {
        nome: formData.nome,
        nomeCompleto: formData.nome, // Alias para compatibilidade
        nomeDeGuerra: formData.nomeDeGuerra,
        patente: formData.patente,
        postoGraduacao: formData.patente, // Alias para compatibilidade
        rg: formData.rg,
        matricula: formData.rg, // Mantém para compatibilidade com código existente
        unidade: formData.unidade,
        dataInclusao,
        comportamento: comportamentoInicial,
        observacoes: formData.observacoes || '',
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Militar cadastrado com sucesso!');
      setIsAddModalOpen(false);
      setFormData({
        nome: '',
        nomeDeGuerra: '',
        patente: '',
        rg: '',
        unidade: '',
        dataInclusao: '',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar militar:', error);
      toast.error('Erro ao cadastrar militar');
    }
  };

  // Editar militar
  const handleEditMilitar = async () => {
    if (!selectedMilitar) return;

    try {
      if (!formData.nome || !formData.nomeDeGuerra || !formData.patente || !formData.rg || !formData.unidade || !formData.dataInclusao) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const dataInclusao = new Date(formData.dataInclusao);

      // Recalcular comportamento se a patente mudou
      let comportamento = selectedMilitar.comportamento;
      if (formData.patente !== selectedMilitar.patente) {
        comportamento = ComportamentoService.getComportamentoInicial({ patente: formData.patente as Patente }) || undefined;
      }

      await updateDoc(doc(firestore, 'militares', selectedMilitar.id), {
        nome: formData.nome,
        nomeCompleto: formData.nome,
        nomeDeGuerra: formData.nomeDeGuerra,
        patente: formData.patente,
        postoGraduacao: formData.patente,
        rg: formData.rg,
        matricula: formData.rg,
        unidade: formData.unidade,
        dataInclusao,
        comportamento,
        observacoes: formData.observacoes || '',
        updatedAt: serverTimestamp()
      });

      toast.success('Militar atualizado com sucesso!');
      setIsEditModalOpen(false);
      setFormData({
        nome: '',
        nomeDeGuerra: '',
        patente: '',
        rg: '',
        unidade: '',
        dataInclusao: '',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao atualizar militar:', error);
      toast.error('Erro ao atualizar militar');
    }
  };

  // Excluir militar
  const handleDeleteMilitar = async () => {
    if (!militarToDelete) return;

    try {
      // Por segurança, podemos apenas desativar o militar ao invés de excluir
      await updateDoc(doc(firestore, 'militares', militarToDelete.id), {
        ativo: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Militar removido com sucesso!');
      setIsDeleteDialogOpen(false);
      setMilitarToDelete(null);
    } catch (error) {
      console.error('Erro ao remover militar:', error);
      toast.error('Erro ao remover militar');
    }
  };

  // Abrir modal de edição
  const openEditModal = (militar: Militar) => {
    setSelectedMilitar(militar);
    setFormData({
      nome: militar.nome,
      nomeDeGuerra: militar.nomeDeGuerra || '',
      patente: militar.patente,
      rg: militar.rg || militar.matricula,
      unidade: militar.unidade || '',
      dataInclusao: militar.dataInclusao ? format(militar.dataInclusao, 'yyyy-MM-dd') : '',
      observacoes: militar.observacoes || ''
    });
    setIsEditModalOpen(true);
  };

  // Atualizar observações
  const handleUpdateObservacoes = async (observacoes: string) => {
    if (!selectedMilitar) return;

    try {
      await updateDoc(doc(firestore, 'militares', selectedMilitar.id), {
        observacoes,
        updatedAt: serverTimestamp()
      });
      toast.success('Observações atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      toast.error('Erro ao atualizar observações');
    }
  };

  // Obter comportamento do militar (usa o valor salvo no Firestore)
  const getComportamentoMilitar = (militar: Militar) => {
    // Se não for praça, não tem comportamento
    if (!isPraca(militar.patente)) {
      return null;
    }

    // Retornar o comportamento salvo no banco
    return militar.comportamento ? {
      classificacao: militar.comportamento,
      detalhes: 'Comportamento calculado pelo sistema'
    } : null;
  };

  // Recalcular comportamento de um militar específico
  const handleRecalcularComportamento = async (militarId: string) => {
    try {
      const novoComportamento = await ComportamentoService.calcularEAtualizarComportamento(militarId);

      if (novoComportamento) {
        toast.success('Comportamento atualizado com sucesso!');
        // Os dados serão atualizados automaticamente pelo listener do Firebase
      } else {
        toast.info('Este militar não possui classificação de comportamento');
      }
    } catch (error) {
      console.error('Erro ao recalcular comportamento:', error);
      toast.error('Erro ao recalcular comportamento');
    }
  };

  // Lançar punição antiga do sistema DGP
  const handleLancarPunicaoAntiga = async (data: PunicaoAntigaData) => {
    try {
      setIsLancandoPunicao(true);

      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Gerar número do processo para registro interno
      const dataFormatada = format(data.dataPunicao, 'ddMMyyyy');
      const numeroProcesso = `DGP/HISTORICO/${dataFormatada}/${data.militarId.substring(0, 6)}`;

      // Mapear tipo de punição para o formato esperado
      const tipoPunicaoMap: Record<string, string> = {
        'repreensao': 'Repreensão',
        'detencao': 'Detenção',
        'prisao': 'Prisão'
      };

      // 1. Criar registro na coleção 'processos' (usado pelo ComportamentoService)
      const processoData = {
        tipo: TipoProcesso.PAD,
        numero: numeroProcesso,
        militarId: data.militarId,
        militarNome: data.militarNome,
        militarPosto: data.militarPosto,
        dataAbertura: Timestamp.fromDate(data.dataPunicao),
        dataFechamento: Timestamp.fromDate(data.dataPunicao),
        status: StatusProcesso.FINALIZADO,
        decisao: 'Punição Aplicada',
        motivo: data.descricao,
        tipoPunicao: tipoPunicaoMap[data.tipoPunicao],
        diasPunicao: data.diasPunicao || 0,
        dataInicioPunicao: data.dataInicioPunicao ? Timestamp.fromDate(data.dataInicioPunicao) : null,
        observacoes: data.observacoes || 'Punição lançada do sistema DGP',
        origemDGP: true, // Marcador para identificar que veio do DGP
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid
      };

      const processoRef = await addDoc(collection(firestore, 'processos'), processoData);

      // 2. Criar registro na coleção 'pads' para manter consistência
      const padData = {
        numeroProcesso: numeroProcesso,
        militarId: data.militarId,
        militarNome: data.militarNome,
        militarPosto: data.militarPosto,
        dataAbertura: Timestamp.fromDate(data.dataPunicao),
        dataConclusao: Timestamp.fromDate(data.dataPunicao),
        status: 'finalizado',
        descricao: data.descricao,
        decisao: 'punir',
        tipoPunicao: data.tipoPunicao,
        diasPunicao: data.diasPunicao || 0,
        dataInicioPunicao: data.dataInicioPunicao ? Timestamp.fromDate(data.dataInicioPunicao) : null,
        observacoes: data.observacoes || 'Punição lançada do sistema DGP',
        origemDGP: true,
        criadoPor: user.uid,
        concluidoPor: user.uid,
        atualizadoEm: serverTimestamp()
      };

      const padRef = await addDoc(collection(firestore, 'pads'), padData);

      // 3. Atualizar o processo com referência ao PAD
      await updateDoc(doc(firestore, 'processos', processoRef.id), {
        padId: padRef.id
      });

      // 4. Criar registro na coleção 'transgressoes' para histórico
      const transgressaoData = {
        militarId: data.militarId,
        militarNome: data.militarNome,
        militarPosto: data.militarPosto,
        padId: padRef.id,
        numeroProcesso: numeroProcesso,
        data: Timestamp.fromDate(data.dataPunicao),
        descricao: data.descricao,
        tipoPunicao: tipoPunicaoMap[data.tipoPunicao],
        diasPunicao: data.diasPunicao || 0,
        dataInicioPunicao: data.dataInicioPunicao ? Timestamp.fromDate(data.dataInicioPunicao) : null,
        observacoes: data.observacoes || 'Punição lançada do sistema DGP',
        origemDGP: true,
        criadoPor: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(firestore, 'transgressoes'), transgressaoData);

      // 5. Recalcular comportamento do militar
      await ComportamentoService.calcularEAtualizarComportamento(data.militarId);

      toast.success('Punição lançada com sucesso! Comportamento atualizado.');
      setIsLancarPunicaoModalOpen(false);
      setMilitarParaPunicao(null);

    } catch (error) {
      console.error('Erro ao lançar punição:', error);
      toast.error('Erro ao lançar punição: ' + (error as Error).message);
    } finally {
      setIsLancandoPunicao(false);
    }
  };

  // Abrir modal de lançar punição
  const openLancarPunicaoModal = (militar: Militar) => {
    setMilitarParaPunicao(militar);
    setIsLancarPunicaoModalOpen(true);
  };

  // Contar militares por patente para exibir no filtro
  const contagemPorPatente = militares.reduce((acc, militar) => {
    const patente = militar.patente;
    acc[patente] = (acc[patente] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtrar militares por busca e patente
  const filteredMilitares = militares.filter((militar) => {
    const matchSearch =
      militar.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      militar.matricula.includes(searchTerm) ||
      militar.patente.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPatente =
      patenteFilter === 'todas' ||
      patenteFilter === 'oficiais' && PATENTES_OFICIAIS.includes(militar.patente as Patente) ||
      patenteFilter === 'pracas' && PATENTES_PRACAS.includes(militar.patente as Patente) ||
      militar.patente === patenteFilter;

    return matchSearch && matchPatente;
  });

  // Limpar filtro de patente
  const handleClearFilter = () => {
    setPatenteFilter('todas');
  };

  // Renderizar badge de comportamento
  const renderComportamentoBadge = (classificacao: ClassificacaoComportamento | string | undefined) => {
    if (!classificacao) return null;

    const cores = {
      'EXCEPCIONAL': 'bg-emerald-500 text-white',
      'ÓTIMO': 'bg-blue-500 text-white',
      'BOM': 'bg-green-500 text-white',
      'INSUFICIENTE': 'bg-yellow-500 text-white',
      'MAU': 'bg-red-500 text-white',
    };

    const classeCor = cores[classificacao as keyof typeof cores] || 'bg-gray-500 text-white';

    return (
      <Badge className={classeCor}>
        {classificacao}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Militares</h1>
          <p className="text-gray-600 mt-2">
            Gerenciamento de militares e suas fichas disciplinares
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Militar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Militar</DialogTitle>
              <DialogDescription>
                Preencha os dados do militar para cadastrá-lo no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Richard Rolim da Silva"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nomeDeGuerra">Nome de Guerra *</Label>
                <Input
                  id="nomeDeGuerra"
                  value={formData.nomeDeGuerra}
                  onChange={(e) => setFormData({ ...formData, nomeDeGuerra: e.target.value })}
                  placeholder="Ex: Richard"
                />
                <p className="text-xs text-gray-500">
                  Nome pelo qual o militar é conhecido. Será destacado em negrito nos documentos oficiais.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="patente">Patente *</Label>
                <Select
                  value={formData.patente}
                  onValueChange={(value) => setFormData({ ...formData, patente: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a patente" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Patente).map((patente) => (
                      <SelectItem key={patente} value={patente}>
                        {patente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rg">RG *</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="Ex: 2200478"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade *</Label>
                <Input
                  id="unidade"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  placeholder="Ex: 1º GBM - Humaitá"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataInclusao">Data de Inclusão *</Label>
                <Input
                  id="dataInclusao"
                  type="date"
                  value={formData.dataInclusao}
                  onChange={(e) => setFormData({ ...formData, dataInclusao: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMilitar} className="bg-red-600 hover:bg-red-700">
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Campo de busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, RG ou patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por Patente/Graduação */}
        <div className="flex items-center gap-2">
          <Select value={patenteFilter} onValueChange={setPatenteFilter}>
            <SelectTrigger className="w-[220px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Filtrar por patente" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">
                <span className="flex items-center justify-between w-full">
                  Todas as patentes
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {militares.length}
                  </Badge>
                </span>
              </SelectItem>

              <SelectSeparator />

              {/* Grupos de Patentes */}
              <SelectItem value="oficiais">
                <span className="flex items-center justify-between w-full font-medium text-blue-600">
                  Oficiais
                  <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-600">
                    {militares.filter(m => PATENTES_OFICIAIS.includes(m.patente as Patente)).length}
                  </Badge>
                </span>
              </SelectItem>
              <SelectItem value="pracas">
                <span className="flex items-center justify-between w-full font-medium text-green-600">
                  Praças
                  <Badge variant="outline" className="ml-2 text-xs border-green-200 text-green-600">
                    {militares.filter(m => PATENTES_PRACAS.includes(m.patente as Patente)).length}
                  </Badge>
                </span>
              </SelectItem>

              <SelectSeparator />

              {/* Oficiais */}
              <SelectGroup>
                <SelectLabel className="font-semibold text-blue-700">Oficiais</SelectLabel>
                {PATENTES_OFICIAIS.map((patente) => (
                  <SelectItem key={patente} value={patente}>
                    <span className="flex items-center justify-between w-full">
                      {patente}
                      {contagemPorPatente[patente] > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {contagemPorPatente[patente]}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectSeparator />

              {/* Praças */}
              <SelectGroup>
                <SelectLabel className="font-semibold text-green-700">Praças</SelectLabel>
                {PATENTES_PRACAS.map((patente) => (
                  <SelectItem key={patente} value={patente}>
                    <span className="flex items-center justify-between w-full">
                      {patente}
                      {contagemPorPatente[patente] > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {contagemPorPatente[patente]}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Botão para limpar filtro */}
          {patenteFilter !== 'todas' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFilter}
              className="h-9 w-9 text-gray-500 hover:text-gray-700"
              title="Limpar filtro"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Indicador de filtro ativo */}
      {patenteFilter !== 'todas' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 px-3 py-1">
            <Filter className="h-3 w-3 mr-1" />
            Filtrado por: {patenteFilter === 'oficiais' ? 'Oficiais' : patenteFilter === 'pracas' ? 'Praças' : patenteFilter}
          </Badge>
          <span className="text-sm text-gray-500">
            {filteredMilitares.length} {filteredMilitares.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      )}

      {/* Lista de Militares */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMilitares.map((militar) => (
            <Card key={militar.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedMilitar(militar);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <CardTitle className="text-lg">{militar.nome}</CardTitle>
                    {militar.nomeDeGuerra && (
                      <p className="text-sm font-medium text-gray-700">&quot;{militar.nomeDeGuerra}&quot;</p>
                    )}
                    <CardDescription>
                      {militar.patente} - RG: {militar.rg || militar.matricula}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMilitar(militar);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEditModal(militar)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {isPraca(militar.patente) && (
                        <DropdownMenuItem
                          className="text-orange-600"
                          onClick={() => openLancarPunicaoModal(militar)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Lancar Punicao DGP
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setMilitarToDelete(militar);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{militar.unidade}</p>
                  {isPraca(militar.patente) && (() => {
                    const comportamentoCalculado = getComportamentoMilitar(militar);
                    return comportamentoCalculado ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Comportamento:</span>
                        {renderComportamentoBadge(comportamentoCalculado.classificacao)}
                      </div>
                    ) : null;
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ficha do Militar</DialogTitle>
          </DialogHeader>
          {selectedMilitar && (
            <Tabs defaultValue="geral" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="observacoes">Observações</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="mt-1">{selectedMilitar.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome de Guerra</p>
                      <p className="mt-1">{selectedMilitar.nomeDeGuerra || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patente</p>
                      <p className="mt-1">{selectedMilitar.patente}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">RG</p>
                      <p className="mt-1">{selectedMilitar.rg || selectedMilitar.matricula}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Unidade</p>
                      <p className="mt-1">{selectedMilitar.unidade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Inclusão</p>
                      <p className="mt-1">
                        {selectedMilitar.dataInclusao
                          ? format(selectedMilitar.dataInclusao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : 'Não informado'}
                      </p>
                    </div>
                    {isPraca(selectedMilitar.patente) && (() => {
                      const comportamentoCalculado = getComportamentoMilitar(selectedMilitar);
                      return comportamentoCalculado ? (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Comportamento</p>
                          <div className="mt-1 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {renderComportamentoBadge(comportamentoCalculado.classificacao)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecalcularComportamento(selectedMilitar.id)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recalcular
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">{comportamentoCalculado.detalhes}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Botão para lançar punição - apenas para praças */}
                  {isPraca(selectedMilitar.patente) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          openLancarPunicaoModal(selectedMilitar);
                        }}
                      >
                        <History className="mr-2 h-4 w-4" />
                        Lancar Punicao do Sistema DGP
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historico">
                <ScrollArea className="h-[400px]">
                  {transgressoes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma transgressão registrada
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transgressoes.map((transgressao) => (
                        <Card key={transgressao.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {transgressao.tipoPunicao} - {transgressao.diasPunicao} dias
                                </CardTitle>
                                <CardDescription>
                                  {format(transgressao.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </CardDescription>
                              </div>
                              {transgressao.reincidente && (
                                <Badge variant="destructive">REINCIDENTE</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{transgressao.descricao}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Art. {transgressao.artigo} do RDCBMERJ
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="documentos">
                <ScrollArea className="h-[400px]">
                  {processos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum documento registrado
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {processos.map((processo) => (
                        <Card key={processo.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {processo.tipo} Nº {processo.numero}
                                </CardTitle>
                                <CardDescription>
                                  Aberto em {format(processo.dataAbertura, "dd/MM/yyyy", { locale: ptBR })}
                                </CardDescription>
                              </div>
                              <Badge variant={processo.status === StatusProcesso.FINALIZADO ? 'secondary' : 'default'}>
                                {processo.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          {processo.documentoUrl && (
                            <CardContent>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(processo.documentoUrl, '_blank')}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Baixar Documento
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="observacoes">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Adicione observações sobre este militar..."
                    defaultValue={selectedMilitar.observacoes || ''}
                    rows={10}
                    onBlur={(e) => handleUpdateObservacoes(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    As observações são salvas automaticamente ao sair do campo.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Militar</DialogTitle>
            <DialogDescription>
              Atualize os dados do militar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome Completo *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Richard Rolim da Silva"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-nomeDeGuerra">Nome de Guerra *</Label>
              <Input
                id="edit-nomeDeGuerra"
                value={formData.nomeDeGuerra}
                onChange={(e) => setFormData({ ...formData, nomeDeGuerra: e.target.value })}
                placeholder="Ex: Richard"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-patente">Patente *</Label>
              <Select
                value={formData.patente}
                onValueChange={(value) => setFormData({ ...formData, patente: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a patente" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Patente).map((patente) => (
                    <SelectItem key={patente} value={patente}>
                      {patente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-rg">RG *</Label>
              <Input
                id="edit-rg"
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                placeholder="Ex: 2200478"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-unidade">Unidade *</Label>
              <Input
                id="edit-unidade"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                placeholder="Ex: 1º GBM - Humaitá"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-dataInclusao">Data de Inclusão *</Label>
              <Input
                id="edit-dataInclusao"
                type="date"
                value={formData.dataInclusao}
                onChange={(e) => setFormData({ ...formData, dataInclusao: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMilitar} className="bg-red-600 hover:bg-red-700">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o militar{' '}
              <span className="font-semibold">{militarToDelete?.nome}</span>?
              Esta ação não pode ser desfeita. O militar será marcado como inativo no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMilitarToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMilitar}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Lançar Punição Antiga do DGP */}
      <LancarPunicaoAntigaModal
        isOpen={isLancarPunicaoModalOpen}
        onClose={() => {
          setIsLancarPunicaoModalOpen(false);
          setMilitarParaPunicao(null);
        }}
        onSubmit={handleLancarPunicaoAntiga}
        militares={militares}
        militarPreSelecionado={militarParaPunicao}
        isLoading={isLancandoPunicao}
      />
    </div>
  );
}