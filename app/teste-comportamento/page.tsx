'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComportamentoService } from '@/lib/services/ComportamentoService';
import { AlertCircle, CheckCircle2, Calculator, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function TesteComportamentoPage() {
  const [testing, setTesting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [selectedMilitarId, setSelectedMilitarId] = useState('');

  const handleTestCalculo = async () => {
    if (!selectedMilitarId) {
      toast.error('Por favor, digite o ID de um militar');
      return;
    }

    setTesting(true);
    try {
      const detalhes = await ComportamentoService.obterDetalhesCalculo(selectedMilitarId);

      if (!detalhes) {
        toast.error('Militar não encontrado ou não é praça');
        setResult(null);
      } else {
        setResult(detalhes);
        toast.success('Cálculo realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao calcular comportamento:', error);
      toast.error('Erro ao calcular comportamento');
      setResult(null);
    } finally {
      setTesting(false);
    }
  };

  const handleAtualizarComportamento = async () => {
    if (!selectedMilitarId) {
      toast.error('Por favor, digite o ID de um militar');
      return;
    }

    setTesting(true);
    try {
      const novoComportamento = await ComportamentoService.calcularEAtualizarComportamento(selectedMilitarId);

      if (!novoComportamento) {
        toast.error('Militar não encontrado ou não é praça');
      } else {
        toast.success(`Comportamento atualizado para: ${novoComportamento}`);
        // Recarregar detalhes
        const detalhes = await ComportamentoService.obterDetalhesCalculo(selectedMilitarId);
        setResult(detalhes);
      }
    } catch (error) {
      console.error('Erro ao atualizar comportamento:', error);
      toast.error('Erro ao atualizar comportamento');
    } finally {
      setTesting(false);
    }
  };

  const getComportamentoColor = (comportamento: string) => {
    switch (comportamento) {
      case 'EXCEPCIONAL':
        return 'text-green-600 bg-green-100';
      case 'ÓTIMO':
        return 'text-blue-600 bg-blue-100';
      case 'BOM':
        return 'text-yellow-600 bg-yellow-100';
      case 'INSUFICIENTE':
        return 'text-orange-600 bg-orange-100';
      case 'MAU':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
        {/* Card de Entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Testar Cálculo de Comportamento
            </CardTitle>
            <CardDescription>
              Digite o ID de um militar (praça) para calcular seu comportamento baseado no histórico de punições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID do Militar
                </label>
                <input
                  type="text"
                  value={selectedMilitarId}
                  onChange={(e) => setSelectedMilitarId(e.target.value)}
                  placeholder="Ex: abc123def456..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleTestCalculo}
                  disabled={testing}
                  variant="outline"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Testar Cálculo
                </Button>

                <Button
                  onClick={handleAtualizarComportamento}
                  disabled={testing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Atualizar no Firestore
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Resultados */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultado do Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dados do Militar */}
              {result.dadosMilitar && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Dados do Militar:</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {result.dadosMilitar.nome}</p>
                    <p><strong>Patente:</strong> {result.dadosMilitar.patente}</p>
                    <p><strong>Data de Inclusão:</strong> {
                      result.dadosMilitar.dataInclusao
                        ? new Date(result.dadosMilitar.dataInclusao).toLocaleDateString('pt-BR')
                        : 'Não informada'
                    }</p>
                    <p><strong>Tempo de Serviço:</strong> {
                      result.dadosMilitar.tempoServicoAnos.toFixed(1)
                    } anos</p>
                  </div>
                </div>
              )}

              {/* Comportamento Calculado */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Comportamento Calculado:</h3>
                <span className={`px-3 py-1 rounded-full font-semibold ${getComportamentoColor(result.comportamentoCalculado)}`}>
                  {result.comportamentoCalculado}
                </span>
              </div>

              {/* Detalhes por Janela de Tempo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Últimos 8 Anos</h4>
                  {typeof result.detalhes.punicoes8Anos === 'number' ? (
                    <>
                      <p className="text-2xl font-bold">{result.detalhes.punicoes8Anos}</p>
                      <p className="text-xs text-gray-500">punições totais</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">{result.detalhes.punicoes8Anos}</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Últimos 4 Anos</h4>
                  {typeof result.detalhes.punicoes4Anos.total === 'number' ? (
                    <>
                      <p className="text-2xl font-bold">{result.detalhes.punicoes4Anos.total}</p>
                      <p className="text-xs text-gray-500">punições totais</p>
                      <p className="text-sm mt-1">
                        {result.detalhes.punicoes4Anos.detencoesEquivalentes} detenções equiv.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">{result.detalhes.punicoes4Anos.total}</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Últimos 2 Anos</h4>
                  {typeof result.detalhes.punicoes2Anos.total === 'number' ? (
                    <>
                      <p className="text-2xl font-bold">{result.detalhes.punicoes2Anos.total}</p>
                      <p className="text-xs text-gray-500">punições totais</p>
                      <p className="text-sm mt-1">
                        {result.detalhes.punicoes2Anos.prisoesEquivalentes} prisões equiv.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">{result.detalhes.punicoes2Anos.total}</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Último Ano</h4>
                  {typeof result.detalhes.punicoes1Ano.total === 'number' ? (
                    <>
                      <p className="text-2xl font-bold">{result.detalhes.punicoes1Ano.total}</p>
                      <p className="text-xs text-gray-500">punições totais</p>
                      <p className="text-sm mt-1">
                        {result.detalhes.punicoes1Ano.prisoesEquivalentes} prisões equiv.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">{result.detalhes.punicoes1Ano.total}</p>
                  )}
                </div>
              </div>

              {/* Lista de Processos */}
              {result.detalhes.processos.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Histórico de Punições:</h3>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {result.detalhes.processos.map((processo: any) => (
                      <div
                        key={processo.id}
                        className="p-3 border rounded-lg bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {processo.numero || 'Processo s/n'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {processo.motivo}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Fechamento: {processo.dataFechamento
                                ? new Date(processo.dataFechamento).toLocaleDateString('pt-BR')
                                : 'Não informado'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium
                              ${processo.tipoPunicao === 'prisao' || processo.tipoPunicao === 'Prisão'
                                ? 'bg-red-100 text-red-700'
                                : processo.tipoPunicao === 'detencao' || processo.tipoPunicao === 'Detenção'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {processo.tipoPunicao}
                            </span>
                            {processo.diasPunicao && (
                              <p className="text-xs text-gray-500 mt-1">
                                {processo.diasPunicao} dias
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicação da Lógica */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-2">Regras de Cálculo (CORRIGIDAS - 2025-11-04):</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• <strong>Excepcional:</strong> 8 anos sem punições (requer 8+ anos de serviço)</li>
                      <li>• <strong>Ótimo:</strong> Máximo 1 detenção equiv. em 4 anos (requer 4+ anos de serviço)</li>
                      <li>• <strong>Bom:</strong> Menos de 2 prisões equiv. no período avaliado (comportamento inicial)</li>
                      <li>• <strong>Insuficiente:</strong> Exatamente 2 prisões equiv. (avaliado no último ano E nos últimos 2 anos)</li>
                      <li>• <strong>Mau:</strong> Mais de 2 prisões equiv. (avaliado no último ano E nos últimos 2 anos)</li>
                    </ul>
                    <p className="mt-2 text-xs">
                      <strong>Conversões com decimais precisos:</strong><br/>
                      1 repreensão = 0.5 detenção | 1 detenção = 0.5 prisão<br/>
                      <strong>Exemplo:</strong> 4 detenções + 1 repreensão = 4.5 detenções = 2.25 prisões = MAU
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}