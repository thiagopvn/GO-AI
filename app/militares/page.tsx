'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
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
  User,
  Calendar,
  Shield,
  FileText,
  AlertCircle,
  Edit,
  Loader2,
  Trash2,
  MoreVertical,
  Edit2
} from 'lucide-react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Militar, Patente, ComportamentoMilitar, isPraca, Transgressao, ProcessoDisciplinar } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ComportamentoService } from '@/lib/services/comportamento.service';

enum ClassificacaoComportamento {
  EXCEPCIONAL = 'EXCEPCIONAL',
  OTIMO = 'ÓTIMO',
  BOM = 'BOM',
  INSUFICIENTE = 'INSUFICIENTE',
  MAU = 'MAU'
}

// Função para calcular comportamento baseado em punições (mesma lógica de /comportamento)
const calcularComportamento = (punicoes: ProcessoDisciplinar[], dataInclusao: Date): {
  classificacao: ClassificacaoComportamento;
  detalhes: string;
} => {
  const agora = new Date();

  // Converter punições para equivalente em prisões
  const converterParaPrisoes = (punicao: ProcessoDisciplinar): number => {
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
  const calcularTotal = (punicoesJanela: ProcessoDisciplinar[]) => {
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

export default function MilitaresPage() {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilitar, setSelectedMilitar] = useState<Militar | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [militarToDelete, setMilitarToDelete] = useState<Militar | null>(null);
  const [transgressoes, setTransgressoes] = useState<Transgressao[]>([]);
  const [processos, setProcessos] = useState<ProcessoDisciplinar[]>([]);
  const [todosProcessos, setTodosProcessos] = useState<ProcessoDisciplinar[]>([]);

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
        comportamento = ComportamentoService.getComportamentoInicial({ patente: formData.patente as Patente });
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
      // Verificar se há transgressões ou processos vinculados
      const transgressoesQuery = query(
        collection(firestore, 'transgressoes'),
        where('militarId', '==', militarToDelete.id)
      );

      const processosQuery = query(
        collection(firestore, 'processos'),
        where('militarId', '==', militarToDelete.id)
      );

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
      unidade: militar.unidade,
      dataInclusao: format(militar.dataInclusao, 'yyyy-MM-dd'),
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

  // Calcular comportamento de um militar usando a lógica de /comportamento
  const getComportamentoMilitar = (militar: Militar) => {
    // Se não for praça, não tem comportamento
    if (!isPraca(militar.patente)) {
      return null;
    }

    // Buscar processos com punição aplicada para este militar
    const punicoesMilitar = todosProcessos.filter(p => p.militarId === militar.id);

    // Calcular comportamento
    return calcularComportamento(punicoesMilitar, militar.dataInclusao);
  };

  // Filtrar militares (excluir inativos)
  const filteredMilitares = militares.filter(
    (militar) =>
      (militar.ativo !== false) && (
        militar.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        militar.matricula.includes(searchTerm) ||
        militar.patente.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, RG ou patente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Militares */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMilitares.map((militar, index) => (
            <motion.div
              key={militar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
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
            </motion.div>
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
                        {format(selectedMilitar.dataInclusao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    {isPraca(selectedMilitar.patente) && (() => {
                      const comportamentoCalculado = getComportamentoMilitar(selectedMilitar);
                      return comportamentoCalculado ? (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Comportamento</p>
                          <div className="mt-1 flex flex-col gap-1">
                            {renderComportamentoBadge(comportamentoCalculado.classificacao)}
                            <p className="text-xs text-gray-500 mt-1">{comportamentoCalculado.detalhes}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
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
                              <Badge variant={processo.status === 'FINALIZADO' ? 'secondary' : 'default'}>
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
    </div>
  );
}