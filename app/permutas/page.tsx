'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PermutaService } from '@/lib/services/PermutaService';
import { PermutaDocumentService } from '@/lib/services/PermutaDocumentService';
import { MilitarService } from '@/lib/services/MilitarService';
import { PermutaDoc, PermutaInput, FUNCOES_PADRAO, MilitarSnapshot } from '@/types/permutas';
import { Patente } from '@/types';

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
  id: string; // transient key
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

// ============================================================
// Status filter type
// ============================================================
type StatusFiltro = 'a_enviar' | 'enviadas' | 'arquivadas' | 'todas';

// ============================================================
// MAIN PAGE
// ============================================================

export default function PermutasPage() {
  const { user } = useAuth();

  // ---- Data State ----
  const [permutas, setPermutas] = useState<PermutaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ---- Filter State ----
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('a_enviar');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ---- Batch Modal State ----
  const [batchOpen, setBatchOpen] = useState(false);
  const [linhas, setLinhas] = useState<LinhaPermuta[]>([criarLinhaVazia()]);
  const [salvandoLote, setSalvandoLote] = useState(false);

  // ---- Edit Modal State ----
  const [editOpen, setEditOpen] = useState(false);
  const [editPermuta, setEditPermuta] = useState<PermutaDoc | null>(null);
  const [editData, setEditData] = useState('');
  const [editFuncao, setEditFuncao] = useState('');
  const [editSalvando, setEditSalvando] = useState(false);

  // ---- Cadastrar Militar Modal State ----
  const [cadastroMilitarOpen, setCadastroMilitarOpen] = useState(false);
  const [novoMilitarRg, setNovoMilitarRg] = useState('');
  const [novoMilitarNome, setNovoMilitarNome] = useState('');
  const [novoMilitarPatente, setNovoMilitarPatente] = useState('');
  const [novoMilitarQuadro, setNovoMilitarQuadro] = useState('');
  const [novoMilitarUnidade, setNovoMilitarUnidade] = useState('');
  const [salvandoMilitar, setSalvandoMilitar] = useState(false);
  const cadastroCallbackRef = useRef<((snap: MilitarSnapshot) => void) | null>(null);

  // ---- Nota (Document Gen) Modal State ----
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  const [notaNumero, setNotaNumero] = useState('');
  const [gerandoDoc, setGerandoDoc] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docPermutas, setDocPermutas] = useState<PermutaDoc[]>([]);

  // ---- Action loading ----
  const [actionLoading, setActionLoading] = useState(false);

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
  // Buscar militar por RG (para batch form)
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
      const militar = await MilitarService.buscarPorRG(rgLimpo);
      if (militar) {
        const snap: MilitarSnapshot = {
          rg: militar.rg || rgLimpo,
          nome: militar.nome,
          grad: militar.patente || militar.postoGraduacao || '',
          quadro: ((militar as unknown as Record<string, unknown>).quadro as string) || 'QPE',
          unidade: militar.unidade,
        };
        setLinhas((prev) =>
          prev.map((l) =>
            l.id === linhaId
              ? {
                  ...l,
                  [campo === 'entra' ? 'militarEntra' : 'militarSai']: snap,
                  [campo === 'entra' ? 'loadingEntra' : 'loadingSai']: false,
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
  // Abrir modal de cadastro de militar
  // ============================================================
  const abrirCadastroMilitar = (rg: string, callback: (snap: MilitarSnapshot) => void) => {
    setNovoMilitarRg(rg.replace(/\D/g, ''));
    setNovoMilitarNome('');
    setNovoMilitarPatente('Soldado');
    setNovoMilitarQuadro('QPE');
    setNovoMilitarUnidade('');
    cadastroCallbackRef.current = callback;
    setCadastroMilitarOpen(true);
  };

  const salvarNovoMilitar = async () => {
    if (!novoMilitarNome.trim() || !novoMilitarRg.trim()) {
      toast.error('Preencha nome e RG');
      return;
    }

    setSalvandoMilitar(true);
    try {
      await MilitarService.criarMilitar({
        rg: novoMilitarRg.replace(/\D/g, ''),
        nome: novoMilitarNome.trim().toUpperCase(),
        patente: novoMilitarPatente,
        matricula: '',
        unidade: novoMilitarUnidade.trim() || undefined,
      });

      const snap: MilitarSnapshot = {
        rg: novoMilitarRg.replace(/\D/g, ''),
        nome: novoMilitarNome.trim().toUpperCase(),
        grad: novoMilitarPatente,
        quadro: novoMilitarQuadro,
        unidade: novoMilitarUnidade.trim() || undefined,
      };

      toast.success('Militar cadastrado com sucesso');
      setCadastroMilitarOpen(false);
      cadastroCallbackRef.current?.(snap);
      cadastroCallbackRef.current = null;
    } catch (error) {
      console.error('Erro ao cadastrar militar:', error);
      toast.error('Erro ao cadastrar militar');
    } finally {
      setSalvandoMilitar(false);
    }
  };

  // ============================================================
  // Salvar lote
  // ============================================================
  const salvarLote = async (fecharModal: boolean) => {
    // Validar
    const linhasValidas = linhas.filter(
      (l) => l.data && l.funcao && l.militarEntra && l.militarSai
    );

    if (linhasValidas.length === 0) {
      toast.error('Nenhuma linha válida para salvar. Preencha todos os campos obrigatórios.');
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
      toast.success(`${linhasValidas.length} permuta(s) cadastrada(s) com sucesso`);

      if (fecharModal) {
        setBatchOpen(false);
        setLinhas([criarLinhaVazia()]);
      } else {
        // Remove linhas salvas, mantém as inválidas, adiciona uma nova vazia
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
      console.error('Erro ao marcar como enviadas:', error);
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
      console.error('Erro ao arquivar:', error);
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
      console.error('Erro ao desarquivar:', error);
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
      const url = await PermutaDocumentService.gerarEUploadDocumento(
        docPermutas,
        noteNumber
      );
      setDocUrl(url);
      toast.success('Documento gerado com sucesso!');

      // Atualizar as permutas com a URL do documento
      for (const p of docPermutas) {
        await PermutaService.atualizarPermuta(p.id, {
          documentoGerado: {
            url,
            geradoEm: new Date().toISOString(),
          },
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

  // ============================================================
  // Baixar documento localmente (sem upload)
  // ============================================================
  const baixarDocLocal = async (permutasParaDoc: PermutaDoc[], noteNumber: string) => {
    try {
      const blob = await PermutaDocumentService.gerarDocumento(permutasParaDoc, noteNumber);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dataStr = new Date().toISOString().split('T')[0];
      a.download = `Escala_Permutas_${dataStr}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  // ============================================================
  // Update a batch form line field
  // ============================================================
  const updateLinha = (linhaId: string, campo: keyof LinhaPermuta, valor: unknown) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === linhaId ? { ...l, [campo]: valor } : l))
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Permutas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento de permutas de serviço
          </p>
        </div>
        <Button
          onClick={() => {
            setLinhas([criarLinhaVazia()]);
            setBatchOpen(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova permuta (lote)
        </Button>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Status tabs + search */}
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
                    onClick={() => {
                      setStatusFiltro(tab.value);
                      setSelectedIds(new Set());
                    }}
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

            {/* Advanced filters */}
            {showFilters && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t pt-4">
                <div className="flex-1">
                  <Label className="text-xs text-slate-500">Data inicial</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-500">Data final</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSearchTerm('');
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Limpar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-red-800">
            {selectedIds.size} selecionada(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => abrirGerarDocumento(selectedPermutas)}
              disabled={actionLoading}
            >
              <FileDown className="h-4 w-4 mr-1" />
              Gerar Documento
            </Button>
            {statusFiltro !== 'enviadas' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => marcarComoEnviadas([...selectedIds])}
                disabled={actionLoading}
              >
                <Send className="h-4 w-4 mr-1" />
                Marcar como Enviadas
              </Button>
            )}
            {statusFiltro !== 'arquivadas' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => arquivarPermutas([...selectedIds])}
                disabled={actionLoading}
              >
                <Archive className="h-4 w-4 mr-1" />
                Arquivar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => desarquivarPermutas([...selectedIds])}
                disabled={actionLoading}
              >
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Desarquivar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
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
                      className={`border-b last:border-b-0 hover:bg-slate-50 transition-colors ${
                        selectedIds.has(p.id) ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {formatarDataPtBR(p.data)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {p.funcao}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">
                          {formatarMilitarStr(p.militarEntraData)}
                        </div>
                        <div className="text-xs text-slate-500">
                          RG {formatarRG(p.militarEntraRg)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">
                          {formatarMilitarStr(p.militarSaiData)}
                        </div>
                        <div className="text-xs text-slate-500">
                          RG {formatarRG(p.militarSaiRg)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.enviada ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enviada
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              A enviar
                            </Badge>
                          )}
                          {p.arquivada && (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                              <Archive className="h-3 w-3 mr-1" />
                              Arquivada
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
                            <DropdownMenuItem
                              onClick={() => abrirGerarDocumento([p])}
                            >
                              <FileDown className="h-4 w-4 mr-2" /> Gerar Word
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!p.enviada && (
                              <DropdownMenuItem
                                onClick={() => marcarComoEnviadas([p.id])}
                              >
                                <Send className="h-4 w-4 mr-2" /> Marcar enviada
                              </DropdownMenuItem>
                            )}
                            {!p.arquivada ? (
                              <DropdownMenuItem
                                onClick={() => arquivarPermutas([p.id])}
                              >
                                <Archive className="h-4 w-4 mr-2" /> Arquivar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => desarquivarPermutas([p.id])}
                              >
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

      {/* ── Nota Modal (para gerar documento) ── */}
      <Dialog open={notaModalOpen} onOpenChange={setNotaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Gerar Documento de Permutas</DialogTitle>
            <DialogDescription>
              Informe o número da nota para gerar o documento Word.
              Será gerado com {docPermutas.length} permuta(s) selecionada(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nota-numero" className="font-medium">
                Número da Nota
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="nota-numero"
                  placeholder="Ex: 001"
                  value={notaNumero}
                  onChange={(e) => setNotaNumero(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  / {new Date().getFullYear()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                O número da nota aparecerá no título do documento
              </p>
            </div>

            {docUrl && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800 font-medium mb-2">
                  Documento gerado com sucesso!
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(docUrl, '_blank')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar Word
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      baixarDocLocal(
                        docPermutas,
                        `${notaNumero.trim()}/${new Date().getFullYear()}`
                      )
                    }
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Download direto
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotaModalOpen(false)}
            >
              {docUrl ? 'Fechar' : 'Cancelar'}
            </Button>
            {!docUrl && (
              <Button
                onClick={gerarDocumento}
                disabled={gerandoDoc || !notaNumero.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {gerandoDoc ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Gerar Documento
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Permuta</DialogTitle>
            <DialogDescription>Altere os dados da permuta selecionada.</DialogDescription>
          </DialogHeader>
          {editPermuta && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Data do serviço</Label>
                <Input
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={editFuncao} onValueChange={setEditFuncao}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNCOES_PADRAO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">ENTRA</p>
                  <p className="font-medium text-sm">
                    {formatarMilitarStr(editPermuta.militarEntraData)}
                  </p>
                  <p className="text-xs text-slate-500">
                    RG {formatarRG(editPermuta.militarEntraRg)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">SAI</p>
                  <p className="font-medium text-sm">
                    {formatarMilitarStr(editPermuta.militarSaiData)}
                  </p>
                  <p className="text-xs text-slate-500">
                    RG {formatarRG(editPermuta.militarSaiRg)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarEdicao}
              disabled={editSalvando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {editSalvando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cadastrar Militar Modal ── */}
      <Dialog open={cadastroMilitarOpen} onOpenChange={setCadastroMilitarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-red-600" />
              Cadastrar Novo Militar
            </DialogTitle>
            <DialogDescription>
              O RG informado não foi encontrado. Cadastre o militar abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RG</Label>
                <Input
                  value={novoMilitarRg}
                  onChange={(e) => setNovoMilitarRg(e.target.value)}
                  placeholder="Ex: 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Quadro</Label>
                <Select value={novoMilitarQuadro} onValueChange={setNovoMilitarQuadro}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['QPE', 'QOC', 'QOPM', 'QPC', 'QPM', 'QOE', 'QOBM'].map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={novoMilitarNome}
                onChange={(e) => setNovoMilitarNome(e.target.value)}
                placeholder="Ex: SILVA DE SOUZA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Posto/Graduação</Label>
                <Select value={novoMilitarPatente} onValueChange={setNovoMilitarPatente}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Patente).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade (opcional)</Label>
                <Input
                  value={novoMilitarUnidade}
                  onChange={(e) => setNovoMilitarUnidade(e.target.value)}
                  placeholder="Ex: GOCG"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCadastroMilitarOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarNovoMilitar}
              disabled={salvandoMilitar}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {salvandoMilitar ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Batch (Lote) Modal ── */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Cadastrar Permutas em Lote
            </DialogTitle>
            <DialogDescription>
              Preencha as linhas abaixo. Ao digitar o RG e sair do campo, o sistema buscará automaticamente os dados do militar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {linhas.map((linha, idx) => (
              <div
                key={linha.id}
                className="border rounded-lg p-4 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    Permuta #{idx + 1}
                  </span>
                  {linhas.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-500"
                      onClick={() =>
                        setLinhas((prev) => prev.filter((l) => l.id !== linha.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Data */}
                  <div className="space-y-1">
                    <Label className="text-xs">Data do serviço</Label>
                    <Input
                      type="date"
                      value={linha.data}
                      onChange={(e) => updateLinha(linha.id, 'data', e.target.value)}
                    />
                  </div>

                  {/* Função */}
                  <div className="space-y-1">
                    <Label className="text-xs">Função</Label>
                    <Select
                      value={linha.funcao}
                      onValueChange={(v) => updateLinha(linha.id, 'funcao', v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUNCOES_PADRAO.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ENTRA */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-emerald-700">
                      ENTRA (militar que assume)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="RG"
                        value={linha.rgEntra}
                        onChange={(e) => updateLinha(linha.id, 'rgEntra', e.target.value)}
                        onBlur={() => buscarMilitarParaLinha(linha.id, 'entra', linha.rgEntra)}
                        className="w-32"
                      />
                      {linha.loadingEntra && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 self-center" />
                      )}
                    </div>
                    {linha.militarEntra && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs">
                        <span className="font-medium">
                          {formatarMilitarStr(linha.militarEntra)}
                        </span>
                        <span className="text-slate-500 ml-2">
                          RG {formatarRG(linha.militarEntra.rg)}
                        </span>
                      </div>
                    )}
                    {linha.erroEntra && !linha.militarEntra && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500">{linha.erroEntra}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            abrirCadastroMilitar(linha.rgEntra, (snap) => {
                              setLinhas((prev) =>
                                prev.map((l) =>
                                  l.id === linha.id
                                    ? { ...l, militarEntra: snap, erroEntra: '' }
                                    : l
                                )
                              );
                            })
                          }
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Cadastrar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* SAI */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-red-700">
                      SAI (militar que deixa o serviço)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="RG"
                        value={linha.rgSai}
                        onChange={(e) => updateLinha(linha.id, 'rgSai', e.target.value)}
                        onBlur={() => buscarMilitarParaLinha(linha.id, 'sai', linha.rgSai)}
                        className="w-32"
                      />
                      {linha.loadingSai && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 self-center" />
                      )}
                    </div>
                    {linha.militarSai && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <span className="font-medium">
                          {formatarMilitarStr(linha.militarSai)}
                        </span>
                        <span className="text-slate-500 ml-2">
                          RG {formatarRG(linha.militarSai.rg)}
                        </span>
                      </div>
                    )}
                    {linha.erroSai && !linha.militarSai && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500">{linha.erroSai}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            abrirCadastroMilitar(linha.rgSai, (snap) => {
                              setLinhas((prev) =>
                                prev.map((l) =>
                                  l.id === linha.id
                                    ? { ...l, militarSai: snap, erroSai: '' }
                                    : l
                                )
                              );
                            })
                          }
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Cadastrar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add line button */}
            <Button
              variant="outline"
              onClick={() => setLinhas((prev) => [...prev, criarLinhaVazia()])}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar linha
            </Button>
          </div>

          <DialogFooter className="border-t pt-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-slate-500">
                {linhas.filter((l) => l.data && l.funcao && l.militarEntra && l.militarSai).length}{' '}
                de {linhas.length} linhas válidas
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBatchOpen(false)}
                  disabled={salvandoLote}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => salvarLote(false)}
                  disabled={salvandoLote}
                >
                  {salvandoLote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
                <Button
                  onClick={() => salvarLote(true)}
                  disabled={salvandoLote}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {salvandoLote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar e fechar
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
