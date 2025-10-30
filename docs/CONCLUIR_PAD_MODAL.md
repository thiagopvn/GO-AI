# Modal "Concluir PAD" - Documentação Técnica

## Visão Geral

O modal "Concluir Processo Administrativo Disciplinar" é um componente dinâmico e interativo que permite a conclusão de PADs com duas opções principais:
- **Cenário A**: Justificar a transgressão (total ou parcialmente)
- **Cenário B**: Aplicar punição com cálculo automático baseado em atenuantes e agravantes

## Localização dos Arquivos

- **Componente Modal**: `/components/modals/ConcluirPadModal.tsx`
- **Página de Integração**: `/app/processos/page.tsx`

## Funcionalidades Implementadas

### 1. Renderização Condicional

O modal adapta sua interface dinamicamente baseado na decisão selecionada:

```typescript
type DecisaoTipo = 'justificar' | 'justificar_parte' | 'punir';
```

- **justificar**: Justificar Transgressão (Cenário A)
- **justificar_parte**: Justificar Transgressão em Parte (Cenário A)
- **punir**: Aplicar Punição - Não Justifica (Cenário B)

### 2. Cenário A: Justificar Transgressão

Campos exibidos:
- **Decisão** (obrigatório): Dropdown com opção de justificativa
- **Justificativa** (obrigatório): Textarea para descrição detalhada
- **Observações Finais** (opcional): Textarea para observações adicionais

### 3. Cenário B: Aplicar Punição

Este é o cenário mais complexo, com múltiplos campos e cálculo automático.

#### Campos do Cenário B:

1. **Atenuantes** (multi-select checkbox):
   - Bom comportamento
   - Relevância de serviços prestados
   - Ter sido cometida a transgressão para evitar mal maior
   - Defesa própria/de direitos sem justificação
   - Falta da prática do serviço

2. **Agravantes** (multi-select checkbox):
   - Mau comportamento
   - Prática simultânea de duas ou mais transgressões
   - Reincidência verbal (com campo numérico para nº de vezes)
   - Conluio de duas ou mais pessoas
   - Praticada durante execução de serviço
   - Cometida em presença de subordinado
   - Abuso de autoridade hierárquica
   - Premeditação
   - Praticada em presença de tropa
   - Praticada em presença de público

3. **Classificação da Transgressão** (obrigatório):
   - Leve (Punição Base = 1 dia)
   - Média (Punição Base = 2 dias)
   - Grave (Punição Base = 4 dias)

4. **Tipo de Punição** (obrigatório):
   - Advertência por Escrito
   - Repreensão
   - Detenção
   - Prisão

5. **Dias de Punição** (calculado automaticamente - editável):
   - Campo que exibe o resultado do cálculo automático
   - Atualiza em tempo real conforme os campos mudam
   - **Permite edição manual** para ajustes quando necessário
   - Valor mínimo: 0

6. **Observações Finais** (opcional):
   - Textarea para observações adicionais

## Fórmula de Cálculo Automático

### Fórmula Base:
```
Dias de Punição = Punição Base + 2 × (Total de Agravantes - Total de Atenuantes)
```

### Punição Base por Classificação:
- **Leve**: 1 dia
- **Média**: 2 dias
- **Grave**: 4 dias

### Regras:
- O resultado final **não pode ser menor que 0**
- O cálculo é executado automaticamente via `useEffect` sempre que:
  - A classificação muda
  - Atenuantes são marcados/desmarcados
  - Agravantes são marcados/desmarcados

### Exemplo de Cálculo:

**Entrada:**
- Classificação: Média (Base = 2)
- Atenuantes: 2 marcados
- Agravantes: 4 marcados

**Cálculo:**
```
2 + 2 × (4 - 2) = 2 + 2 × 2 = 2 + 4 = 6 dias
```

**Saída:** 6 dias de punição

## Estrutura de Dados

### Interface ConclusaoPadData:

```typescript
interface ConclusaoPadData {
  decisao: DecisaoTipo;
  justificativa?: string;
  observacoes?: string;
  atenuantes?: string[];
  agravantes?: string[];
  reincidenciaVerbalVezes?: number;
  classificacao?: ClassificacaoTransgressao;
  tipoPunicao?: TipoPunicao;
  diasPunicao?: number;
}
```

## Integração com Firebase

Quando o PAD é concluído, os seguintes dados são salvos no Firestore:

### Documento do Processo (collection: `processos`):

**Para Justificativa:**
```javascript
{
  status: "FINALIZADO",
  dataFechamento: Date,
  decisao: "Justificado" | "Justificado em Parte",
  justificativa: string,
  observacoesConclusao: string,
  updatedAt: serverTimestamp
}
```

**Para Punição:**
```javascript
{
  status: "FINALIZADO",
  dataFechamento: Date,
  decisao: "Punição Aplicada",
  atenuantes: string[],
  agravantes: string[],
  reincidenciaVerbalVezes: number,
  classificacao: string,
  tipoPunicao: string,
  diasPunicao: number,
  observacoesConclusao: string,
  updatedAt: serverTimestamp
}
```

### Documento de Transgressão (collection: `transgressoes`):

Criado automaticamente quando há punição:

```javascript
{
  militarId: string,
  militarNome: string,
  militarPosto: string,
  processoId: string,
  data: Date,
  descricao: string,
  tipoPunicao: TipoPunicao,
  diasPunicao: number,
  status: "Aguardando",
  classificacao: string,
  atenuantes: string[],
  agravantes: string[],
  reincidenciaVerbalVezes: number,
  createdAt: serverTimestamp,
  updatedAt: serverTimestamp
}
```

## Validações Implementadas

1. **Campo Decisão**: Sempre obrigatório
2. **Cenário A (Justificar)**:
   - Justificativa não pode estar vazia
3. **Cenário B (Punir)**:
   - Classificação da Transgressão é obrigatória
   - Tipo de Punição é obrigatório
   - Dias de Punição é calculado automaticamente, mas pode ser editado manualmente

## Experiência do Usuário (UX)

### Indicadores Visuais:
- Campos obrigatórios marcados com asterisco vermelho (`*`)
- Campo de "Dias de Punição" tem ícone de alerta e texto explicativo
- Tooltip mostrando a fórmula de cálculo e indicando possibilidade de edição manual
- Scroll automático para modais com muito conteúdo
- Loading state durante o processamento

### Estados de Carregamento:
- Botão "Concluir PAD" mostra spinner quando `isLoading=true`
- Todos os campos são desabilitados durante o processamento

### Feedback ao Usuário:
- Toast de sucesso com mensagem personalizada por tipo de decisão:
  - "PAD concluído com punição aplicada!"
  - "PAD concluído - transgressão justificada!"
  - "PAD concluído - transgressão justificada em parte!"
- Toast de erro em caso de falha

## Fluxo de Uso

1. Usuário clica em "Concluir" em um PAD na lista
2. Modal é aberto mostrando apenas o campo "Decisão"
3. Usuário seleciona uma das três opções no dropdown
4. Interface adapta dinamicamente:
   - **Se Justificar**: Mostra campos de justificativa
   - **Se Punir**: Mostra todos os campos de punição
5. Usuário preenche os campos necessários
6. Sistema calcula automaticamente os dias de punição (se aplicável)
7. Usuário clica em "Concluir PAD"
8. Sistema valida os dados
9. Dados são salvos no Firebase
10. Estatísticas são atualizadas
11. Comportamento do militar é recalculado (se punição)
12. Modal fecha e usuário vê toast de sucesso

## Melhorias Futuras Possíveis

1. **Histórico de Decisões**: Mostrar decisões anteriores do mesmo militar
2. **Sugestão Automática**: IA para sugerir classificação baseada na descrição
3. **Pré-visualização**: Mostrar preview do documento antes de finalizar
4. **Anexos**: Permitir upload de documentos comprobatórios
5. **Assinatura Digital**: Integração com certificado digital
6. **Workflow de Aprovação**: Sistema de aprovação em múltiplas etapas
7. **Templates de Justificativa**: Textos pré-definidos para casos comuns
8. **Validação Avançada**: Verificar limites legais de punição

## Manutenção e Testes

### Pontos de Atenção:
- Sempre testar o cálculo automático com diferentes combinações
- Verificar se os dados estão sendo salvos corretamente no Firebase
- Testar com conexão lenta (loading states)
- Validar que o formulário é resetado ao fechar o modal
- Garantir que apenas uma transgressão é criada por PAD

### Casos de Teste Recomendados:
1. ✅ Conclusão com justificativa total
2. ✅ Conclusão com justificativa parcial
3. ✅ Conclusão com punição sem atenuantes/agravantes
4. ✅ Conclusão com múltiplos atenuantes
5. ✅ Conclusão com múltiplos agravantes
6. ✅ Conclusão com reincidência verbal
7. ✅ Validação de campos obrigatórios
8. ✅ Cálculo com resultado negativo (deve retornar 0)
9. ✅ Cancelamento do modal
10. ✅ Erro ao salvar no Firebase

## Dependências

- React 19
- Firebase Firestore
- shadcn/ui components:
  - Dialog
  - Select
  - Textarea
  - Input
  - Checkbox
  - Button
  - Label
  - ScrollArea
- Lucide React (ícones)
- Sonner (toasts)

## Suporte

Para dúvidas ou problemas relacionados ao modal "Concluir PAD":
- Verificar logs do console do navegador
- Verificar logs do Firebase
- Consultar a documentação do CBMERJ sobre classificação de transgressões
- Revisar o código em `/components/modals/ConcluirPadModal.tsx`
