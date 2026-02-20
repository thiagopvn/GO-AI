'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  Download,
  Shield,
  Scale,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  Calendar,
  BarChart3,
  Gavel
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Militar, Transgressao, Sindicancia } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { SindicanciaService } from '@/lib/services/sindicancia.service';
import { TransgressaoService } from '@/lib/services/transgressao.service';
import { motion } from 'framer-motion';

// ---- Tipos ----
interface PADData {
  id: string;
  militarId: string;
  militarNome: string;
  militarPosto: string;
  classificacao?: string;
  decisao?: string;
  status: string;
  dataAbertura?: Date;
  dataConclusao?: Date;
  tipoPunicao?: string;
  diasPunicao?: number;
}

interface Estatisticas {
  totalMilitares: number;
  militaresAtivos: number;
  totalPracas: number;
  totalTransgressoes: number;
  transgressoesNoPeriodo: number;
  totalSindicancias: number;
  sindicanciasEmAndamento: number;
  sindicanciasConcluidas: number;
  sindicanciasArquivadas: number;
  comportamentoPorTipo: {
    excepcional: number;
    otimo: number;
    bom: number;
    insuficiente: number;
    mau: number;
  };
  classificacaoPADs: {
    leve: number;
    media: number;
    grave: number;
    justificados: number;
  };
  totalPADs: number;
  taxaDisciplina: number;
}

// ---- Helpers ----
const COMPORTAMENTO_CONFIG = [
  { key: 'excepcional', label: 'Excepcional', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: Shield },
  { key: 'otimo', label: 'Otimo', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 },
  { key: 'bom', label: 'Bom', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', borderColor: 'border-blue-200', icon: TrendingUp },
  { key: 'insuficiente', label: 'Insuficiente', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', borderColor: 'border-amber-200', icon: AlertCircle },
  { key: 'mau', label: 'Mau', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle },
] as const;

const CLASSIFICACAO_CONFIG = [
  { key: 'leve', label: 'Leve', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
  { key: 'media', label: 'Media', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50' },
  { key: 'grave', label: 'Grave', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' },
  { key: 'justificados', label: 'PADs Justificados', color: 'bg-teal-500', textColor: 'text-teal-700', bgLight: 'bg-teal-50' },
] as const;

const isPraca = (postoGraduacao: string | undefined): boolean => {
  const pracas = ['Subtenente', '1º Sargento', '2º Sargento', '3º Sargento', 'Cabo', 'Soldado'];
  return pracas.includes(postoGraduacao || '');
};

const calcularPercentual = (valor: number, total: number): number => {
  return total > 0 ? Math.round((valor / total) * 1000) / 10 : 0;
};

const gerarCSV = (headers: string[], rows: string[][]): string => {
  const BOM = '\uFEFF';
  const headerLine = headers.join(';');
  const dataLines = rows.map(row => row.join(';'));
  return BOM + [headerLine, ...dataLines].join('\n');
};

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---- Componente de Barra de Progresso Animada ----
function AnimatedProgressBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      />
    </div>
  );
}

// ---- Componente Principal ----
export default function RelatoriosPage() {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [transgressoes, setTransgressoes] = useState<Transgressao[]>([]);
  const [sindicancias, setSindicancias] = useState<Sindicancia[]>([]);
  const [pads, setPads] = useState<PADData[]>([]);
  const [periodo, setPeriodo] = useState('30');
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        const [militaresSnap, transgressoesList, sindicanciasList, padsSnap] = await Promise.all([
          getDocs(collection(db, 'militares')),
          TransgressaoService.listar(),
          SindicanciaService.listar(),
          getDocs(collection(db, 'pads')),
        ]);

        const militaresList = militaresSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Militar[];

        const padsList: PADData[] = padsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            militarId: data.militarId || '',
            militarNome: data.militarNome || '',
            militarPosto: data.militarPosto || '',
            classificacao: data.classificacao || undefined,
            decisao: data.decisao || undefined,
            status: data.status || '',
            dataAbertura: data.dataAbertura?.toDate?.() || undefined,
            dataConclusao: data.dataConclusao?.toDate?.() || undefined,
            tipoPunicao: data.tipoPunicao || undefined,
            diasPunicao: data.diasPunicao || undefined,
          };
        });

        setMilitares(militaresList);
        setTransgressoes(transgressoesList);
        setSindicancias(sindicanciasList);
        setPads(padsList);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados dos relatórios');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Dados filtrados pelo período
  const dataLimite = useMemo(() => subDays(new Date(), parseInt(periodo)), [periodo]);

  const transgressoesFiltradas = useMemo(() =>
    transgressoes.filter(t => t.data && isAfter(t.data, dataLimite)),
    [transgressoes, dataLimite]
  );

  const sindicanciasFiltradas = useMemo(() =>
    sindicancias.filter(s => s.dataInstauracao && isAfter(s.dataInstauracao, dataLimite)),
    [sindicancias, dataLimite]
  );

  // Calcular estatísticas
  const estatisticas = useMemo((): Estatisticas | null => {
    if (militares.length === 0) return null;

    const pracas = militares.filter(m => isPraca(m.postoGraduacao));
    const totalPracas = pracas.length;

    const comportamentoPorTipo = {
      excepcional: militares.filter(m => m.comportamento === 'Excepcional').length,
      otimo: militares.filter(m => m.comportamento === 'Ótimo').length,
      bom: militares.filter(m => m.comportamento === 'Bom').length,
      insuficiente: militares.filter(m => m.comportamento === 'Insuficiente').length,
      mau: militares.filter(m => m.comportamento === 'Mau').length,
    };

    const totalComComportamento = Object.values(comportamentoPorTipo).reduce((a, b) => a + b, 0);

    const classificacaoPADs = {
      leve: pads.filter(p => p.classificacao === 'leve').length,
      media: pads.filter(p => p.classificacao === 'media').length,
      grave: pads.filter(p => p.classificacao === 'grave').length,
      justificados: pads.filter(p => p.decisao === 'justificar').length,
    };

    const taxaDisciplina = totalComComportamento > 0
      ? calcularPercentual(comportamentoPorTipo.excepcional + comportamentoPorTipo.otimo, totalComComportamento)
      : 0;

    return {
      totalMilitares: militares.length,
      militaresAtivos: militares.filter(m => m.status === 'Ativo').length,
      totalPracas,
      totalTransgressoes: transgressoes.length,
      transgressoesNoPeriodo: transgressoesFiltradas.length,
      totalSindicancias: sindicancias.length,
      sindicanciasEmAndamento: sindicancias.filter(s => s.status === 'Em Andamento').length,
      sindicanciasConcluidas: sindicancias.filter(s => s.status === 'Concluída').length,
      sindicanciasArquivadas: sindicancias.filter(s => s.status === 'Arquivada').length,
      comportamentoPorTipo,
      classificacaoPADs,
      totalPADs: pads.length,
      taxaDisciplina,
    };
  }, [militares, transgressoes, sindicancias, pads, transgressoesFiltradas]);

  // Total de militares com comportamento definido (para percentuais)
  const totalComComportamento = useMemo(() => {
    if (!estatisticas) return 0;
    return Object.values(estatisticas.comportamentoPorTipo).reduce((a, b) => a + b, 0);
  }, [estatisticas]);

  const totalClassificacoes = useMemo(() => {
    if (!estatisticas) return 0;
    return estatisticas.classificacaoPADs.leve + estatisticas.classificacaoPADs.media + estatisticas.classificacaoPADs.grave;
  }, [estatisticas]);

  // Funções de exportação
  const exportarComportamento = useCallback(() => {
    setExportando('comportamento');
    try {
      const headers = ['Posto/Graduacao', 'Nome Completo', 'Nome de Guerra', 'RG', 'Comportamento', 'Status'];
      const rows = militares
        .filter(m => m.comportamento)
        .sort((a, b) => (a.comportamento || '').localeCompare(b.comportamento || ''))
        .map(m => [
          m.postoGraduacao || m.patente || '',
          m.nomeCompleto || m.nome || '',
          m.nomeDeGuerra || m.nomeGuerra || '',
          m.rg || '',
          m.comportamento || '',
          m.status || '',
        ]);

      const csv = gerarCSV(headers, rows);
      const periodoLabel = periodo === '7' ? '7dias' : periodo === '30' ? '30dias' : periodo === '90' ? '90dias' : '1ano';
      downloadCSV(csv, `relatorio_comportamento_${periodoLabel}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      toast.success('Relatorio de comportamento exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar relatorio');
    } finally {
      setExportando(null);
    }
  }, [militares, periodo]);

  const exportarTransgressoes = useCallback(() => {
    setExportando('transgressoes');
    try {
      const headers = ['Data', 'Militar', 'Posto', 'Tipo', 'Natureza', 'Dias Punicao', 'Status'];
      const rows = transgressoesFiltradas.map(t => [
        t.data ? format(t.data, 'dd/MM/yyyy') : '',
        t.militarNome || '',
        t.militarPosto || '',
        t.tipo || '',
        t.natureza || '',
        String(t.diasPunicao || 0),
        t.status || '',
      ]);

      const csv = gerarCSV(headers, rows);
      downloadCSV(csv, `relatorio_transgressoes_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      toast.success('Relatorio de transgressoes exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar relatorio');
    } finally {
      setExportando(null);
    }
  }, [transgressoesFiltradas]);

  const exportarSindicancias = useCallback(() => {
    setExportando('sindicancias');
    try {
      const headers = ['Numero', 'Tipo', 'Assunto', 'Encarregado', 'Status', 'Data Instauracao', 'Data Limite'];
      const rows = sindicanciasFiltradas.map(s => [
        s.numero || '',
        s.tipo || '',
        s.assunto || '',
        `${s.encarregadoPosto || ''} ${s.encarregadoNome || ''}`.trim(),
        s.status || '',
        s.dataInstauracao ? format(s.dataInstauracao, 'dd/MM/yyyy') : '',
        s.dataLimite ? format(s.dataLimite, 'dd/MM/yyyy') : '',
      ]);

      const csv = gerarCSV(headers, rows);
      downloadCSV(csv, `relatorio_sindicancias_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      toast.success('Relatorio de sindicancias exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar relatorio');
    } finally {
      setExportando(null);
    }
  }, [sindicanciasFiltradas]);

  const exportarGerencial = useCallback(() => {
    setExportando('gerencial');
    try {
      if (!estatisticas) return;

      const lines: string[] = [];
      const BOM = '\uFEFF';

      lines.push('RELATORIO GERENCIAL - AIOP GOCG');
      lines.push(`Data de geracao: ${format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`);
      lines.push(`Periodo: Ultimos ${periodo} dias`);
      lines.push('');
      lines.push('=== RESUMO GERAL ===');
      lines.push(`Total de Militares: ${estatisticas.totalMilitares}`);
      lines.push(`Pracas: ${estatisticas.totalPracas}`);
      lines.push(`Taxa de Disciplina (Exc+Otimo): ${estatisticas.taxaDisciplina}%`);
      lines.push('');
      lines.push('=== COMPORTAMENTO ===');
      lines.push(`Excepcional: ${estatisticas.comportamentoPorTipo.excepcional}`);
      lines.push(`Otimo: ${estatisticas.comportamentoPorTipo.otimo}`);
      lines.push(`Bom: ${estatisticas.comportamentoPorTipo.bom}`);
      lines.push(`Insuficiente: ${estatisticas.comportamentoPorTipo.insuficiente}`);
      lines.push(`Mau: ${estatisticas.comportamentoPorTipo.mau}`);
      lines.push('');
      lines.push('=== PADs ===');
      lines.push(`Total de PADs: ${estatisticas.totalPADs}`);
      lines.push(`Classificacao Leve: ${estatisticas.classificacaoPADs.leve}`);
      lines.push(`Classificacao Media: ${estatisticas.classificacaoPADs.media}`);
      lines.push(`Classificacao Grave: ${estatisticas.classificacaoPADs.grave}`);
      lines.push(`PADs Justificados: ${estatisticas.classificacaoPADs.justificados}`);
      lines.push('');
      lines.push('=== TRANSGRESSOES (periodo) ===');
      lines.push(`Total no periodo: ${estatisticas.transgressoesNoPeriodo}`);
      lines.push(`Total geral: ${estatisticas.totalTransgressoes}`);
      lines.push('');
      lines.push('=== SINDICANCIAS ===');
      lines.push(`Em Andamento: ${estatisticas.sindicanciasEmAndamento}`);
      lines.push(`Concluidas: ${estatisticas.sindicanciasConcluidas}`);
      lines.push(`Arquivadas: ${estatisticas.sindicanciasArquivadas}`);
      lines.push(`Total: ${estatisticas.totalSindicancias}`);

      const content = BOM + lines.join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_gerencial_${format(new Date(), 'dd-MM-yyyy')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Relatorio gerencial exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar relatorio');
    } finally {
      setExportando(null);
    }
  }, [estatisticas, periodo]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-gray-500">Carregando relatorios...</p>
        </div>
      </div>
    );
  }

  const periodoLabel = periodo === '7' ? '7 dias' : periodo === '30' ? '30 dias' : periodo === '90' ? '90 dias' : '1 ano';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estatisticas e relatorios do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Ultimos 7 dias</SelectItem>
              <SelectItem value="30">Ultimos 30 dias</SelectItem>
              <SelectItem value="90">Ultimos 90 dias</SelectItem>
              <SelectItem value="365">Ultimo ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Militares</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{estatisticas?.totalMilitares || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {estatisticas?.totalPracas || 0} pracas cadastradas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Transgressoes no Periodo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{estatisticas?.transgressoesNoPeriodo || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Total geral: {estatisticas?.totalTransgressoes || 0}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sindicancias em Andamento</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{estatisticas?.sindicanciasEmAndamento || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Total: {estatisticas?.totalSindicancias || 0}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Disciplina</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{estatisticas?.taxaDisciplina || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Comportamento Exc/Otimo
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comportamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="comportamento" className="gap-1.5">
            <Shield className="h-4 w-4 hidden sm:block" />
            Comportamento
          </TabsTrigger>
          <TabsTrigger value="transgressoes" className="gap-1.5">
            <Gavel className="h-4 w-4 hidden sm:block" />
            Transgressoes
          </TabsTrigger>
          <TabsTrigger value="sindicancias" className="gap-1.5">
            <Scale className="h-4 w-4 hidden sm:block" />
            Sindicancias
          </TabsTrigger>
          <TabsTrigger value="exportar" className="gap-1.5">
            <Download className="h-4 w-4 hidden sm:block" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* ======= ABA COMPORTAMENTO ======= */}
        <TabsContent value="comportamento" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle>Distribuicao de Comportamento</CardTitle>
                  <CardDescription>
                    Quantidade de militares por classificacao ({totalComComportamento} com comportamento definido)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {COMPORTAMENTO_CONFIG.map((config, index) => {
                  const quantidade = estatisticas?.comportamentoPorTipo[config.key as keyof typeof estatisticas.comportamentoPorTipo] || 0;
                  const percentual = calcularPercentual(quantidade, totalComComportamento);
                  const Icon = config.icon;

                  return (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.textColor}`} />
                          <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{quantidade}</span>
                          <Badge variant="outline" className={`text-xs ${config.bgLight} ${config.textColor} ${config.borderColor}`}>
                            {percentual}%
                          </Badge>
                        </div>
                      </div>
                      <AnimatedProgressBar value={percentual} color={config.color} delay={index * 0.1} />
                    </div>
                  );
                })}
              </div>

              {/* Resumo visual */}
              {totalComComportamento > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Distribuicao visual</p>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    {COMPORTAMENTO_CONFIG.map(config => {
                      const quantidade = estatisticas?.comportamentoPorTipo[config.key as keyof typeof estatisticas.comportamentoPorTipo] || 0;
                      const percentual = calcularPercentual(quantidade, totalComComportamento);
                      if (percentual === 0) return null;
                      return (
                        <motion.div
                          key={config.key}
                          className={`${config.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentual}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          title={`${config.label}: ${quantidade} (${percentual}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {COMPORTAMENTO_CONFIG.map(config => {
                      const quantidade = estatisticas?.comportamentoPorTipo[config.key as keyof typeof estatisticas.comportamentoPorTipo] || 0;
                      if (quantidade === 0) return null;
                      return (
                        <div key={config.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Militares com comportamento critico */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle>Militares com Comportamento Critico</CardTitle>
                  <CardDescription>
                    Militares com comportamento Insuficiente ou Mau
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {militares.filter(m => m.comportamento === 'Insuficiente' || m.comportamento === 'Mau').length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Nenhum militar com comportamento critico</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {militares
                    .filter(m => m.comportamento === 'Insuficiente' || m.comportamento === 'Mau')
                    .map(militar => (
                      <div key={militar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{militar.postoGraduacao} {militar.nomeCompleto}</p>
                          <p className="text-xs text-gray-500">RG: {militar.rg}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            militar.comportamento === 'Insuficiente'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }>
                            {militar.comportamento}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======= ABA TRANSGRESSOES ======= */}
        <TabsContent value="transgressoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle>Classificacao dos PADs</CardTitle>
                  <CardDescription>
                    Distribuicao por classificacao da colecao de PADs ({pads.length} total)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {CLASSIFICACAO_CONFIG.map((config, index) => {
                  const quantidade = estatisticas?.classificacaoPADs[config.key as keyof typeof estatisticas.classificacaoPADs] || 0;
                  const total = config.key === 'justificados' ? pads.length : totalClassificacoes;
                  const percentual = calcularPercentual(quantidade, total || 1);

                  return (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{quantidade}</span>
                          <Badge variant="outline" className={`text-xs ${config.bgLight} ${config.textColor}`}>
                            {percentual}%
                          </Badge>
                        </div>
                      </div>
                      <AnimatedProgressBar value={percentual} color={config.color} delay={index * 0.1} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle>Transgressoes Recentes</CardTitle>
                  <CardDescription>
                    Ultimas {periodoLabel} ({transgressoesFiltradas.length} registros)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transgressoesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Nenhuma transgressao no periodo selecionado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transgressoesFiltradas.slice(0, 10).map(transgressao => (
                    <div key={transgressao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {transgressao.militarPosto} {transgressao.militarNome}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{transgressao.tipo || transgressao.descricao}</p>
                        <p className="text-xs text-gray-400">
                          {transgressao.data ? format(transgressao.data, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <Badge className={
                          transgressao.natureza === 'Leve' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          transgressao.natureza === 'Média' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }>
                          {transgressao.natureza || 'N/A'}
                        </Badge>
                        {transgressao.diasPunicao > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {transgressao.diasPunicao}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {transgressoesFiltradas.length > 10 && (
                    <p className="text-xs text-center text-gray-400 pt-2">
                      + {transgressoesFiltradas.length - 10} transgressoes nao exibidas
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======= ABA SINDICANCIAS ======= */}
        <TabsContent value="sindicancias" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle>Status das Sindicancias</CardTitle>
                  <CardDescription>Visao geral de todas as sindicancias</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{estatisticas?.sindicanciasEmAndamento || 0}</p>
                  <p className="text-xs text-blue-600 font-medium">Em Andamento</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-2xl font-bold text-green-600">{estatisticas?.sindicanciasConcluidas || 0}</p>
                  <p className="text-xs text-green-600 font-medium">Concluidas</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-2xl font-bold text-gray-600">{estatisticas?.sindicanciasArquivadas || 0}</p>
                  <p className="text-xs text-gray-600 font-medium">Arquivadas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-2xl font-bold text-purple-600">{estatisticas?.totalSindicancias || 0}</p>
                  <p className="text-xs text-purple-600 font-medium">Total</p>
                </div>
              </div>

              {/* Barra de distribuicao */}
              {(estatisticas?.totalSindicancias || 0) > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Distribuicao por status</p>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${calcularPercentual(estatisticas?.sindicanciasEmAndamento || 0, estatisticas?.totalSindicancias || 1)}%` }}
                      transition={{ duration: 0.8 }}
                    />
                    <motion.div
                      className="bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${calcularPercentual(estatisticas?.sindicanciasConcluidas || 0, estatisticas?.totalSindicancias || 1)}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                    <motion.div
                      className="bg-gray-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${calcularPercentual(estatisticas?.sindicanciasArquivadas || 0, estatisticas?.totalSindicancias || 1)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Em Andamento
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Concluidas
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Arquivadas
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de sindicancias em andamento */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sindicancias em andamento</h4>
                {sindicancias.filter(s => s.status === 'Em Andamento').length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                    <p className="text-sm">Nenhuma sindicancia em andamento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sindicancias
                      .filter(s => s.status === 'Em Andamento')
                      .slice(0, 8)
                      .map(sindicancia => {
                        const diasRestantes = sindicancia.dataLimite
                          ? Math.ceil((sindicancia.dataLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : 0;
                        const critico = diasRestantes <= 5;
                        const vencido = diasRestantes < 0;

                        return (
                          <div
                            key={sindicancia.id}
                            className={`p-3 rounded-lg transition-colors ${
                              vencido ? 'bg-red-50 border border-red-200' :
                              critico ? 'bg-amber-50 border border-amber-200' :
                              'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900">{sindicancia.tipo} N {sindicancia.numero}</p>
                                <p className="text-xs text-gray-600 truncate">{sindicancia.assunto}</p>
                                <p className="text-xs text-gray-400">
                                  Encarregado: {sindicancia.encarregadoPosto} {sindicancia.encarregadoNome}
                                </p>
                              </div>
                              <Badge className={
                                vencido ? 'bg-red-100 text-red-800 border border-red-200 flex-shrink-0' :
                                critico ? 'bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0' :
                                'bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0'
                              }>
                                {vencido ? `${Math.abs(diasRestantes)}d vencido` :
                                 `${diasRestantes}d restantes`}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======= ABA EXPORTAR ======= */}
        <TabsContent value="exportar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle>Exportar Relatorios</CardTitle>
                  <CardDescription>
                    Exporte os dados filtrados em formato CSV (compativel com Excel)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Comportamento */}
                <div className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Comportamento</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Lista completa de militares com classificacao de comportamento
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={exportarComportamento}
                    disabled={exportando === 'comportamento'}
                  >
                    {exportando === 'comportamento' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Exportar CSV
                  </Button>
                </div>

                {/* Transgressoes */}
                <div className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Gavel className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Transgressoes</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Historico do periodo selecionado ({transgressoesFiltradas.length} registros)
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={exportarTransgressoes}
                    disabled={exportando === 'transgressoes'}
                  >
                    {exportando === 'transgressoes' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Exportar CSV
                  </Button>
                </div>

                {/* Sindicancias */}
                <div className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Scale className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sindicancias</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status e distribuicao ({sindicanciasFiltradas.length} no periodo)
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={exportarSindicancias}
                    disabled={exportando === 'sindicancias'}
                  >
                    {exportando === 'sindicancias' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Exportar CSV
                  </Button>
                </div>

                {/* Gerencial */}
                <div className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Relatorio Gerencial</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Consolidado com todas as informacoes do sistema
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={exportarGerencial}
                    disabled={exportando === 'gerencial'}
                  >
                    {exportando === 'gerencial' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Exportar TXT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
