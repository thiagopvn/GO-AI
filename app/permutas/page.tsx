'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Edit2,
  FileDown,
  Send,
  Archive,
  ArchiveRestore,
  Trash2,
  Filter,
  X,
  Download,
  ArrowUpDown,
  CheckCircle2,
  UserPlus,
  Users,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PermutaService } from '@/lib/services/PermutaService';
import { PermutaDocumentService } from '@/lib/services/PermutaDocumentService';
import { MilitarPermutaService } from '@/lib/services/MilitarPermutaService';
import { MILITARES_PERMUTAS_SEED } from '@/lib/data/militares-permutas-seed';
import {
  PermutaDoc,
  PermutaInput,
  FUNCOES_PADRAO,
  MilitarSnapshot,
  MilitarPermuta,
} from '@/types/permutas';

// ============================================================
// Helpers
// ============================================================

function formatarRG(rg: string): string {
  const rgLimpo = rg.replace(/\D/g, '');
  if (rgLimpo.length > 3) {
    return `${rgLimpo.slice(0, -3)}.${rgLimpo.slice(-3)}`;
  }
  return rgLimpo;
}

function formatarMilitarStr(snap: MilitarSnapshot): string {
  return `${snap.grad} BM ${snap.quadro} ${snap.nome}`;
}

function formatarDataPtBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ============================================================
// Types for batch form
// ============================================================

interface LinhaPermuta {
  id: string;
  data: string;
  funcao: string;
  rgEntra: string;
  rgSai: string;
  militarEntra: MilitarSnapshot | null;
  militarSai: MilitarSnapshot | null;
  loadingEntra: boolean;
  loadingSai: boolean;
  erroEntra: string;
  erroSai: string;
}

function criarLinhaVazia(): LinhaPermuta {
  return {
    id: crypto.randomUUID(),
    data: '',
    funcao: '1º SOCORRO',
    rgEntra: '',
    rgSai: '',
    militarEntra: null,
    militarSai: null,
    loadingEntra: false,
    loadingSai: false,
    erroEntra: '',
    erroSai: '',
  };
}

type StatusFiltro = 'a_enviar' | 'enviadas' | 'arquivadas' | 'todas';

// Graduações disponíveis para cadastro
const GRADUACOES = [
  'CEL', 'TEN CEL', 'MAJ', 'CAP',
  '1° TEN', '2° TEN', 'ASP',
  'ST', '1° SGT', '2° SGT', '3° SGT',
  'CB', 'SD',
];

const QUADROS = ['QOC', 'QOA', 'QPE', 'QPC', 'QPM', 'QOE', 'QOE/COM', 'QOE/MUS', 'QOBM', 'QOPM'];

// ============================================================
// MAIN PAGE
// ============================================================

export default function PermutasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('permutas');

  // ============================
  // PERMUTAS STATE
  // ============================
  const [permutas, setPermutas] = useState<PermutaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('a_enviar');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Batch Modal
  const [batchOpen, setBatchOpen] = useState(false);
  const [linhas, setLinhas] = useState<LinhaPermuta[]>([criarLinhaVazia()]);
  const [salvandoLote, setSalvandoLote] = useState(false);

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editPermuta, setEditPermuta] = useState<PermutaDoc | null>(null);
  const [editData, setEditData] = useState('');
  const [editFuncao, setEditFuncao] = useState('');
  const [editSalvando, setEditSalvando] = useState(false);

  // Cadastrar Militar Modal (usado tanto na aba permutas quanto militares)
  const [cadastroMilitarOpen, setCadastroMilitarOpen] = useState(false);
  const [novoMilitarRg, setNovoMilitarRg] = useState('');
  const [novoMilitarNome, setNovoMilitarNome] = useState('');
  const [novoMilitarGrad, setNovoMilitarGrad] = useState('CAP');
  const [novoMilitarQuadro, setNovoMilitarQuadro] = useState('QOC');
  const [novoMilitarUnidade, setNovoMilitarUnidade] = useState('');
  const [salvandoMilitar, setSalvandoMilitar] = useState(false);
  const [editandoMilitarId, setEditandoMilitarId] = useState<string | null>(null);
  const cadastroCallbackRef = useRef<((snap: MilitarSnapshot) => void) | null>(null);

  // Nota / Doc Generation Modal
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  const [notaNumero, setNotaNumero] = useState('');
  const [gerandoDoc, setGerandoDoc] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docPermutas, setDocPermutas] = useState<PermutaDoc[]>([]);

  const [actionLoading, setActionLoading] = useState(false);

  // ============================
  // MILITARES STATE
  // ============================
  const [militares, setMilitares] = useState<MilitarPermuta[]>([]);
  const [militaresLoading, setMilitaresLoading] = useState(false);
  const [militaresSearch, setMilitaresSearch] = useState('');
  const [importando, setImportando] = useState(false);

  // ============================================================
  // Fetch permutas
  // ============================================================
  const fetchPermutas = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: {
        arquivada?: boolean;
        enviada?: boolean;
        startDate?: string;
        endDate?: string;
        search?: string;
      } = {};

      if (statusFiltro === 'a_enviar') {
        filtros.arquivada = false;
        filtros.enviada = false;
      } else if (statusFiltro === 'enviadas') {
        filtros.enviada = true;
        filtros.arquivada = false;
      } else if (statusFiltro === 'arquivadas') {
        filtros.arquivada = true;
      }

      if (dateFrom) filtros.startDate = dateFrom;
      if (dateTo) filtros.endDate = dateTo;
      if (searchTerm.trim()) filtros.search = searchTerm.trim();

      const result = await PermutaService.listarPermutas(filtros);
      setPermutas(result);
    } catch (error) {
      console.error('Erro ao carregar permutas:', error);
      toast.error('Erro ao carregar permutas');
    } finally {
      setLoading(false);
    }
  }, [statusFiltro, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    fetchPermutas();
  }, [fetchPermutas]);

  // ============================================================
  // Fetch militares
  // ============================================================
  const fetchMilitares = useCallback(async () => {
    setMilitaresLoading(true);
    try {
      const result = await MilitarPermutaService.listarTodos();
      setMilitares(result);
    } catch (error) {
      console.error('Erro ao carregar militares:', error);
      toast.error('Erro ao carregar militares de permutas');
    } finally {
      setMilitaresLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'militares') {
      fetchMilitares();
    }
  }, [activeTab, fetchMilitares]);

  // ============================================================
  // Import seed data
  // ============================================================
  const importarDadosIniciais = async () => {
    setImportando(true);
    try {
      const count = await MilitarPermutaService.importarEmLote(MILITARES_PERMUTAS_SEED);
      toast.success(`${count} militares importados com sucesso`);
      fetchMilitares();
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar militares');
    } finally {
      setImportando(false);
    }
  };

  // ============================================================
  // Selection helpers
  // ============================================================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === permutas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(permutas.map((p) => p.id)));
    }
  };

  const selectedPermutas = permutas.filter((p) => selectedIds.has(p.id));

  // ============================================================
  // Buscar militar por RG (usa coleção militares_permutas)
  // ============================================================
  const buscarMilitarParaLinha = async (
    linhaId: string,
    campo: 'entra' | 'sai',
    rg: string
  ) => {
    const rgLimpo = rg.replace(/\D/g, '').trim();
    if (!rgLimpo) return;

    setLinhas((prev) =>
      prev.map((l) =>
        l.id === linhaId
          ? {
              ...l,
              [campo === 'entra' ? 'loadingEntra' : 'loadingSai']: true,
              [campo === 'entra' ? 'erroEntra' : 'erroSai']: '',
            }
          : l
      )
    );

    try {
      const militar = await MilitarPermutaService.buscarPorRG(rgLimpo);
      if (militar) {
        const snap: MilitarSnapshot = {
          rg: militar.rg,
          nome: militar.nome,
          grad: militar.grad,
          quadro: militar.quadro,
          unidade: militar.unidade,
        };
        setLinhas((prev) =>
          prev.map((l) =>
            l.id === linhaId
              ? {
                  ...l,
                  [campo === 'entra' ? 'militarEntra' : 'militarSai']: snap,
                  [campo === 'entra' ? 'loadingEntra' : 'loadingSai']: false,
                  [campo === 'entra' ? 'erroEntra' : 'erroSai']: '',
                }
              : l
          )
        );
      } else {
        setLinhas((prev) =>
          prev.map((l) =>
            l.id === linhaId
              ? {
                  ...l,
                  [campo === 'entra' ? 'militarEntra' : 'militarSai']: null,
                  [campo === 'entra' ? 'loadingEntra' : 'loadingSai']: false,
                  [campo === 'entra' ? 'erroEntra' : 'erroSai']: 'RG não encontrado',
                }
              : l
          )
        );
      }
    } catch {
      setLinhas((prev) =>
        prev.map((l) =>
          l.id === linhaId
            ? {
                ...l,
                [campo === 'entra' ? 'loadingEntra' : 'loadingSai']: false,
                [campo === 'entra' ? 'erroEntra' : 'erroSai']: 'Erro na busca',
              }
            : l
        )
      );
    }
  };

  // ============================================================
  // Cadastrar / Editar militar (coleção militares_permutas)
  // ============================================================
  const abrirCadastroMilitar = (rg: string, callback: ((snap: MilitarSnapshot) => void) | null) => {
    setEditandoMilitarId(null);
    setNovoMilitarRg(rg.replace(/\D/g, ''));
    setNovoMilitarNome('');
    setNovoMilitarGrad('CAP');
    setNovoMilitarQuadro('QOC');
    setNovoMilitarUnidade('');
    cadastroCallbackRef.current = callback;
    setCadastroMilitarOpen(true);
  };

  const abrirEditarMilitar = (m: MilitarPermuta) => {
    setEditandoMilitarId(m.id);
    setNovoMilitarRg(m.rg);
    setNovoMilitarNome(m.nome);
    setNovoMilitarGrad(m.grad);
    setNovoMilitarQuadro(m.quadro);
    setNovoMilitarUnidade(m.unidade);
    cadastroCallbackRef.current = null;
    setCadastroMilitarOpen(true);
  };

  const salvarMilitar = async () => {
    if (!novoMilitarNome.trim() || !novoMilitarRg.trim()) {
      toast.error('Preencha nome e RG');
      return;
    }

    setSalvandoMilitar(true);
    try {
      const dados = {
        rg: novoMilitarRg.replace(/\D/g, ''),
        nome: novoMilitarNome.trim().toUpperCase(),
        grad: novoMilitarGrad,
        quadro: novoMilitarQuadro,
        unidade: novoMilitarUnidade.trim().toUpperCase(),
      };

      if (editandoMilitarId) {
        await MilitarPermutaService.atualizar(editandoMilitarId, dados);
        toast.success('Militar atualizado');
      } else {
        await MilitarPermutaService.criar(dados);
        toast.success('Militar cadastrado');
      }

      const snap: MilitarSnapshot = {
        rg: dados.rg,
        nome: dados.nome,
        grad: dados.grad,
        quadro: dados.quadro,
        unidade: dados.unidade,
      };

      setCadastroMilitarOpen(false);
      cadastroCallbackRef.current?.(snap);
      cadastroCallbackRef.current = null;

      if (activeTab === 'militares') fetchMilitares();
    } catch (error) {
      console.error('Erro ao salvar militar:', error);
      toast.error('Erro ao salvar militar');
    } finally {
      setSalvandoMilitar(false);
    }
  };

  const excluirMilitar = async (id: string) => {
    try {
      await MilitarPermutaService.excluir(id);
      toast.success('Militar excluído');
      fetchMilitares();
    } catch (error) {
      console.error('Erro ao excluir militar:', error);
      toast.error('Erro ao excluir militar');
    }
  };

  // ============================================================
  // Salvar lote
  // ============================================================
  const salvarLote = async (fecharModal: boolean) => {
    const linhasValidas = linhas.filter(
      (l) => l.data && l.funcao && l.militarEntra && l.militarSai
    );

    if (linhasValidas.length === 0) {
      toast.error('Nenhuma linha válida. Preencha todos os campos obrigatórios.');
      return;
    }

    setSalvandoLote(true);
    try {
      const inputs: PermutaInput[] = linhasValidas.map((l) => ({
        data: l.data,
        funcao: l.funcao,
        militarEntraRg: l.militarEntra!.rg,
        militarSaiRg: l.militarSai!.rg,
        militarEntraData: l.militarEntra!,
        militarSaiData: l.militarSai!,
      }));

      await PermutaService.criarPermutasEmLote(inputs, user?.uid || '');
      toast.success(`${linhasValidas.length} permuta(s) cadastrada(s)`);

      if (fecharModal) {
        setBatchOpen(false);
        setLinhas([criarLinhaVazia()]);
      } else {
        const linhasRestantes = linhas.filter(
          (l) => !(l.data && l.funcao && l.militarEntra && l.militarSai)
        );
        setLinhas(linhasRestantes.length > 0 ? linhasRestantes : [criarLinhaVazia()]);
      }

      fetchPermutas();
    } catch (error) {
      console.error('Erro ao salvar permutas:', error);
      toast.error('Erro ao salvar permutas');
    } finally {
      setSalvandoLote(false);
    }
  };

  // ============================================================
  // Edit permuta
  // ============================================================
  const openEdit = (p: PermutaDoc) => {
    setEditPermuta(p);
    setEditData(p.data);
    setEditFuncao(p.funcao);
    setEditOpen(true);
  };

  const salvarEdicao = async () => {
    if (!editPermuta) return;
    setEditSalvando(true);
    try {
      await PermutaService.atualizarPermuta(editPermuta.id, {
        data: editData,
        funcao: editFuncao,
      } as Partial<PermutaDoc>);
      toast.success('Permuta atualizada');
      setEditOpen(false);
      fetchPermutas();
    } catch (error) {
      console.error('Erro ao atualizar permuta:', error);
      toast.error('Erro ao atualizar permuta');
    } finally {
      setEditSalvando(false);
    }
  };

  // ============================================================
  // Bulk actions
  // ============================================================
  const marcarComoEnviadas = async (ids: string[]) => {
    setActionLoading(true);
    try {
      await PermutaService.marcarComoEnviadas(ids);
      toast.success(`${ids.length} permuta(s) marcada(s) como enviada(s)`);
      setSelectedIds(new Set());
      fetchPermutas();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao marcar como enviadas');
    } finally {
      setActionLoading(false);
    }
  };

  const arquivarPermutas = async (ids: string[]) => {
    setActionLoading(true);
    try {
      await PermutaService.arquivar(ids);
      toast.success(`${ids.length} permuta(s) arquivada(s)`);
      setSelectedIds(new Set());
      fetchPermutas();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao arquivar');
    } finally {
      setActionLoading(false);
    }
  };

  const desarquivarPermutas = async (ids: string[]) => {
    setActionLoading(true);
    try {
      await PermutaService.desarquivar(ids);
      toast.success(`${ids.length} permuta(s) desarquivada(s)`);
      setSelectedIds(new Set());
      fetchPermutas();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao desarquivar');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // Document generation
  // ============================================================
  const abrirGerarDocumento = (permutasParaDoc: PermutaDoc[]) => {
    if (permutasParaDoc.length === 0) {
      toast.error('Selecione ao menos uma permuta');
      return;
    }
    setDocPermutas(permutasParaDoc);
    setNotaNumero('');
    setDocUrl('');
    setNotaModalOpen(true);
  };

  const gerarDocumento = async () => {
    if (!notaNumero.trim()) {
      toast.error('Informe o número da nota');
      return;
    }

    const noteNumber = `${notaNumero.trim()}/${new Date().getFullYear()}`;
    setGerandoDoc(true);

    try {
      const url = await PermutaDocumentService.gerarEUploadDocumento(docPermutas, noteNumber);
      setDocUrl(url);
      toast.success('Documento gerado com sucesso!');

      for (const p of docPermutas) {
        await PermutaService.atualizarPermuta(p.id, {
          documentoGerado: { url, geradoEm: new Date().toISOString() },
        } as Partial<PermutaDoc>);
      }

      fetchPermutas();
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      toast.error('Erro ao gerar documento');
    } finally {
      setGerandoDoc(false);
    }
  };

  const baixarDocLocal = async (permutasParaDoc: PermutaDoc[], noteNumber: string) => {
    try {
      const blob = await PermutaDocumentService.gerarDocumento(permutasParaDoc, noteNumber);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Escala_Permutas_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao baixar documento');
    }
  };

  // ============================================================
  // Batch line helpers
  // ============================================================
  const updateLinha = (linhaId: string, campo: keyof LinhaPermuta, valor: unknown) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === linhaId ? { ...l, [campo]: valor } : l))
    );
  };

  // ============================================================
  // Filtered militares
  // ============================================================
  const militaresFiltrados = militaresSearch.trim()
    ? militares.filter((m) => {
        const s = militaresSearch.toLowerCase();
        return (
          m.nome.toLowerCase().includes(s) ||
          m.rg.includes(militaresSearch.replace(/\D/g, '')) ||
          m.unidade.toLowerCase().includes(s) ||
          m.quadro.toLowerCase().includes(s)
        );
      })
    : militares;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Permutas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento de permutas de serviço
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permutas" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Permutas
          </TabsTrigger>
          <TabsTrigger value="militares" className="gap-2">
            <Users className="h-4 w-4" />
            Militares
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB: PERMUTAS */}
        {/* ============================================================ */}
        <TabsContent value="permutas">
          <div className="space-y-4">
            {/* Action bar */}
            <div className="flex justify-end">
              <Button
                onClick={() => { setLinhas([criarLinhaVazia()]); setBatchOpen(true); }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova permuta (lote)
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                      {([
                        { value: 'a_enviar', label: 'A enviar' },
                        { value: 'enviadas', label: 'Enviadas' },
                        { value: 'arquivadas', label: 'Arquivadas' },
                        { value: 'todas', label: 'Todas' },
                      ] as { value: StatusFiltro; label: string }[]).map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => { setStatusFiltro(tab.value); setSelectedIds(new Set()); }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            statusFiltro === tab.value
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Buscar por RG ou nome..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-slate-100' : ''}
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t pt-4">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-500">Data inicial</Label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-slate-500">Data final</Label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }}>
                        <X className="h-4 w-4 mr-1" /> Limpar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-red-800">
                  {selectedIds.size} selecionada(s)
                </span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => abrirGerarDocumento(selectedPermutas)} disabled={actionLoading}>
                    <FileDown className="h-4 w-4 mr-1" /> Gerar Documento
                  </Button>
                  {statusFiltro !== 'enviadas' && (
                    <Button size="sm" variant="outline" onClick={() => marcarComoEnviadas([...selectedIds])} disabled={actionLoading}>
                      <Send className="h-4 w-4 mr-1" /> Marcar como Enviadas
                    </Button>
                  )}
                  {statusFiltro !== 'arquivadas' ? (
                    <Button size="sm" variant="outline" onClick={() => arquivarPermutas([...selectedIds])} disabled={actionLoading}>
                      <Archive className="h-4 w-4 mr-1" /> Arquivar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => desarquivarPermutas([...selectedIds])} disabled={actionLoading}>
                      <ArchiveRestore className="h-4 w-4 mr-1" /> Desarquivar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : permutas.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Nenhuma permuta encontrada</p>
                    <p className="text-sm mt-1">Ajuste os filtros ou cadastre novas permutas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left w-10">
                            <Checkbox
                              checked={selectedIds.size === permutas.length && permutas.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Data</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Função</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Entra</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Sai</th>
                          <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permutas.map((p) => (
                          <tr
                            key={p.id}
                            className={`border-b last:border-b-0 hover:bg-slate-50 transition-colors ${selectedIds.has(p.id) ? 'bg-red-50/50' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                              {formatarDataPtBR(p.data)}
                            </td>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{p.funcao}</td>
                            <td className="px-4 py-3">
                              <div className="text-slate-900 font-medium">{formatarMilitarStr(p.militarEntraData)}</div>
                              <div className="text-xs text-slate-500">RG {formatarRG(p.militarEntraRg)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-slate-900 font-medium">{formatarMilitarStr(p.militarSaiData)}</div>
                              <div className="text-xs text-slate-500">RG {formatarRG(p.militarSaiRg)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {p.enviada ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Enviada
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">A enviar</Badge>
                                )}
                                {p.arquivada && (
                                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                                    <Archive className="h-3 w-3 mr-1" /> Arquivada
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(p)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => abrirGerarDocumento([p])}>
                                    <FileDown className="h-4 w-4 mr-2" /> Gerar Word
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!p.enviada && (
                                    <DropdownMenuItem onClick={() => marcarComoEnviadas([p.id])}>
                                      <Send className="h-4 w-4 mr-2" /> Marcar enviada
                                    </DropdownMenuItem>
                                  )}
                                  {!p.arquivada ? (
                                    <DropdownMenuItem onClick={() => arquivarPermutas([p.id])}>
                                      <Archive className="h-4 w-4 mr-2" /> Arquivar
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => desarquivarPermutas([p.id])}>
                                      <ArchiveRestore className="h-4 w-4 mr-2" /> Desarquivar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: MILITARES */}
        {/* ============================================================ */}
        <TabsContent value="militares">
          <div className="space-y-4">
            {/* Header + Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, RG, quadro ou unidade..."
                  value={militaresSearch}
                  onChange={(e) => setMilitaresSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => abrirCadastroMilitar('', null)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo militar
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{militares.length} militares cadastrados</span>
              {militaresSearch && <span>{militaresFiltrados.length} encontrado(s)</span>}
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {militaresLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : militaresFiltrados.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">
                      {militares.length === 0 ? 'Nenhum militar cadastrado' : 'Nenhum resultado encontrado'}
                    </p>
                    {militares.length === 0 && (
                      <p className="text-sm mt-1">
                        Clique em &quot;Importar dados iniciais&quot; para carregar a lista ou cadastre manualmente
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left font-medium text-slate-600">RG</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Graduação</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Quadro</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Nome</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Unidade</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {militaresFiltrados.map((m) => (
                          <tr key={m.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-900">{formatarRG(m.rg)}</td>
                            <td className="px-4 py-3 text-slate-700">{m.grad}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">{m.quadro}</Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">{m.nome}</td>
                            <td className="px-4 py-3 text-slate-600">{m.unidade}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditarMilitar(m)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={() => excluirMilitar(m.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Nota Modal (gerar documento) */}
      <Dialog open={notaModalOpen} onOpenChange={setNotaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Gerar Documento de Permutas</DialogTitle>
            <DialogDescription>
              Informe o número da nota para gerar o documento Word com {docPermutas.length} permuta(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nota-numero" className="font-medium">Número da Nota</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="nota-numero"
                  placeholder="Ex: 149"
                  value={notaNumero}
                  onChange={(e) => setNotaNumero(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-slate-500 whitespace-nowrap">/ {new Date().getFullYear()}</span>
              </div>
              <p className="text-xs text-slate-400">Ex: NOTA GOCG 149/{new Date().getFullYear()}</p>
            </div>
            {docUrl && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800 font-medium mb-2">Documento gerado com sucesso!</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open(docUrl, '_blank')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Download className="h-4 w-4 mr-1" /> Baixar Word
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => baixarDocLocal(docPermutas, `${notaNumero.trim()}/${new Date().getFullYear()}`)}>
                    <FileDown className="h-4 w-4 mr-1" /> Download direto
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotaModalOpen(false)}>
              {docUrl ? 'Fechar' : 'Cancelar'}
            </Button>
            {!docUrl && (
              <Button onClick={gerarDocumento} disabled={gerandoDoc || !notaNumero.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                {gerandoDoc ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><FileDown className="h-4 w-4 mr-2" /> Gerar Documento</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permuta Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Permuta</DialogTitle>
            <DialogDescription>Altere os dados da permuta.</DialogDescription>
          </DialogHeader>
          {editPermuta && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Data do serviço</Label>
                <Input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={editFuncao} onValueChange={setEditFuncao}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUNCOES_PADRAO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">ENTRA</p>
                  <p className="font-medium text-sm">{formatarMilitarStr(editPermuta.militarEntraData)}</p>
                  <p className="text-xs text-slate-500">RG {formatarRG(editPermuta.militarEntraRg)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">SAI</p>
                  <p className="font-medium text-sm">{formatarMilitarStr(editPermuta.militarSaiData)}</p>
                  <p className="text-xs text-slate-500">RG {formatarRG(editPermuta.militarSaiRg)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={editSalvando} className="bg-red-600 hover:bg-red-700 text-white">
              {editSalvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadastrar / Editar Militar Modal */}
      <Dialog open={cadastroMilitarOpen} onOpenChange={setCadastroMilitarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-red-600" />
              {editandoMilitarId ? 'Editar Militar' : 'Cadastrar Novo Militar'}
            </DialogTitle>
            <DialogDescription>
              {editandoMilitarId
                ? 'Altere os dados do militar abaixo.'
                : 'Este militar será salvo na base de permutas (separada da base de militares do GOCG).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RG</Label>
                <Input value={novoMilitarRg} onChange={(e) => setNovoMilitarRg(e.target.value)} placeholder="Ex: 53726" />
              </div>
              <div className="space-y-2">
                <Label>Quadro</Label>
                <Select value={novoMilitarQuadro} onValueChange={setNovoMilitarQuadro}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUADROS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={novoMilitarNome} onChange={(e) => setNovoMilitarNome(e.target.value)} placeholder="Ex: SILVA DE SOUZA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Graduação</Label>
                <Select value={novoMilitarGrad} onValueChange={setNovoMilitarGrad}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADUACOES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade / Órgão</Label>
                <Input value={novoMilitarUnidade} onChange={(e) => setNovoMilitarUnidade(e.target.value)} placeholder="Ex: GOCG" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCadastroMilitarOpen(false)}>Cancelar</Button>
            <Button onClick={salvarMilitar} disabled={salvandoMilitar} className="bg-red-600 hover:bg-red-700 text-white">
              {salvandoMilitar ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {editandoMilitarId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch (Lote) Modal — UI melhorada */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
          {/* Header fixo */}
          <div className="px-6 pt-6 pb-4 border-b bg-white flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Cadastrar Permutas</DialogTitle>
              <DialogDescription className="text-slate-500">
                Digite o RG e pressione Tab para buscar automaticamente. Se o militar nao existir, clique em Cadastrar.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Conteudo scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {linhas.map((linha, idx) => {
              const isComplete = !!(linha.data && linha.funcao && linha.militarEntra && linha.militarSai);
              return (
                <div
                  key={linha.id}
                  className={`rounded-xl border-2 transition-colors ${
                    isComplete
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Linha header com numero e botão remover */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Permuta {idx + 1}
                      </span>
                    </div>
                    {linhas.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setLinhas((prev) => prev.filter((l) => l.id !== linha.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Remover</span>
                      </Button>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Linha 1: Data + Função lado a lado */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Data do serviço</Label>
                        <Input
                          type="date"
                          value={linha.data}
                          onChange={(e) => updateLinha(linha.id, 'data', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Função</Label>
                        <Select value={linha.funcao} onValueChange={(v) => updateLinha(linha.id, 'funcao', v)}>
                          <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FUNCOES_PADRAO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Linha 2: ENTRA e SAI lado a lado */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* ENTRA */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <Label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Entra</Label>
                        </div>
                        <div className="relative">
                          <Input
                            placeholder="Digite o RG..."
                            value={linha.rgEntra}
                            onChange={(e) => updateLinha(linha.id, 'rgEntra', e.target.value)}
                            onBlur={() => buscarMilitarParaLinha(linha.id, 'entra', linha.rgEntra)}
                            className="h-10 pr-8 font-mono"
                          />
                          {linha.loadingEntra && (
                            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                          )}
                        </div>
                        {linha.militarEntra && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{formatarMilitarStr(linha.militarEntra)}</p>
                              <p className="text-xs text-slate-500">RG {formatarRG(linha.militarEntra.rg)}{linha.militarEntra.unidade ? ` — ${linha.militarEntra.unidade}` : ''}</p>
                            </div>
                          </div>
                        )}
                        {linha.erroEntra && !linha.militarEntra && (
                          <div className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <span className="text-xs text-red-600 font-medium">{linha.erroEntra}</span>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => abrirCadastroMilitar(linha.rgEntra, (snap) => {
                                setLinhas((prev) => prev.map((l) => l.id === linha.id ? { ...l, militarEntra: snap, erroEntra: '' } : l));
                              })}
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Cadastrar
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* SAI */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <Label className="text-xs font-semibold text-red-700 uppercase tracking-wide">Sai</Label>
                        </div>
                        <div className="relative">
                          <Input
                            placeholder="Digite o RG..."
                            value={linha.rgSai}
                            onChange={(e) => updateLinha(linha.id, 'rgSai', e.target.value)}
                            onBlur={() => buscarMilitarParaLinha(linha.id, 'sai', linha.rgSai)}
                            className="h-10 pr-8 font-mono"
                          />
                          {linha.loadingSai && (
                            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                          )}
                        </div>
                        {linha.militarSai && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{formatarMilitarStr(linha.militarSai)}</p>
                              <p className="text-xs text-slate-500">RG {formatarRG(linha.militarSai.rg)}{linha.militarSai.unidade ? ` — ${linha.militarSai.unidade}` : ''}</p>
                            </div>
                          </div>
                        )}
                        {linha.erroSai && !linha.militarSai && (
                          <div className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <span className="text-xs text-red-600 font-medium">{linha.erroSai}</span>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => abrirCadastroMilitar(linha.rgSai, (snap) => {
                                setLinhas((prev) => prev.map((l) => l.id === linha.id ? { ...l, militarSai: snap, erroSai: '' } : l));
                              })}
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Cadastrar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Adicionar linha */}
            <button
              onClick={() => setLinhas((prev) => [...prev, criarLinhaVazia()])}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar permuta
            </button>
          </div>

          {/* Footer fixo */}
          <div className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {linhas.filter((l) => l.data && l.funcao && l.militarEntra && l.militarSai).length}
                  </span>
                  <span className="text-sm text-slate-400">prontas</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-400">{linhas.length} total</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBatchOpen(false)} disabled={salvandoLote}>
                  Cancelar
                </Button>
                <Button variant="outline" onClick={() => salvarLote(false)} disabled={salvandoLote}>
                  {salvandoLote && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar e continuar
                </Button>
                <Button onClick={() => salvarLote(true)} disabled={salvandoLote} className="bg-red-600 hover:bg-red-700 text-white">
                  {salvandoLote && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar e fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
