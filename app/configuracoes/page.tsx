'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Shield, Clock, FileText, Bell, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ConfiguracaoService } from '@/lib/services/configuracao.service';
import { Configuracao } from '@/types';

interface FormData {
  // Geral
  nome_unidade: string;
  comandante_unidade: string;
  email_notificacoes: string;

  // Prazos
  prazo_recurso_pad: number;
  prazo_nota_pad: number;
  prazo_inicial_sindicancia: number;
  prazo_prorrogacao_sindicancia: number;
  alerta_prazo_sindicancia: number;

  // Comportamento
  dias_excepcional_otimo: number;
  dias_otimo_bom: number;
  dias_bom_insuficiente: number;
  dias_melhoria_comportamento: number;

  // Documentos
  modelo_pad: string;
  assinatura_digital: boolean;
  backup_automatico: boolean;

  // Notificações
  notificar_prazos: boolean;
  notificar_transgressoes: boolean;
  notificar_comportamento: boolean;
  notificar_sindicancias: boolean;
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nome_unidade: '',
    comandante_unidade: '',
    email_notificacoes: '',
    prazo_recurso_pad: 5,
    prazo_nota_pad: 10,
    prazo_inicial_sindicancia: 30,
    prazo_prorrogacao_sindicancia: 30,
    alerta_prazo_sindicancia: 5,
    dias_excepcional_otimo: 365,
    dias_otimo_bom: 180,
    dias_bom_insuficiente: 90,
    dias_melhoria_comportamento: 30,
    modelo_pad: 'padrao',
    assinatura_digital: false,
    backup_automatico: true,
    notificar_prazos: true,
    notificar_transgressoes: true,
    notificar_comportamento: true,
    notificar_sindicancias: true,
  });

  useEffect(() => {
    inicializarECarregarConfiguracoes();
  }, []);

  const inicializarECarregarConfiguracoes = async () => {
    try {
      setLoading(true);

      // Inicializar configurações padrão se não existirem
      await ConfiguracaoService.inicializar();

      // Carregar todas as configurações
      const configsList = await ConfiguracaoService.listar();
      setConfiguracoes(configsList);

      // Preencher formulário com valores atuais
      const novoFormData = { ...formData };
      for (const config of configsList) {
        if (config.chave in novoFormData) {
          (novoFormData as Record<string, string | number | boolean>)[config.chave] = config.valor;
        }
      }
      setFormData(novoFormData);

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const configuracoesAtualizadas = Object.entries(formData).map(([chave, valor]) => ({
        chave,
        valor
      }));

      await ConfiguracaoService.atualizarMultiplas(
        configuracoesAtualizadas,
        'user-id' // TODO: Pegar do contexto
      );

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (categoria: string) => {
    try {
      const configsCategoria = configuracoes.filter(c => c.categoria === categoria);

      for (const config of configsCategoria) {
        await ConfiguracaoService.resetar(config.chave);
      }

      toast.success(`Configurações de ${categoria} resetadas`);
      await inicializarECarregarConfiguracoes();
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      toast.error('Erro ao resetar configurações');
    }
  };

  const handleExportar = async () => {
    try {
      const dados = await ConfiguracaoService.exportar();
      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracoes_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Configurações exportadas com sucesso');
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      toast.error('Erro ao exportar configurações');
    }
  };

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const dados = JSON.parse(text);

      await ConfiguracaoService.importar(dados, 'user-id'); // TODO: Pegar do contexto
      toast.success('Configurações importadas com sucesso');
      await inicializarECarregarConfiguracoes();
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      toast.error('Erro ao importar configurações');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações e preferências do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Label htmlFor="import-file" className="cursor-pointer">
            <Button variant="outline" asChild>
              <div>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </div>
            </Button>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportar}
            />
          </Label>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Informações básicas da unidade militar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_unidade">Nome da Unidade</Label>
                <Input
                  id="nome_unidade"
                  value={formData.nome_unidade}
                  onChange={(e) => setFormData({...formData, nome_unidade: e.target.value})}
                  placeholder="Ex: 1º Batalhão de Polícia Militar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comandante">Comandante da Unidade</Label>
                <Input
                  id="comandante"
                  value={formData.comandante_unidade}
                  onChange={(e) => setFormData({...formData, comandante_unidade: e.target.value})}
                  placeholder="Nome completo do comandante"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail para Notificações</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email_notificacoes}
                  onChange={(e) => setFormData({...formData, email_notificacoes: e.target.value})}
                  placeholder="admin@unidade.mil.br"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Configurações de Prazos</CardTitle>
                  <CardDescription>
                    Defina os prazos legais e administrativos
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReset('prazos')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo_recurso">Prazo para Recurso de PAD (dias úteis)</Label>
                  <Input
                    id="prazo_recurso"
                    type="number"
                    value={formData.prazo_recurso_pad}
                    onChange={(e) => setFormData({...formData, prazo_recurso_pad: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_nota">Prazo para Nota de PAD (dias)</Label>
                  <Input
                    id="prazo_nota"
                    type="number"
                    value={formData.prazo_nota_pad}
                    onChange={(e) => setFormData({...formData, prazo_nota_pad: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo_sindicancia">Prazo Inicial de Sindicância (dias)</Label>
                  <Input
                    id="prazo_sindicancia"
                    type="number"
                    value={formData.prazo_inicial_sindicancia}
                    onChange={(e) => setFormData({...formData, prazo_inicial_sindicancia: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prorrogacao">Prazo de Prorrogação (dias)</Label>
                  <Input
                    id="prorrogacao"
                    type="number"
                    value={formData.prazo_prorrogacao_sindicancia}
                    onChange={(e) => setFormData({...formData, prazo_prorrogacao_sindicancia: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alerta">Dias de Antecedência para Alertas</Label>
                <Input
                  id="alerta"
                  type="number"
                  value={formData.alerta_prazo_sindicancia}
                  onChange={(e) => setFormData({...formData, alerta_prazo_sindicancia: parseInt(e.target.value)})}
                  min="1"
                />
                <p className="text-sm text-gray-500">
                  Sistema alertará quando faltar esta quantidade de dias para vencimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comportamento" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Regras de Comportamento</CardTitle>
                  <CardDescription>
                    Configure os critérios para mudança de comportamento
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReset('comportamento')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exc_otimo">Excepcional → Ótimo (dias)</Label>
                  <Input
                    id="exc_otimo"
                    type="number"
                    value={formData.dias_excepcional_otimo}
                    onChange={(e) => setFormData({...formData, dias_excepcional_otimo: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otimo_bom">Ótimo → Bom (dias)</Label>
                  <Input
                    id="otimo_bom"
                    type="number"
                    value={formData.dias_otimo_bom}
                    onChange={(e) => setFormData({...formData, dias_otimo_bom: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bom_insuf">Bom → Insuficiente (dias)</Label>
                  <Input
                    id="bom_insuf"
                    type="number"
                    value={formData.dias_bom_insuficiente}
                    onChange={(e) => setFormData({...formData, dias_bom_insuficiente: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="melhoria">Dias para Melhoria (dias)</Label>
                  <Input
                    id="melhoria"
                    type="number"
                    value={formData.dias_melhoria_comportamento}
                    onChange={(e) => setFormData({...formData, dias_melhoria_comportamento: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">Observação</p>
                <p className="text-sm text-blue-700 mt-1">
                  As transgressões graves sempre resultam em rebaixamento de comportamento,
                  independentemente do tempo decorrido.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Configurações de Documentos</CardTitle>
                  <CardDescription>
                    Opções relacionadas à geração e armazenamento de documentos
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReset('documentos')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo de PAD</Label>
                <Input
                  id="modelo"
                  value={formData.modelo_pad}
                  onChange={(e) => setFormData({...formData, modelo_pad: e.target.value})}
                  placeholder="padrao"
                />
                <p className="text-sm text-gray-500">
                  Identificador do modelo de documento a ser utilizado
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="assinatura">Assinatura Digital</Label>
                    <p className="text-sm text-gray-500">
                      Habilitar assinatura digital nos documentos gerados
                    </p>
                  </div>
                  <Switch
                    id="assinatura"
                    checked={formData.assinatura_digital}
                    onCheckedChange={(checked) => setFormData({...formData, assinatura_digital: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="backup">Backup Automático</Label>
                    <p className="text-sm text-gray-500">
                      Realizar backup automático dos documentos gerados
                    </p>
                  </div>
                  <Switch
                    id="backup"
                    checked={formData.backup_automatico}
                    onCheckedChange={(checked) => setFormData({...formData, backup_automatico: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Configurações de Notificações</CardTitle>
                  <CardDescription>
                    Escolha quais eventos devem gerar notificações
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReset('notificacoes')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif_prazos">Prazos Próximos do Vencimento</Label>
                  <p className="text-sm text-gray-500">
                    Receber alertas sobre prazos prestes a vencer
                  </p>
                </div>
                <Switch
                  id="notif_prazos"
                  checked={formData.notificar_prazos}
                  onCheckedChange={(checked) => setFormData({...formData, notificar_prazos: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif_trans">Novas Transgressões</Label>
                  <p className="text-sm text-gray-500">
                    Notificar quando novas transgressões forem registradas
                  </p>
                </div>
                <Switch
                  id="notif_trans"
                  checked={formData.notificar_transgressoes}
                  onCheckedChange={(checked) => setFormData({...formData, notificar_transgressoes: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif_comp">Mudanças de Comportamento</Label>
                  <p className="text-sm text-gray-500">
                    Alertar sobre alterações no comportamento dos militares
                  </p>
                </div>
                <Switch
                  id="notif_comp"
                  checked={formData.notificar_comportamento}
                  onCheckedChange={(checked) => setFormData({...formData, notificar_comportamento: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif_sind">Novas Sindicâncias</Label>
                  <p className="text-sm text-gray-500">
                    Notificar quando sindicâncias forem instauradas
                  </p>
                </div>
                <Switch
                  id="notif_sind"
                  checked={formData.notificar_sindicancias}
                  onCheckedChange={(checked) => setFormData({...formData, notificar_sindicancias: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}