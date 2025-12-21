// Anexo I do RDCBMERJ - 129 itens de tipificação com keywords para busca inteligente
export interface ItemTipificacaoEnriquecido {
  id: number;
  text: string;
  keywords: string[];
}

export const ITENS_TIPIFICACAO_ENRIQUECIDOS: ItemTipificacaoEnriquecido[] = [
  {
    id: 1,
    text: "Faltar à verdade.",
    keywords: [
      'mentir', 'mentiu', 'mentira', 'mentindo', 'mentia', 'mentiroso',
      'enganar', 'enganou', 'enganando', 'engano',
      'omitir', 'omitiu', 'omissão de informação', 'omitindo',
      'inverdade', 'inverídico', 'informação falsa', 'declaração falsa',
      'falso', 'falsidade', 'falsear', 'falseou', 'falsificou',
      'ludibriar', 'ludibriou', 'ludibriando',
      'fraudar', 'fraudou', 'fraude', 'fraudulento',
      'disse que era quando na verdade', 'afirmou falsamente',
      'negou ter feito', 'negou conhecimento', 'fingiu não saber',
      'inventou história', 'inventou desculpa', 'criou versão falsa',
      'alterou os fatos', 'distorceu a verdade', 'distorceu os fatos',
      'contou diferente', 'versões conflitantes', 'contradição',
      'informou erroneamente', 'prestou informação inverídica',
      'declarou inverdade', 'atestou falsamente', 'certificou falsamente',
      'assinou documento falso', 'adulterou informação',
      'não corresponde à realidade', 'fora da realidade',
      'disse uma coisa e fez outra', 'prometeu e não cumpriu',
      'alegou falsamente', 'justificativa falsa', 'álibi falso',
      'testemunho falso', 'depoimento inverídico',
      'escondeu a verdade', 'ocultou informação verdadeira',
      'manipulou informação', 'adulterou dados', 'forjou documento',
      'apresentou documento falso', 'atestado falso', 'declaração mendaz'
    ]
  },
  {
    id: 2,
    text: "Utilizar-se do anonimato.",
    keywords: [
      'anônimo', 'anonimato', 'anônima', 'anonimamente',
      'esconder identidade', 'escondeu identidade', 'ocultou identidade',
      'ocultar nome', 'ocultou nome', 'não revelou nome',
      'não se identificar', 'não se identificou', 'recusou identificar',
      'sem identificação', 'identificação oculta',
      'denúncia anônima', 'carta anônima', 'bilhete anônimo',
      'mensagem sem autor', 'texto sem assinatura',
      'perfil falso', 'perfil fake', 'conta falsa', 'identidade falsa',
      'usou nome falso', 'pseudônimo', 'codinome não autorizado',
      'se passou por outro', 'fingiu ser outra pessoa',
      'enviou mensagem sem se identificar', 'postou anonimamente',
      'escreveu sem assinar', 'comunicação anônima',
      'ligação anônima', 'telefonema anônimo', 'chamada não identificada',
      'omitiu quem era', 'não disse quem era', 'negou identidade'
    ]
  },
  {
    id: 3,
    text: "Concorrer para a discórdia ou desarmonia ou cultivar inimizade entre camaradas.",
    keywords: [
      'intriga', 'intrigou', 'intrigando', 'intrigueiro',
      'fofoca', 'fofocou', 'fofocando', 'fofoqueiro', 'fofoqueira',
      'briga', 'brigou', 'brigando', 'brigas',
      'conflito', 'conflitos', 'conflituoso', 'gerar conflito',
      'desunião', 'desunir', 'separar colegas', 'dividir equipe',
      'rivalidade', 'rival', 'rivais', 'criar rivalidade',
      'inimizade', 'inimigo', 'criar inimizade', 'tornar inimigos',
      'discórdia', 'discordância', 'semear discórdia',
      'desarmonia', 'desarmonizar', 'acabar com harmonia',
      'desentendimento', 'desentender', 'causar desentendimento',
      'colocou um contra o outro', 'jogou um contra o outro',
      'falou mal de colega', 'falou mal do companheiro',
      'espalhou boato sobre colega', 'inventou história sobre',
      'criou clima ruim', 'ambiente hostil', 'clima de tensão',
      'provocou discussão', 'incitou briga', 'estimulou conflito',
      'dividiu o grupo', 'rachou a equipe', 'fragmentou o pelotão',
      'causou mal estar', 'gerou desconforto', 'criou animosidade',
      'levou e trouxe', 'contou o que o outro disse',
      'distorceu palavras de colega', 'aumentou história',
      'criou picuinha', 'fomentou rivalidade', 'alimentou disputa'
    ]
  },
  {
    id: 4,
    text: "Freqüentar ou fazer parte de sindicatos, associações profissionais com caráter de sindicatos ou similares.",
    keywords: [
      'sindicato', 'sindical', 'sindicalizado', 'sindicalizou',
      'associação sindical', 'entidade sindical', 'organização sindical',
      'greve', 'grevista', 'movimento grevista', 'aderiu à greve',
      'movimento sindical', 'atividade sindical', 'militância sindical',
      'organização trabalhista', 'entidade de classe',
      'participou de assembleia sindical', 'reunião sindical',
      'filiou-se a sindicato', 'membro de sindicato',
      'ativismo trabalhista', 'reivindicação coletiva de classe',
      'paralisação', 'parou atividades', 'aderiu a paralisação'
    ]
  },
  {
    id: 5,
    text: "Deixar de punir transgressor da disciplina.",
    keywords: [
      'omissão', 'omitiu', 'omitindo', 'se omitiu',
      'negligência', 'negligenciou', 'foi negligente',
      'não punir', 'não puniu', 'deixou de punir', 'deixou impune',
      'deixar passar', 'deixou passar', 'passou por cima',
      'impunidade', 'ficou impune', 'permitiu impunidade',
      'permissividade', 'permissivo', 'foi permissivo',
      'não aplicou punição', 'não aplicou sanção',
      'viu e não fez nada', 'presenciou e ignorou',
      'conhecia a falta e não agiu', 'sabia e não puniu',
      'fez vista grossa', 'fingiu não ver', 'ignorou transgressão',
      'relevou a falta', 'perdoou sem autoridade',
      'liberou transgressor', 'não responsabilizou',
      'acobertar subordinado', 'protegeu transgressor',
      'não tomou providência disciplinar', 'inércia disciplinar'
    ]
  },
  {
    id: 6,
    text: "Não levar falta ou irregularidade que presenciar, ou de que tiver ciência e não lhe couber reprimir, ao conhecimento da autoridade competente, no mais curto prazo.",
    keywords: [
      'omissão', 'omitiu', 'se omitiu', 'omissão de comunicação',
      'não reportar', 'não reportou', 'deixou de reportar',
      'esconder', 'escondeu', 'escondendo', 'ocultou',
      'acobertar', 'acobertou', 'acobertando', 'acobertamento',
      'não comunicar', 'não comunicou', 'deixou de comunicar',
      'irregularidade', 'viu irregularidade', 'presenciou irregularidade',
      'não levou ao conhecimento', 'não informou superior',
      'guardou para si', 'manteve em segredo',
      'viu e calou', 'presenciou e silenciou', 'testemunhou e omitiu',
      'soube e não contou', 'teve ciência e não comunicou',
      'demorou a comunicar', 'atrasou comunicação',
      'protegeu colega', 'protegeu infrator',
      'não denunciou', 'deixou de denunciar',
      'fez vista grossa', 'fingiu não ver',
      'cumplicidade', 'cúmplice', 'conivência', 'conivente'
    ]
  },
  {
    id: 7,
    text: "Deixar de cumprir ou fazer cumprir normas regulamentares na esfera de suas atribuições.",
    keywords: [
      'descumprir', 'descumpriu', 'descumprindo', 'descumprimento',
      'negligência', 'negligenciou', 'negligente', 'foi negligente',
      'desobediência', 'desobedeceu', 'desobedecer',
      'norma', 'normas', 'regulamento', 'regulamentos',
      'não cumprir', 'não cumpriu', 'deixou de cumprir',
      'desrespeitar regra', 'desrespeitou regra', 'ignorou regra',
      'não seguiu procedimento', 'ignorou procedimento',
      'não observou norma', 'inobservância', 'inobservou',
      'violou regulamento', 'contrariou norma',
      'não fiscalizou cumprimento', 'não cobrou cumprimento',
      'permitiu descumprimento', 'tolerou irregularidade',
      'não fez cumprir', 'deixou de fazer cumprir',
      'relaxou fiscalização', 'abandonou fiscalização',
      'desconheceu norma', 'alegou desconhecer'
    ]
  },
  {
    id: 8,
    text: "Deixar de comunicar a tempo, ao superior imediato, ocorrência no âmbito de suas atribuições quando se julgar suspeito ou impedido de providenciar a respeito.",
    keywords: [
      'omissão', 'omitiu', 'se omitiu',
      'não comunicar', 'não comunicou', 'deixou de comunicar',
      'atraso comunicação', 'comunicou tarde', 'demorou a comunicar',
      'superior', 'superior imediato', 'não avisou superior',
      'impedimento', 'impedido', 'estava impedido', 'suspeito',
      'não informou impossibilidade', 'não disse que não podia',
      'deixou de participar', 'não participou ocorrência',
      'ocorrência não comunicada', 'fato não relatado',
      'silenciou sobre impedimento', 'não declarou suspeição',
      'agiu estando impedido', 'atuou com suspeição'
    ]
  },
  {
    id: 9,
    text: "Deixar de comunicar ao superior imediato ou na ausência deste, a qualquer autoridade superior, toda informação que tiver sobre iminente perturbação da ordem pública ou grave alteração do serviço, logo que disto tenha conhecimento.",
    keywords: [
      'omissão', 'omitiu', 'se omitiu',
      'ordem pública', 'perturbação', 'perturbação da ordem',
      'não informar', 'não informou', 'deixou de informar',
      'emergência', 'situação de emergência', 'urgência',
      'grave alteração', 'alteração do serviço',
      'soube e não comunicou', 'sabia e não avisou',
      'tinha conhecimento e calou', 'não alertou',
      'não deu ciência', 'não passou informação',
      'iminente problema', 'problema iminente',
      'deixou de avisar', 'não preveniu', 'não advertiu'
    ]
  },
  {
    id: 10,
    text: "Deixar de informar processo que lhe for encaminhado, exceto nos casos de suspeição ou impedimento ou absoluta falta de elementos, hipóteses em que estas circunstâncias serão fundamentadas.",
    keywords: [
      'processo', 'processos', 'processo administrativo',
      'não informar', 'não informou', 'deixou de informar',
      'omissão', 'omitiu', 'se omitiu',
      'negligência', 'negligenciou', 'foi negligente',
      'atraso', 'atrasou', 'atrasou processo', 'demora',
      'não deu andamento', 'deixou parado', 'processo parado',
      'não analisou', 'não examinou', 'não apreciou',
      'gaveta', 'engavetou', 'arquivou indevidamente',
      'não emitiu parecer', 'não opinou', 'não se manifestou'
    ]
  },
  {
    id: 11,
    text: "Deixar de encaminhar à autoridade competente, na linha de subordinação e no mais curto prazo, recurso ou documento que receber, desde que elaborado de acordo com os preceitos regulamentares, se não estiver na sua alçada dar solução.",
    keywords: [
      'documento', 'documentos', 'documentação',
      'recurso', 'recursos', 'requerimento',
      'não encaminhar', 'não encaminhou', 'deixou de encaminhar',
      'atraso', 'atrasou', 'demorou', 'demora',
      'negligência', 'negligenciou', 'negligente',
      'burocracia', 'burocrático', 'travou',
      'reteve documento', 'segurou documento', 'não deu seguimento',
      'engavetou', 'arquivou indevidamente', 'guardou na gaveta',
      'não remeteu', 'não enviou', 'não transmitiu',
      'não deu andamento', 'parou processo', 'travou andamento'
    ]
  },
  {
    id: 12,
    text: "Retardar ou prejudicar medidas ou ações de ordem judicial ou policial de que esteja investido ou que deva promover.",
    keywords: [
      'atraso', 'atrasou', 'atrasando', 'atrasar',
      'retardar', 'retardou', 'retardando', 'retardamento',
      'prejudicar', 'prejudicou', 'prejudicando', 'prejuízo',
      'judicial', 'ordem judicial', 'mandado judicial',
      'policial', 'ação policial', 'diligência policial',
      'obstrução', 'obstaculizar', 'obstaculizou', 'obstruiu',
      'demorou a cumprir', 'não cumpriu a tempo',
      'deixou prescrever', 'causou prescrição',
      'não executou mandado', 'não cumpriu ordem',
      'dificultou ação', 'emperrou processo',
      'sabotou investigação', 'atrapalhou diligência'
    ]
  },
  {
    id: 13,
    text: "Apresentar parte ou recurso sem seguir as normas e preceitos regulamentares ou em termos desrespeitosos ou com argumentos falsos ou de ma fé, ou mesmo sem justa causa ou razão.",
    keywords: [
      'recurso indevido', 'recurso irregular', 'recurso mal elaborado',
      'desrespeito', 'desrespeitoso', 'termos desrespeitosos',
      'má-fé', 'má fé', 'de má-fé', 'agiu de má-fé',
      'falso', 'argumentos falsos', 'alegações falsas',
      'documento irregular', 'petição irregular',
      'sem fundamento', 'infundado', 'sem razão',
      'ofensivo', 'linguagem ofensiva', 'termos ofensivos',
      'fora do padrão', 'não seguiu norma', 'irregular',
      'recurso protelatório', 'intuito protelatório',
      'justa causa', 'sem justa causa', 'sem motivo'
    ]
  },
  {
    id: 14,
    text: "Dificultar ao subordinado a apresentação de recursos.",
    keywords: [
      'dificultar', 'dificultou', 'dificultando', 'dificuldade',
      'impedir', 'impediu', 'impedindo', 'impedimento',
      'recurso', 'recursos', 'direito de recurso',
      'subordinado', 'subordinados',
      'obstrução', 'obstaculizar', 'obstaculizou',
      'cerceamento', 'cerceou', 'cercear', 'tolher',
      'não permitiu recorrer', 'barrou recurso', 'negou recurso',
      'intimidou para não recorrer', 'ameaçou por recorrer',
      'retaliou por recorrer', 'puniu por recorrer',
      'sonegou informação sobre recurso', 'não informou prazo',
      'escondeu direito', 'omitiu possibilidade de recurso'
    ]
  },
  {
    id: 15,
    text: "Deixar de comunicar ao superior a execução de ordem recebida, tão logo seja possível.",
    keywords: [
      'não comunicar', 'não comunicou', 'deixou de comunicar',
      'omissão', 'omitiu', 'se omitiu',
      'ordem', 'ordem recebida', 'determinação',
      'execução', 'executou', 'cumpriu',
      'feedback', 'retorno', 'não deu retorno',
      'não informou conclusão', 'não relatou cumprimento',
      'fez e não avisou', 'cumpriu e não comunicou',
      'superior não soube', 'não prestou conta',
      'deixou sem resposta', 'não respondeu sobre'
    ]
  },
  {
    id: 16,
    text: "Retardar a execução de qualquer ordem.",
    keywords: [
      'atraso', 'atrasou', 'atrasando', 'atrasado',
      'demora', 'demorou', 'demorando', 'demorado',
      'lentidão', 'lento', 'devagar', 'vagaroso',
      'ordem', 'ordem recebida', 'determinação',
      'retardar', 'retardou', 'retardando',
      'enrolar', 'enrolou', 'enrolando', 'enrolação',
      'procrastinar', 'procrastinou', 'adiou',
      'empurrou com a barriga', 'deixou para depois',
      'não fez de imediato', 'não cumpriu prontamente',
      'levou tempo demais', 'excedeu prazo',
      'corpo mole', 'fez corpo mole', 'má vontade'
    ]
  },
  {
    id: 17,
    text: "Aconselhar ou concorrer para não ser cumprida qualquer ordem de autoridade competente, ou para retardar a sua execução.",
    keywords: [
      'incitar', 'incitou', 'incitando', 'incitação',
      'aconselhar', 'aconselhou', 'aconselhando',
      'descumprir ordem', 'não cumprir ordem',
      'sabotagem', 'sabotar', 'sabotou',
      'instigar', 'instigou', 'instigando',
      'influenciar negativamente', 'influenciou negativamente',
      'convenceu a não fazer', 'induziu a não cumprir',
      'sugeriu desobedecer', 'orientou a ignorar',
      'disse para não fazer', 'mandou não cumprir',
      'conspirou contra ordem', 'articulou descumprimento',
      'fez campanha contra', 'mobilizou contra ordem'
    ]
  },
  {
    id: 18,
    text: "Não cumprir ordem recebida.",
    keywords: [
      'desobedecer', 'desobedeceu', 'desobedecendo', 'desobediência',
      'insubordinação', 'insubordinou', 'insubordinado',
      'ignorar', 'ignorou', 'ignorando',
      'recusar', 'recusou', 'recusando', 'recusa',
      'ordem', 'ordem recebida', 'determinação',
      'descumprir', 'descumpriu', 'descumprindo', 'descumprimento',
      'não fez o que foi mandado', 'não obedeceu',
      'não acatou', 'não atendeu determinação',
      'negou-se a fazer', 'se negou a cumprir',
      'não executou ordem', 'deixou de executar',
      'fez diferente do ordenado', 'contrariou ordem',
      'desrespeitou determinação', 'não seguiu instrução'
    ]
  },
  {
    id: 19,
    text: "Simular doença para esquivar-se ao cumprimento de qualquer dever de bombeiro-militar.",
    keywords: [
      'fingir', 'fingiu', 'fingindo', 'fingimento',
      'simular', 'simulou', 'simulando', 'simulação',
      'doença falsa', 'doença simulada', 'doença inventada',
      'mentir', 'mentiu', 'mentira',
      'esquivar', 'esquivou', 'se esquivando',
      'atestado falso', 'atestado fraudulento', 'atestado forjado',
      'enganar', 'enganou', 'enganando',
      'alegou estar doente', 'disse estar passando mal',
      'inventou mal estar', 'fingiu passar mal',
      'não estava doente', 'falsidade ideológica',
      'apresentou atestado falso', 'forjou doença',
      'faltou alegando doença', 'usou doença como desculpa'
    ]
  },
  {
    id: 20,
    text: "Trabalhar mal, intencionalmente ou por falta de atenção em qualquer serviço ou instrução.",
    keywords: [
      'desleixo', 'desleixado', 'desleixou',
      'negligência', 'negligenciou', 'negligente',
      'descuido', 'descuidou', 'descuidado',
      'mal feito', 'feito mal', 'trabalho ruim',
      'desatenção', 'desatento', 'falta de atenção',
      'preguiça', 'preguiçoso', 'com preguiça',
      'corpo mole', 'fez corpo mole', 'má vontade',
      'não se esforçou', 'sem empenho', 'sem dedicação',
      'fez de qualquer jeito', 'fez nas coxas',
      'não caprichou', 'relaxou no serviço',
      'serviço malfeito', 'trabalho incompleto',
      'errou por desatenção', 'falhou por descuido',
      'não prestou atenção', 'estava distraído',
      'fez errado', 'executou mal', 'realizou mal'
    ]
  },
  {
    id: 21,
    text: "Deixar de participar a tempo, à autoridade imediatamente superior, impossibilidade de comparecer à OBM ou a qualquer ato de serviço.",
    keywords: [
      'falta', 'faltou', 'faltando', 'faltar',
      'ausência', 'ausentou', 'ausente',
      'não avisar', 'não avisou', 'deixou de avisar',
      'comunicação', 'não comunicou', 'falta de comunicação',
      'atraso', 'atrasou', 'comunicou tarde',
      'não comparecer', 'não compareceu', 'deixou de comparecer',
      'não deu satisfação', 'sumiu', 'desapareceu',
      'não justificou', 'sem justificativa', 'injustificada',
      'não avisou que não viria', 'não informou ausência',
      'faltou sem avisar', 'não compareceu sem comunicar'
    ]
  },
  {
    id: 22,
    text: "Faltar ou chegar atrasado a qualquer ato de serviço em que deva tomar parte ou assistir.",
    keywords: [
      'falta', 'faltou', 'faltando', 'faltar', 'faltoso',
      'atraso', 'atrasou', 'atrasado', 'chegou atrasado', 'atrasando',
      'ausência', 'ausentou', 'ausente',
      'não comparecer', 'não compareceu', 'deixou de comparecer',
      'serviço', 'ato de serviço', 'compromisso',
      'escala', 'faltou escala', 'não compareceu escala',
      'formatura', 'faltou formatura', 'atrasou formatura',
      'reunião', 'faltou reunião', 'atrasou reunião',
      'instrução', 'faltou instrução', 'atrasou instrução',
      'não estava presente', 'não compareceu a tempo',
      'chegou depois do horário', 'perdeu horário',
      'não cumpriu horário', 'descumpriu horário'
    ]
  },
  {
    id: 23,
    text: "Permutar serviço sem permissão de autoridade competente.",
    keywords: [
      'troca', 'trocou', 'trocando', 'trocar',
      'permuta', 'permutou', 'permutando', 'permutar',
      'escala', 'trocou escala', 'alterou escala',
      'serviço', 'trocou serviço', 'mudou serviço',
      'sem autorização', 'não autorizado', 'sem permissão',
      'por conta própria', 'por iniciativa própria',
      'combinou troca', 'acertou troca', 'negociou troca',
      'passou serviço', 'pegou serviço de outro',
      'substituiu sem autorização', 'trocou turno'
    ]
  },
  {
    id: 24,
    text: "Comparecer o bombeiro-militar a qualquer solenidade, festividade ou reunião social, com uniforme diferente do previsto.",
    keywords: [
      'uniforme errado', 'uniforme incorreto', 'uniforme diferente',
      'traje inadequado', 'traje errado', 'roupa errada',
      'solenidade', 'festividade', 'reunião social', 'evento',
      'vestimenta', 'vestimenta inadequada',
      'fardamento', 'fardamento errado', 'farda errada',
      'usou uniforme diferente', 'não usou uniforme correto',
      'estava com uniforme errado', 'veio com roupa errada',
      'não seguiu dress code', 'descumpriu norma de uniforme'
    ]
  },
  {
    id: 25,
    text: "Abandonar serviço para o qual tenha sido designado.",
    keywords: [
      'abandono', 'abandonou', 'abandonando', 'abandonar',
      'deserção', 'desertar', 'desertou',
      'sair', 'saiu', 'saindo', 'saiu do serviço',
      'deixar posto', 'deixou posto', 'largou posto',
      'abandonar', 'abandonou', 'largou',
      'fugir do serviço', 'fugiu do serviço',
      'foi embora', 'evadiu-se', 'evasão',
      'deixou escala', 'largou escala',
      'não terminou serviço', 'saiu antes do fim',
      'deixou de cumprir escala', 'abandonou guarnição',
      'abandonou quartel', 'saiu sem autorização'
    ]
  },
  {
    id: 26,
    text: "Afastar-se de qualquer lugar em que deva estar por força de disposição legal ou ordem.",
    keywords: [
      'afastar', 'afastou', 'afastando', 'afastou-se',
      'sair', 'saiu', 'saindo', 'saiu do local',
      'abandonar posto', 'abandonou posto', 'deixou posto',
      'deixar local', 'deixou local', 'largou local',
      'ausentar', 'ausentou', 'se ausentou',
      'não estava onde deveria', 'saiu de onde deveria estar',
      'se afastou do posto', 'não permaneceu no local',
      'estava em outro lugar', 'não estava no local designado'
    ]
  },
  {
    id: 27,
    text: "Deixar de apresentar-se, nos prazos regulamentares, à OBM para que tenha sido transferido ou classificado e às autoridades competentes, nos casos de comissão ou serviço extraordinário para os quais tenha sido designado.",
    keywords: [
      'não apresentar', 'não se apresentou', 'deixou de apresentar',
      'transferência', 'transferido', 'foi transferido',
      'atraso', 'atrasou', 'atrasou apresentação',
      'não comparecer', 'não compareceu', 'deixou de comparecer',
      'omissão', 'omitiu', 'se omitiu',
      'prazo', 'perdeu prazo', 'excedeu prazo',
      'classificação', 'classificado', 'nova unidade',
      'comissão', 'serviço extraordinário'
    ]
  },
  {
    id: 28,
    text: "Não se apresentar ao fim de qualquer afastamento do serviço ou, ainda, logo que souber que o mesmo foi interrompido.",
    keywords: [
      'não retornar', 'não retornou', 'não voltou',
      'afastamento', 'fim de afastamento', 'término afastamento',
      'férias', 'volta de férias', 'retorno de férias',
      'licença', 'volta de licença', 'retorno de licença',
      'não apresentar', 'não se apresentou', 'deixou de apresentar',
      'não reassumiu', 'deixou de reassumir',
      'atrasou retorno', 'demorou a voltar',
      'estendeu afastamento', 'prolongou afastamento sem autorização'
    ]
  },
  {
    id: 29,
    text: "Representar a OBM e mesmo a Corporação, em qualquer ato, sem estar devidamente autorizado.",
    keywords: [
      'representação', 'representou', 'representando',
      'sem autorização', 'não autorizado', 'sem permissão',
      'falar em nome', 'falou em nome', 'disse representar',
      'corporação', 'OBM', 'unidade',
      'usurpar', 'usurpou', 'usurpação',
      'se passou por representante', 'fingiu representar',
      'agiu como porta-voz', 'deu declaração em nome de',
      'assinou como representante', 'assumiu função de representante'
    ]
  },
  {
    id: 30,
    text: "Tomar compromisso pela OBM que comanda ou em que serve sem estar autorizado.",
    keywords: [
      'compromisso', 'assumiu compromisso', 'firmou compromisso',
      'promessa', 'prometeu', 'prometendo',
      'sem autorização', 'não autorizado', 'sem permissão',
      'OBM', 'unidade', 'quartel',
      'acordar', 'acordou', 'fez acordo',
      'combinou sem autorização', 'assumiu obrigação',
      'fechou negócio', 'fechou contrato', 'assinou contrato'
    ]
  },
  {
    id: 31,
    text: "Contrair dívida ou assumir compromisso superior às suas possibilidades, comprometendo o bom nome da classe.",
    keywords: [
      'dívida', 'dívidas', 'endividado', 'endividamento',
      'endividamento', 'se endividou', 'contraiu dívida',
      'calote', 'deu calote', 'não pagou',
      'nome sujo', 'nome negativado', 'negativado',
      'compromisso financeiro', 'obrigação financeira',
      'descontrole financeiro', 'problema financeiro',
      'SPC', 'Serasa', 'protesto', 'protestado',
      'cobrança', 'está sendo cobrado', 'processado por dívida',
      'acima das possibilidades', 'gastou mais do que ganha',
      'comprometeu nome da classe', 'mancha na corporação'
    ]
  },
  {
    id: 32,
    text: "Esquivar-se a satisfazer compromisso de ordem moral ou pecuniária que houver assumido.",
    keywords: [
      'dívida', 'dívidas', 'deve', 'devendo',
      'não pagar', 'não pagou', 'deixou de pagar',
      'calote', 'deu calote', 'caloteiro',
      'fuga', 'fugiu', 'se esquivou',
      'compromisso', 'compromisso moral', 'compromisso financeiro',
      'inadimplência', 'inadimplente',
      'não honrou', 'deixou de honrar', 'não cumpriu',
      'se escondeu de credor', 'evitou cobrança',
      'não quitou', 'não saldou', 'não liquidou'
    ]
  },
  {
    id: 33,
    text: "Não atender a observação de autoridade competente, para satisfazer débito já reclamado.",
    keywords: [
      'dívida', 'débito', 'deve', 'devendo',
      'não pagar', 'não pagou', 'deixou de pagar',
      'descumprir', 'descumpriu', 'desobedeceu',
      'desobedecer', 'não atendeu', 'ignorou',
      'inadimplência', 'inadimplente',
      'autoridade mandou pagar', 'foi mandado pagar',
      'reclamação de dívida', 'notificação de débito',
      'não quitou após notificação', 'ignorou cobrança oficial'
    ]
  },
  {
    id: 34,
    text: "Não atender à obrigação de dar assistência a sua família ou dependente legalmente constituído.",
    keywords: [
      'família', 'familiar', 'familiares',
      'pensão', 'pensão alimentícia', 'não pagou pensão',
      'dependente', 'dependentes',
      'abandono', 'abandonou família', 'abandono familiar',
      'assistência', 'não deu assistência', 'falta de assistência',
      'alimentar', 'não alimentou', 'deixou passar necessidade',
      'filho', 'filhos', 'criança', 'menor',
      'esposa', 'ex-esposa', 'companheira',
      'não sustenta família', 'deixou de sustentar',
      'negligência familiar', 'irresponsabilidade familiar'
    ]
  },
  {
    id: 35,
    text: "Fazer, diretamente ou por intermédio de outrem, transações pecuniária envolvendo assunto de serviço, bens da Administração Pública ou material proibido, quando isso não configure crime.",
    keywords: [
      'transação', 'transações', 'negociação',
      'dinheiro', 'ganho financeiro', 'vantagem financeira',
      'venda', 'vendeu', 'vendendo',
      'compra', 'comprou', 'comprando',
      'corrupção', 'corrupto', 'ato corrupto',
      'propina', 'recebeu propina', 'pediu propina',
      'material público', 'bem público', 'patrimônio público',
      'negócio ilícito', 'negócio irregular',
      'comercializou material', 'vendeu material do estado',
      'lucrou com serviço público'
    ]
  },
  {
    id: 36,
    text: "Realizar ou propor transações pecuniárias envolvendo superior, igual ou subordinado. Não são considerados transações pecuniárias os empréstimos em dinheiro sem auferir lucro.",
    keywords: [
      'empréstimo', 'emprestou', 'emprestando',
      'agiotagem', 'agiota', 'juros abusivos',
      'dinheiro', 'emprestou dinheiro', 'cobrou juros',
      'juros', 'com juros', 'cobrando juros',
      'transação financeira', 'negócio financeiro',
      'negociou com colega', 'vendeu para colega',
      'lucrou com empréstimo', 'ganhou dinheiro emprestando'
    ]
  },
  {
    id: 37,
    text: "Deixar de providenciar, a tempo, na esfera de suas atribuições, por negligência ou incúria, medidas contra qualquer irregularidade de que venha a tomar conhecimento.",
    keywords: [
      'negligência', 'negligenciou', 'negligente', 'foi negligente',
      'omissão', 'omitiu', 'se omitiu',
      'descaso', 'descuidado', 'descuidou',
      'irregularidade', 'soube de irregularidade',
      'não agir', 'não agiu', 'deixou de agir',
      'incúria', 'desídia', 'desleixo',
      'não tomou providência', 'deixou passar',
      'fez vista grossa', 'ignorou problema',
      'não corrigiu', 'deixou de corrigir'
    ]
  },
  {
    id: 38,
    text: "Recorrer ao Judiciário sem antes esgotar todos os recursos administrativos.",
    keywords: [
      'judicial', 'judiciário', 'justiça', 'tribunal',
      'processo', 'processo judicial', 'ação judicial',
      'justiça', 'entrou na justiça', 'acionou justiça',
      'recurso', 'recurso administrativo',
      'administrativo', 'via administrativa',
      'antes de esgotar', 'sem esgotar', 'pulou etapa',
      'não tentou administrativamente', 'foi direto à justiça'
    ]
  },
  {
    id: 39,
    text: "Retirar ou tentar retirar de qualquer lugar sob a jurisdição de bombeiro-militar, material, viatura ou objeto ou mesmo deles servir-se, sem ordem do responsável ou proprietário.",
    keywords: [
      'furto', 'furtou', 'furtando',
      'roubo', 'roubou', 'roubando',
      'pegar', 'pegou', 'pegando',
      'retirar', 'retirou', 'retirando',
      'material', 'equipamento', 'bem',
      'viatura', 'veículo', 'carro',
      'sem autorização', 'não autorizado', 'sem permissão',
      'levou sem pedir', 'usou sem autorização',
      'subtraiu', 'subtração', 'apropriou-se',
      'desviou material', 'desapareceu com'
    ]
  },
  {
    id: 40,
    text: "Não zelar devidamente, danificar ou extraviar, por negligência ou desobediência a normas de serviço, material da Fazenda Nacional, Estadual ou Municipal que esteja ou não sob sua responsabilidade direta.",
    keywords: [
      'dano', 'danificou', 'danificando', 'danificar',
      'quebrar', 'quebrou', 'quebrando',
      'perder', 'perdeu', 'perdendo',
      'extraviar', 'extraviou', 'extraviando', 'extravio',
      'material', 'equipamento', 'bem público',
      'negligência', 'negligenciou', 'negligente',
      'destruir', 'destruiu', 'destruindo',
      'estragar', 'estragou', 'estragando',
      'não cuidou', 'descuidou', 'maltratou',
      'inutilizou', 'avariou', 'deteriorou',
      'sumiu com material', 'desapareceu material'
    ]
  },
  {
    id: 41,
    text: "Ter pouco cuidado com o asseio próprio ou coletivo, em qualquer circunstância.",
    keywords: [
      'higiene', 'falta de higiene', 'anti-higiênico',
      'limpeza', 'falta de limpeza', 'sujo',
      'sujo', 'sujeira', 'imundo',
      'asseio', 'falta de asseio', 'desasseado',
      'desleixo', 'desleixado', 'relaxado',
      'aparência', 'má aparência', 'descuidado',
      'fedor', 'mau cheiro', 'cheiro ruim',
      'cabelo sujo', 'barba por fazer', 'unhas sujas',
      'roupa suja', 'uniforme sujo', 'farda suja',
      'não tomou banho', 'sem banho'
    ]
  },
  {
    id: 42,
    text: "Portar-se sem compostura em lugar público.",
    keywords: [
      'comportamento', 'mau comportamento', 'comportou-se mal',
      'indecência', 'indecente', 'ato indecente',
      'público', 'lugar público', 'via pública',
      'escândalo', 'escandalizou', 'causou escândalo',
      'constrangimento', 'constrangeu', 'causou constrangimento',
      'vergonha', 'vergonhoso', 'passou vergonha',
      'vexame', 'vexatório', 'fez vexame',
      'deselegante', 'grosseiro', 'rude',
      'bêbado em público', 'embriagado em público',
      'gritando na rua', 'brigando na rua'
    ]
  },
  {
    id: 43,
    text: "Freqüentar lugares incompatíveis com o seu nível social e o decoro da classe.",
    keywords: [
      'lugar impróprio', 'local impróprio', 'ambiente impróprio',
      'prostíbulo', 'casa de prostituição', 'bordel',
      'zona', 'zona de meretrício', 'área de prostituição',
      'boate', 'boate suspeita', 'casa noturna suspeita',
      'baixo meretrício', 'local de baixo nível',
      'decoro', 'falta de decoro', 'indecoroso',
      'local de drogas', 'boca de fumo', 'ponto de droga',
      'local de jogo ilegal', 'cassino clandestino',
      'frequentou lugar inadequado', 'foi visto em local impróprio'
    ]
  },
  {
    id: 44,
    text: "Permanecer a praça em dependência da OBM, desde que seja estranho ao serviço, ou sem consentimento ou ordem de autoridade competente.",
    keywords: [
      'permanecer', 'permaneceu', 'ficou',
      'sem autorização', 'não autorizado', 'sem permissão',
      'OBM', 'quartel', 'unidade',
      'estranho ao serviço', 'fora de serviço', 'não estava de serviço',
      'ficou no quartel', 'permaneceu na unidade',
      'sem motivo', 'sem justificativa',
      'não tinha o que fazer', 'não deveria estar'
    ]
  },
  {
    id: 45,
    text: "Portar a praça arma regulamentar sem estar de serviço ou sem ordem para tal.",
    keywords: [
      'arma', 'armamento', 'arma de fogo',
      'porte', 'portando arma', 'andando armado',
      'armamento', 'pistola', 'revólver',
      'sem autorização', 'não autorizado', 'sem ordem',
      'fora de serviço', 'não estava de serviço', 'folga',
      'arma regulamentar', 'arma da corporação',
      'saiu armado', 'estava armado sem autorização'
    ]
  },
  {
    id: 46,
    text: "Portar a praça arma não regulamentar sem permissão por escrito de autoridade competente.",
    keywords: [
      'arma', 'arma de fogo', 'armamento',
      'irregular', 'arma irregular', 'arma ilegal',
      'ilegal', 'porte ilegal', 'arma não registrada',
      'não autorizada', 'sem autorização', 'sem registro',
      'porte ilegal', 'arma clandestina',
      'arma particular', 'arma pessoal não autorizada',
      'arma sem documento', 'arma não cadastrada'
    ]
  },
  {
    id: 47,
    text: "Disparar arma com imprudência ou negligência.",
    keywords: [
      'tiro', 'deu tiro', 'efetuou disparo',
      'disparo', 'disparou', 'disparando',
      'acidental', 'disparo acidental', 'tiro acidental',
      'negligente', 'com negligência', 'negligentemente',
      'arma', 'arma de fogo',
      'imprudência', 'imprudente', 'com imprudência',
      'descuido', 'descuidado', 'por descuido',
      'tiro para cima', 'disparou sem querer',
      'arma disparou', 'escapou tiro'
    ]
  },
  {
    id: 48,
    text: "Içar ou arriar bandeira ou insígnia, sem ordem para tal.",
    keywords: [
      'bandeira', 'bandeira nacional', 'bandeira do estado',
      'hasteamento', 'hastear', 'hasteou',
      'insígnia', 'símbolo', 'estandarte',
      'sem ordem', 'sem autorização', 'não autorizado',
      'protocolo', 'quebra de protocolo',
      'arriar', 'arriou', 'baixar bandeira',
      'içar', 'içou', 'subir bandeira'
    ]
  },
  {
    id: 49,
    text: "Dar toques ou fazer sinais, sem ordem para tal.",
    keywords: [
      'corneta', 'corneteiro', 'toque de corneta',
      'sinal', 'sinais', 'sinalização',
      'toque', 'toques', 'deu toque',
      'sem ordem', 'sem autorização', 'não autorizado',
      'protocolo', 'quebra de protocolo',
      'alarme falso', 'sinal falso',
      'tocou sem autorização', 'fez sinal sem ordem'
    ]
  },
  {
    id: 50,
    text: "Conversar ou fazer ruídos em ocasiões, lugares ou horas impróprias.",
    keywords: [
      'barulho', 'fez barulho', 'fazendo barulho',
      'conversa', 'conversou', 'conversando',
      'ruído', 'ruídos', 'fazendo ruído',
      'silêncio', 'quebrou silêncio', 'hora de silêncio',
      'impróprio', 'hora imprópria', 'momento impróprio',
      'perturbação', 'perturbou', 'causou perturbação',
      'algazarra', 'bagunça', 'tumulto',
      'gritou', 'gritando', 'falou alto',
      'conversou durante', 'falou quando não devia'
    ]
  },
  {
    id: 51,
    text: "Espalhar boatos ou notícias tendenciosas.",
    keywords: [
      'fofoca', 'fofocou', 'fofocando', 'fofoqueiro',
      'boato', 'boatos', 'espalhou boato',
      'fake news', 'notícia falsa', 'informação falsa',
      'mentira', 'mentiu', 'mentira',
      'calúnia', 'caluniou', 'calunioso',
      'difamação', 'difamou', 'difamatório',
      'rumor', 'rumores', 'espalhou rumor',
      'inventou história', 'criou história',
      'espalhou conversa', 'contou mentira',
      'tendencioso', 'notícia tendenciosa',
      'desinformação', 'desinformou'
    ]
  },
  {
    id: 52,
    text: "Provocar ou fazer-se causa, voluntariamente, de origem de alarme injustificável",
    keywords: [
      'alarme falso', 'falso alarme', 'alarme desnecessário',
      'pânico', 'causou pânico', 'gerou pânico',
      'emergência falsa', 'emergência inexistente',
      'provocar', 'provocou', 'causou',
      'tumulto', 'tumultuar', 'tumultuou',
      'alarmismo', 'alarmista', 'exagerou',
      'assustou desnecessariamente', 'gerou susto',
      'gritou fogo sem haver', 'disse que tinha problema sem ter'
    ]
  },
  {
    id: 53,
    text: "Usar violência desnecessária no ato de efetuar prisão.",
    keywords: [
      'violência', 'violento', 'foi violento',
      'abuso', 'abusou', 'abuso de autoridade',
      'agressão', 'agrediu', 'agredindo',
      'excesso', 'excedeu', 'uso excessivo',
      'prisão', 'efetuar prisão', 'prender',
      'força desproporcional', 'força excessiva',
      'bateu', 'espancou', 'surrou',
      'machucou', 'feriu', 'lesionou',
      'brutalidade', 'brutal', 'truculento',
      'desproporcional', 'desnecessário'
    ]
  },
  {
    id: 54,
    text: "Maltratar preso sob sua guarda.",
    keywords: [
      'tortura', 'torturou', 'torturando',
      'maus tratos', 'maltratou', 'maltratando',
      'agressão', 'agrediu', 'agredindo',
      'preso', 'detido', 'custodiado',
      'violência', 'violento', 'foi violento',
      'abuso', 'abusou', 'abuso de autoridade',
      'espancou', 'bateu', 'surrou',
      'humilhou', 'humilhação', 'humilhante',
      'tratamento degradante', 'tratamento desumano'
    ]
  },
  {
    id: 55,
    text: "Deixar alguém conversar ou entender-se com preso incomunicável, sem autorização de autoridade competente.",
    keywords: [
      'preso', 'detido', 'custodiado',
      'incomunicável', 'incomunicabilidade',
      'visita', 'visitante', 'recebeu visita',
      'comunicação', 'comunicou-se', 'conversou',
      'sem autorização', 'não autorizado',
      'permitiu contato', 'deixou falar',
      'quebrou incomunicabilidade', 'violou incomunicabilidade'
    ]
  },
  {
    id: 56,
    text: "Conversar com sentinela ou preso incomunicável.",
    keywords: [
      'conversa', 'conversou', 'conversando',
      'sentinela', 'plantão', 'guarda',
      'preso', 'detido', 'incomunicável',
      'incomunicável', 'em incomunicabilidade',
      'proibido', 'proibição', 'violou proibição',
      'falou com sentinela', 'abordou sentinela',
      'falou com preso', 'comunicou-se com preso'
    ]
  },
  {
    id: 57,
    text: "Deixar que preso conservam em seu poder instrumentos ou objetos não permitidos.",
    keywords: [
      'preso', 'detido', 'custodiado',
      'objeto proibido', 'objeto não permitido',
      'contrabando', 'item de contrabando',
      'celular', 'telefone', 'aparelho celular',
      'arma', 'faca', 'objeto cortante',
      'negligência', 'negligenciou', 'foi negligente',
      'não revistou', 'deixou passar',
      'permitiu entrada de objeto', 'não confiscou'
    ]
  },
  {
    id: 58,
    text: "Conversar, sentar-se ou fumar a sentinela ou o plantão da hora, ou ainda, consentir na formação ou permanência de grupo ou de pessoa junto ao seu posto de serviço.",
    keywords: [
      'sentinela', 'plantão', 'guarda', 'posto',
      'plantão da hora', 'de plantão',
      'fumar', 'fumou', 'fumando', 'cigarro',
      'conversar', 'conversou', 'conversando',
      'aglomeração', 'grupo', 'formação de grupo',
      'posto', 'posto de serviço',
      'sentou-se', 'sentado', 'relaxou no posto',
      'pessoas junto ao posto', 'reunião no posto'
    ]
  },
  {
    id: 59,
    text: "Fumar em local de incêndio e em lugares ou ocasiões onde isso seja vedado, ou quando se dirigir a superior.",
    keywords: [
      'fumar', 'fumou', 'fumando', 'cigarro',
      'cigarro', 'acendeu cigarro', 'fumante',
      'incêndio', 'local de incêndio', 'cena de incêndio',
      'proibido', 'proibição', 'vedado',
      'superior', 'na frente de superior', 'perante superior',
      'fumou onde não podia', 'fumou em local proibido',
      'fumou durante ocorrência', 'fumou no incêndio'
    ]
  },
  {
    id: 60,
    text: "Tomar parte em jogos proibidos ou jogar a dinheiro os permitidos, em área de bombeiro-militar ou sob jurisdição de bombeiro-militar.",
    keywords: [
      'jogo', 'jogos', 'jogou', 'jogando',
      'aposta', 'apostou', 'apostando',
      'dinheiro', 'jogar dinheiro', 'valendo dinheiro',
      'cassino', 'jogo de azar', 'cartas',
      'ilegal', 'jogo ilegal', 'jogo proibido',
      'quartel', 'no quartel', 'área militar',
      'baralho', 'truco', 'pôquer', 'poker',
      'apostou dinheiro', 'jogou valendo'
    ]
  },
  {
    id: 61,
    text: "Tomar parte, em área de bombeiro-militar ou sob jurisdição de bombeiro-militar, em discussões a respeito de política ou religião, ou mesmo provocá-la.",
    keywords: [
      'política', 'político', 'partido', 'eleição',
      'religião', 'religiosa', 'religioso', 'igreja',
      'discussão', 'discutiu', 'discutindo',
      'debate', 'debateu', 'debatendo',
      'polêmica', 'polêmico', 'tema polêmico',
      'briga', 'brigou', 'discutiu sobre',
      'provocou discussão', 'iniciou debate',
      'falou de política', 'discutiu religião'
    ]
  },
  {
    id: 62,
    text: "Manifestar-se, publicamente, a respeito de assuntos políticos ou tomar parte, fardado, em manifestações da mesma natureza.",
    keywords: [
      'manifestação', 'manifestou', 'manifestando',
      'política', 'político', 'posição política',
      'protesto', 'protestou', 'protestando',
      'fardado', 'de farda', 'uniformizado',
      'passeata', 'ato público', 'comício',
      'público', 'publicamente', 'em público',
      'posicionou politicamente', 'defendeu partido',
      'criticou governo', 'apoiou candidato'
    ]
  },
  {
    id: 63,
    text: "Deixar o superior de determinar a saída imediata, de solenidade de bombeiro-militar ou civil, de subordinado que a ela compareça em uniforme diferente do previsto.",
    keywords: [
      'uniforme', 'uniforme errado', 'uniforme diferente',
      'solenidade', 'cerimônia', 'evento',
      'traje', 'traje inadequado', 'vestimenta',
      'superior', 'comandante', 'oficial',
      'fardamento', 'fardamento errado',
      'não mandou sair', 'permitiu ficar',
      'deixou permanecer', 'não retirou da solenidade'
    ]
  },
  {
    id: 64,
    text: "Apresentar-se desuniformizado, mal uniformizado ou com o uniforme alterado.",
    keywords: [
      'uniforme', 'uniforme alterado', 'uniforme modificado',
      'fardamento', 'fardamento irregular', 'farda alterada',
      'desalinhado', 'desleixado', 'mal vestido',
      'alterado', 'modificou uniforme', 'adulterou uniforme',
      'desleixo', 'relaxado', 'descuidado',
      'aparência', 'má aparência', 'aspecto irregular',
      'fora do padrão', 'não estava uniformizado corretamente',
      'faltando peça', 'uniforme incompleto',
      'costura diferente', 'bordado irregular'
    ]
  },
  {
    id: 65,
    text: "Sobrepor ao uniforme insígnia ou medalha não regulamentar, bem como, indevidamente distintivo e condecoração.",
    keywords: [
      'insígnia', 'insígnia irregular', 'insígnia falsa',
      'medalha', 'medalha irregular', 'medalha não autorizada',
      'distintivo', 'distintivo falso', 'distintivo não autorizado',
      'condecoração', 'condecoração indevida',
      'irregular', 'não regulamentar', 'não autorizado',
      'uniforme', 'no uniforme',
      'usou medalha que não tem', 'colocou insígnia falsa',
      'ostentou condecoração indevida'
    ]
  },
  {
    id: 66,
    text: "Andar o bombeiro-militar a pé ou em coletivos públicos com o uniforme inadequado contrariando o RUCBERJ ou normas a respeito.",
    keywords: [
      'uniforme', 'uniforme inadequado', 'fardamento errado',
      'transporte público', 'ônibus', 'metrô', 'trem',
      'rua', 'via pública', 'andando na rua',
      'fardamento inadequado', 'farda incorreta',
      'RUCBERJ', 'norma de uniforme',
      'a pé', 'andando', 'caminhando',
      'vestido inadequadamente', 'com uniforme errado na rua'
    ]
  },
  {
    id: 67,
    text: "Usar trajes civil, o cabo ou soldado, quando isso contrariar ordem de autoridade competente.",
    keywords: [
      'paisano', 'à paisana', 'de paisano',
      'traje civil', 'roupa civil', 'roupas civis',
      'roupa civil', 'vestido de civil',
      'sem farda', 'não fardado', 'sem uniforme',
      'desobediência', 'contrariou ordem', 'descumpriu ordem',
      'deveria estar fardado', 'mandou estar uniformizado'
    ]
  },
  {
    id: 68,
    text: "Ser indiscreto em relação a assuntos de caráter oficial cuja divulgação possa ser prejudicial à disciplina ou à boa ordem do serviço.",
    keywords: [
      'indiscrição', 'indiscreto', 'foi indiscreto',
      'sigilo', 'sigiloso', 'quebrou sigilo',
      'vazamento', 'vazou', 'vazou informação',
      'informação', 'informação sigilosa', 'dado sigiloso',
      'confidencial', 'documento confidencial',
      'fofoca', 'fofocou', 'contou',
      'revelou', 'divulgou', 'comentou',
      'falou o que não devia', 'contou segredo',
      'expôs informação', 'revelou assunto interno'
    ]
  },
  {
    id: 69,
    text: "Dar conhecimento de fatos, documentos ou assuntos de bombeiros-militares a quem deles não deva ter conhecimento e não tenha atribuições para nele intervir.",
    keywords: [
      'vazamento', 'vazou', 'vazou informação',
      'sigilo', 'sigiloso', 'quebrou sigilo',
      'documento', 'documentos', 'documento interno',
      'informação', 'informação interna', 'assunto interno',
      'divulgar', 'divulgou', 'revelou',
      'revelar', 'revelou segredo', 'contou',
      'passou informação', 'compartilhou documento',
      'mostrou documento', 'deixou ver documento',
      'pessoa não autorizada', 'quem não deveria saber'
    ]
  },
  {
    id: 70,
    text: "Publicar ou contribuir para que sejam publicados fatos, documentos ou assuntos de bombeiros-militares que possam concorrer para o desprestígio da Corporação ou firam a disciplina ou a segurança.",
    keywords: [
      'publicar', 'publicou', 'publicando',
      'imprensa', 'mídia', 'jornal', 'TV', 'rádio',
      'rede social', 'redes sociais', 'internet',
      'expor', 'expôs', 'expondo',
      'divulgar', 'divulgou', 'divulgando',
      'desprestígio', 'manchar imagem', 'prejudicar imagem',
      'Facebook', 'Instagram', 'Twitter', 'WhatsApp', 'TikTok',
      'postou', 'compartilhou', 'divulgou online',
      'deu entrevista', 'falou para imprensa',
      'gravou vídeo', 'fez live', 'transmitiu'
    ]
  },
  {
    id: 71,
    text: "Entrar ou sair de qualquer OBM, o cabo ou soldado, com objetos ou embrulhos, sem autorização do comandante da guarda ou autorização similar.",
    keywords: [
      'entrada', 'entrou', 'entrando',
      'saída', 'saiu', 'saindo',
      'objeto', 'objetos', 'carregando objeto',
      'embrulho', 'embrulhos', 'pacote',
      'autorização', 'sem autorização', 'não autorizado',
      'guarita', 'portaria', 'entrada do quartel',
      'passou com objeto', 'levou embrulho',
      'não mostrou', 'não declarou'
    ]
  },
  {
    id: 72,
    text: "Deixar o oficial BM ou aspirante-a-oficial BM ao entrar em OBM onde não sirva, de dar ciência de sua presença ao oficial de dia e, em seguida, de procurar o comandante ou o mais graduado dos oficiais BM presentes, para cumprimentá-lo.",
    keywords: [
      'apresentação', 'apresentar-se', 'não se apresentou',
      'oficial', 'oficial visitante', 'aspirante',
      'visita', 'visitou', 'foi visitar',
      'cumprimento', 'cumprimentar', 'não cumprimentou',
      'protocolo', 'quebra de protocolo',
      'hierarquia', 'respeito hierárquico',
      'oficial de dia', 'não procurou oficial de dia',
      'comandante', 'não procurou comandante'
    ]
  },
  {
    id: 73,
    text: "Deixar o subtenente, sargento, cabo ou soldado BM, ao entrar em OBM onde não sirva, de apresentar-se ao oficial de dia ou seu substituto legal.",
    keywords: [
      'apresentação', 'apresentar-se', 'não se apresentou',
      'praça', 'subtenente', 'sargento', 'cabo', 'soldado',
      'visita', 'visitou', 'foi visitar',
      'oficial de dia', 'não procurou oficial de dia',
      'protocolo', 'quebra de protocolo',
      'OBM', 'outra OBM', 'unidade que não serve'
    ]
  },
  {
    id: 74,
    text: "Deixar o comandante da guarda ou agente de segurança correspondente de cumprir as prescrições regulamentares com respeito à entrada ou à permanência na OBM de civis, militares ou bombeiros-militares estranhos à mesma.",
    keywords: [
      'guarda', 'comandante da guarda', 'guarita',
      'entrada', 'controle de entrada', 'acesso',
      'visitante', 'visitas', 'pessoa de fora',
      'civil', 'civis', 'pessoa civil',
      'controle', 'controle de acesso',
      'segurança', 'agente de segurança',
      'não controlou entrada', 'deixou entrar sem registro',
      'não verificou', 'não conferiu'
    ]
  },
  {
    id: 75,
    text: "Penetrar o bombeiro-militar, sem permissão ou ordem, em aposentos destinados a superior ou onde esse se ache, bem como, em qualquer lugar onde a entrada lhe seja vedada.",
    keywords: [
      'invadir', 'invadiu', 'invadindo', 'invasão',
      'entrada proibida', 'local proibido', 'acesso vedado',
      'aposento', 'sala', 'gabinete',
      'superior', 'sala do superior', 'gabinete do comandante',
      'sem permissão', 'sem autorização', 'não autorizado',
      'entrou onde não podia', 'entrou sem permissão',
      'adentrou indevidamente', 'acessou local proibido'
    ]
  },
  {
    id: 76,
    text: "Penetrar ou tentar penetrar o bombeiro-militar em alojamento de outra OBM, depois da revista do recolher, salvo os oficiais ou sargentos, que, pelas suas funções, sejam a isto obrigado.",
    keywords: [
      'alojamento', 'alojamento de outra OBM',
      'recolher', 'revista do recolher', 'após recolher',
      'entrada', 'entrou', 'tentou entrar',
      'noite', 'durante a noite', 'horário de silêncio',
      'invasão', 'invadiu alojamento',
      'não autorizado', 'sem permissão'
    ]
  },
  {
    id: 77,
    text: "Entrar ou sair de OBM com força armada, sem prévio conhecimento ou ordem da autoridade competente.",
    keywords: [
      'força armada', 'armado', 'com armas',
      'arma', 'armamento', 'armas',
      'entrada', 'entrou', 'entrando',
      'saída', 'saiu', 'saindo',
      'sem autorização', 'sem conhecimento', 'sem ordem',
      'grupo armado', 'tropa armada'
    ]
  },
  {
    id: 78,
    text: "Abrir ou tentar abrir qualquer dependência da OBM fora das horas de expediente, desde que não seja respectivo chefe ou sem a sua ordem escrita com a expressa declaração de motivo, salvo situações de emergência.",
    keywords: [
      'abrir', 'abriu', 'abrindo',
      'dependência', 'sala', 'seção', 'almoxarifado',
      'fora do expediente', 'fora do horário', 'após expediente',
      'sem autorização', 'sem ordem escrita', 'sem permissão',
      'invasão', 'entrou após expediente',
      'tentou abrir', 'forçou entrada'
    ]
  },
  {
    id: 79,
    text: "Desrespeitar regras de trânsito, medidas gerais de ordem policial, judicial ou administrativa.",
    keywords: [
      'trânsito', 'regra de trânsito', 'lei de trânsito',
      'multa', 'multa de trânsito', 'foi multado',
      'infração', 'infração de trânsito', 'cometeu infração',
      'desrespeito', 'desrespeitou', 'descumpriu',
      'lei', 'legislação', 'norma',
      'regra', 'regras', 'regulamento',
      'avançou sinal', 'excesso de velocidade',
      'estacionou em local proibido', 'ultrapassou em local proibido',
      'dirigiu embriagado', 'sem cinto', 'no celular'
    ]
  },
  {
    id: 80,
    text: "Deixar de portar, o bombeiro-militar, o seu documento de identidade, estando ou não fardado ou de exibi-la quando solicitado.",
    keywords: [
      'identidade', 'carteira de identidade', 'documento de identidade',
      'documento', 'documentos', 'documentação',
      'RG', 'carteira funcional', 'identidade militar',
      'não portar', 'não portava', 'não tinha',
      'esqueceu', 'esqueceu documento', 'deixou em casa',
      'não apresentou', 'não exibiu', 'se recusou a mostrar'
    ]
  },
  {
    id: 81,
    text: "Maltratar ou não ter o devido cuidado no trato com os animais.",
    keywords: [
      'animal', 'animais', 'animal da corporação',
      'maus tratos', 'maltratou', 'maltratando',
      'cão', 'cachorro', 'cão farejador',
      'cachorro', 'cão de busca',
      'maltrato', 'maltratar', 'tratou mal',
      'crueldade', 'cruel', 'foi cruel',
      'negligência com animal', 'não cuidou',
      'deixou sem água', 'deixou sem comida',
      'bateu no animal', 'chutou animal'
    ]
  },
  {
    id: 82,
    text: "Desrespeitar em público as convenções sociais.",
    keywords: [
      'desrespeito', 'desrespeitou', 'desrespeitando',
      'público', 'em público', 'lugar público',
      'convenção', 'convenção social', 'regra social',
      'comportamento', 'mau comportamento', 'comportou-se mal',
      'indecência', 'indecente', 'ato indecente',
      'grosseria', 'grosseiro', 'foi grosseiro',
      'constrangimento', 'constrangeu', 'causou constrangimento'
    ]
  },
  {
    id: 83,
    text: "Desconsiderar ou desrespeitar a autoridade civil.",
    keywords: [
      'autoridade civil', 'autoridade pública',
      'desrespeito', 'desrespeitou', 'desrespeitando',
      'prefeito', 'governador', 'deputado', 'vereador',
      'político', 'autoridade política',
      'tratou mal autoridade', 'desacatou autoridade',
      'ignorou autoridade', 'não obedeceu autoridade civil',
      'desafiou', 'confrontou', 'afrontou'
    ]
  },
  {
    id: 84,
    text: "Desrespeitar corporação judiciária, ou qualquer de seus membros, bem como criticar, em público ou pela imprensa, seus atos e decisões.",
    keywords: [
      'juiz', 'juíza', 'magistrado',
      'tribunal', 'justiça', 'poder judiciário',
      'justiça', 'sistema judiciário',
      'desrespeito', 'desrespeitou', 'desacatou',
      'crítica', 'criticou', 'criticando',
      'judiciário', 'decisão judicial', 'sentença',
      'falou mal do juiz', 'criticou sentença',
      'desacatou magistrado', 'afrontou justiça'
    ]
  },
  {
    id: 85,
    text: "Não se apresentar a superior hierárquico ou de sua presença retirar-se, sem obediência às normas regulamentares.",
    keywords: [
      'apresentação', 'apresentar-se', 'não se apresentou',
      'superior', 'superior hierárquico', 'oficial',
      'hierarquia', 'respeito hierárquico',
      'continência', 'não fez continência', 'sem continência',
      'respeito', 'falta de respeito',
      'sair', 'saiu', 'retirou-se',
      'virou as costas', 'saiu sem pedir licença',
      'não cumprimentou', 'ignorou presença'
    ]
  },
  {
    id: 86,
    text: "Deixar, quando estiver sentado, de oferecer seu lugar a superior, ressalvadas as exceções previstas no Regulamento de Continências, Honras e Sinais de Respeito das Forças Armadas.",
    keywords: [
      'assento', 'lugar', 'cadeira',
      'lugar', 'ceder lugar', 'oferecer lugar',
      'superior', 'oficial', 'hierarquia',
      'respeito', 'falta de respeito', 'desrespeito',
      'continência', 'honras', 'protocolo',
      'hierarquia', 'hierárquico',
      'não levantou', 'permaneceu sentado',
      'não ofereceu lugar', 'não cedeu assento'
    ]
  },
  {
    id: 87,
    text: "Sentar-se a praça, em público, à mesa em que estiver oficial ou vice-versa, salvo em solenidade, festividade ou reuniões sociais.",
    keywords: [
      'mesa', 'sentar à mesa', 'mesma mesa',
      'sentar', 'sentou', 'sentando',
      'oficial', 'oficiais',
      'praça', 'praças',
      'público', 'em público', 'local público',
      'hierarquia', 'quebra de hierarquia',
      'sentou com oficial', 'dividiu mesa'
    ]
  },
  {
    id: 88,
    text: "Deixar, deliberadamente, de corresponder a cumprimento de subordinado.",
    keywords: [
      'cumprimento', 'cumprimentar', 'saudação',
      'ignorar', 'ignorou', 'ignorando',
      'subordinado', 'praça', 'inferior hierárquico',
      'desprezo', 'desprezou', 'desprezando',
      'continência', 'não retribuiu continência',
      'não respondeu cumprimento', 'deixou sem resposta',
      'fingiu não ver', 'virou a cara'
    ]
  },
  {
    id: 89,
    text: "Deixar o subordinado, quer uniformizado, quer em traje civil, de cumprimentar superior, uniformizado ou não, neste caso desde que o conheça, ou prestar-lhe as homenagens e sinais regulamentares de consideração e respeito.",
    keywords: [
      'continência', 'não fez continência', 'sem continência',
      'cumprimento', 'não cumprimentou', 'deixou de cumprimentar',
      'superior', 'oficial', 'superior hierárquico',
      'respeito', 'falta de respeito', 'desrespeito',
      'homenagem', 'não prestou homenagem',
      'saudação', 'não saudou',
      'passou sem cumprimentar', 'ignorou superior',
      'não bateu continência', 'fingiu não ver'
    ]
  },
  {
    id: 90,
    text: "Deixar ou negar-se a receber vencimento, alimentação, fardamento, equipamento ou material que lhe seja destinado ou deva ficar em seu poder ou sob sua responsabilidade.",
    keywords: [
      'recusar', 'recusou', 'se recusou',
      'vencimento', 'salário', 'pagamento',
      'fardamento', 'uniforme', 'farda',
      'equipamento', 'material', 'EPI',
      'material', 'materiais',
      'negar', 'negou', 'não quis receber',
      'não aceitou', 'rejeitou', 'devolveu',
      'se negou a pegar', 'não assinou recebimento'
    ]
  },
  {
    id: 91,
    text: "Deixar o bombeiro-militar, presente a solenidades internas ou externas onde se encontrem superiores hierárquicos, de saudá-los de acordo com as normas regulamentares.",
    keywords: [
      'solenidade', 'cerimônia', 'evento',
      'saudação', 'saudar', 'não saudou',
      'superior', 'superiores', 'superior hierárquico',
      'continência', 'não fez continência',
      'protocolo', 'quebra de protocolo',
      'não cumprimentou', 'ignorou',
      'não prestou homenagem', 'deixou de saudar'
    ]
  },
  {
    id: 92,
    text: "Deixar o oficial BM ou aspirante-a-oficial BM, tão logo seus afazeres o permitam, de apresentar-se ao de maior posto e ao substituto legal imediato, da OBM onde serve, para cumprimentá-lo.",
    keywords: [
      'apresentação', 'apresentar-se', 'não se apresentou',
      'oficial', 'aspirante', 'oficial BM',
      'cumprimento', 'cumprimentar', 'não cumprimentou',
      'posto', 'maior posto', 'oficial mais antigo',
      'protocolo', 'quebra de protocolo',
      'não foi cumprimentar', 'deixou de apresentar-se'
    ]
  },
  {
    id: 93,
    text: "Deixar o subtenente BM ou o sargento BM, tão logo seus afazeres o permitam, de apresentar-se ao seu comandante ou chefe imediato.",
    keywords: [
      'apresentação', 'apresentar-se', 'não se apresentou',
      'subtenente', 'sargento', 'graduado',
      'comandante', 'chefe imediato', 'superior',
      'chefe', 'chefe direto',
      'não foi apresentar-se', 'deixou de apresentar-se',
      'não cumprimentou chefe', 'não foi ao chefe'
    ]
  },
  {
    id: 94,
    text: "Dirigir-se, referir-se ou responder de maneira desatenciosa a superior.",
    keywords: [
      'desrespeito', 'desrespeitou', 'foi desrespeitoso',
      'grosseria', 'grosseiro', 'foi grosseiro',
      'superior', 'oficial', 'superior hierárquico',
      'desatenção', 'desatencioso', 'tratou mal',
      'mal educado', 'falta de educação', 'sem educação',
      'falta de respeito', 'desacato', 'desacatou',
      'responder', 'respondeu mal', 'respondeu atravessado',
      'desacato', 'desacatou', 'insubordinação',
      'retrucou', 'confrontou', 'enfrentou',
      'falou de forma inadequada', 'tom inadequado',
      'gritou com superior', 'levantou a voz'
    ]
  },
  {
    id: 95,
    text: "Censurar ato de superior ou procurar desconsiderá-lo.",
    keywords: [
      'criticar', 'criticou', 'criticando',
      'censurar', 'censurou', 'censurando',
      'superior', 'oficial', 'superior hierárquico',
      'desrespeito', 'desrespeitou', 'desrespeitando',
      'desconsiderar', 'desconsiderou', 'diminuir',
      'diminuir', 'diminuiu', 'menosprezou',
      'questionou autoridade', 'contestou decisão',
      'falou mal de superior', 'criticou ordem'
    ]
  },
  {
    id: 96,
    text: "Procurar desacreditar seu igual ou subordinado.",
    keywords: [
      'desacreditar', 'desacreditou', 'desacreditando',
      'difamar', 'difamou', 'difamando',
      'fofoca', 'fofocou', 'espalhou fofoca',
      'humilhar', 'humilhou', 'humilhando',
      'subordinado', 'colega', 'igual',
      'colega', 'companheiro', 'camarada',
      'falou mal de colega', 'desmereceu colega',
      'expôs colega', 'ridicularizou'
    ]
  },
  {
    id: 97,
    text: "Ofender, provocar ou desafiar superior.",
    keywords: [
      'ofensa', 'ofendeu', 'ofendendo',
      'provocação', 'provocou', 'provocando',
      'desafio', 'desafiou', 'desafiando',
      'superior', 'oficial', 'superior hierárquico',
      'desrespeito', 'desrespeitou', 'desacato',
      'afronta', 'afrontou', 'afrontando',
      'insulto', 'insultou', 'xingou',
      'encarou', 'intimidou', 'ameaçou',
      'chamou para briga', 'quis brigar com superior'
    ]
  },
  {
    id: 98,
    text: "Ofender, provocar ou desfiar seu igual ou subordinado.",
    keywords: [
      'ofensa', 'ofendeu', 'ofendendo',
      'provocação', 'provocou', 'provocando',
      'colega', 'subordinado', 'companheiro',
      'subordinado', 'praça', 'inferior',
      'bullying', 'perseguição', 'perseguiu',
      'assédio', 'assediou', 'assediando',
      'insulto', 'insultou', 'xingou',
      'humilhou', 'zoou', 'debochou',
      'chamou para briga', 'quis brigar'
    ]
  },
  {
    id: 99,
    text: "Ofender a moral por atos, gestos ou palavras.",
    keywords: [
      'imoralidade', 'imoral', 'ato imoral',
      'obsceno', 'obscenidade', 'ato obsceno',
      'vulgar', 'vulgaridade', 'linguagem vulgar',
      'ofensa', 'ofendeu', 'ofensa moral',
      'indecência', 'indecente', 'ato indecente',
      'palavrão', 'palavrões', 'xingamento',
      'gesto obsceno', 'gesto indecente', 'gesto vulgar',
      'mostrou partes íntimas', 'exposição indecente',
      'fez gesto obsceno', 'fez sinal obsceno'
    ]
  },
  {
    id: 100,
    text: "Travar discussão, rixa ou luta corporal com seu igual ou subordinado.",
    keywords: [
      'briga', 'brigou', 'brigando', 'brigar',
      'confusão', 'arrumou confusão', 'causou confusão',
      'agressão', 'agrediu', 'agredindo', 'agredir',
      'combate', 'combater', 'lutou',
      'discutir', 'discutiu', 'discussão',
      'altercação', 'altercou', 'bate-boca',
      'rixa', 'rixou', 'entraram em rixa',
      'luta', 'lutou', 'luta corporal',
      'soco', 'socou', 'deu soco', 'socos',
      'pancada', 'deu pancada', 'pancadaria',
      'violência', 'foi violento', 'ato violento',
      'empurrou', 'empurrão', 'empurrões',
      'bateu', 'apanhou', 'trocaram socos',
      'saíram no braço', 'partiram para agressão'
    ]
  },
  {
    id: 101,
    text: "Discutir ou provocar discussões, por qualquer veículo de comunicação, sobre assuntos políticos, militares ou de bombeiro-militar, excetuando-se os de natureza exclusivamente técnica, quando devidamente autorizado.",
    keywords: [
      'discussão', 'discutiu', 'discutindo',
      'rede social', 'redes sociais', 'mídias sociais',
      'internet', 'online', 'virtual',
      'política', 'político', 'assunto político',
      'polêmica', 'polêmico', 'tema polêmico',
      'whatsapp', 'WhatsApp', 'grupo de WhatsApp',
      'facebook', 'Facebook', 'postou no Facebook',
      'Instagram', 'Twitter', 'TikTok',
      'comentou', 'postou', 'publicou',
      'provocou debate', 'iniciou discussão online'
    ]
  },
  {
    id: 102,
    text: "Autorizar, promover ou tomar parte em qualquer manifestação coletiva, seja de caráter reivindicatório, seja de crítica ou de apoio a ato superior, com exceção das demonstrações íntimas de boa e sã camaradagem e com conhecimento do homenageado.",
    keywords: [
      'manifestação', 'manifestou', 'manifestação coletiva',
      'protesto', 'protestou', 'protestando',
      'reivindicação', 'reivindicou', 'reivindicando',
      'coletivo', 'movimento coletivo', 'ação coletiva',
      'abaixo assinado', 'abaixo-assinado', 'petição',
      'passeata', 'marcha', 'ato público',
      'organizou manifestação', 'convocou ato',
      'participou de protesto', 'aderiu a manifestação'
    ]
  },
  {
    id: 103,
    text: "Aceitar o bombeiro-militar qualquer manifestação coletiva de seus subordinados, salvo a exceção do número anterior.",
    keywords: [
      'manifestação', 'manifestação de subordinados',
      'subordinado', 'subordinados', 'praças',
      'coletivo', 'movimento coletivo', 'ação coletiva',
      'aceitar', 'aceitou', 'aceitando',
      'homenagem', 'homenagem não autorizada',
      'recebeu manifestação', 'permitiu manifestação'
    ]
  },
  {
    id: 104,
    text: "Autorizar, promover ou assinar petições coletivas dirigidas a qualquer autoridade civil ou bombeiro-militar.",
    keywords: [
      'petição', 'petições', 'petição coletiva',
      'abaixo assinado', 'abaixo-assinado', 'lista de assinaturas',
      'coletivo', 'documento coletivo', 'carta coletiva',
      'assinatura', 'assinou', 'assinando',
      'documento', 'carta', 'requerimento coletivo',
      'organizou petição', 'promoveu petição',
      'assinou documento coletivo', 'aderiu a petição'
    ]
  },
  {
    id: 105,
    text: "Dirigir memoriais ou petições, a qualquer autoridade, sobre assuntos de alçada do Comando-Geral do CBERJ, salvo em grau de recurso, na forma prevista neste Regulamento.",
    keywords: [
      'memorial', 'memoriais', 'documento memorial',
      'petição', 'petições', 'requerimento',
      'comando geral', 'Comando-Geral', 'CBERJ',
      'autoridade', 'autoridade externa', 'autoridade civil',
      'recurso', 'grau de recurso',
      'passou por cima', 'foi direto a autoridade',
      'não seguiu canal adequado', 'burlou hierarquia'
    ]
  },
  {
    id: 106,
    text: "Ter em seu poder, introduzir ou distribuir, em área de bombeiro-militar ou sob a jurisdição de bombeiro-militar publicações, estampas ou jornais que atentem contra disciplina ou a moral.",
    keywords: [
      'material proibido', 'material inadequado', 'publicação proibida',
      'pornografia', 'pornográfico', 'material pornográfico',
      'jornal', 'revista', 'publicação',
      'publicação', 'impresso', 'folheto',
      'imoral', 'contra a moral', 'atentado à moral',
      'indecente', 'indecência', 'obsceno',
      'trouxe material', 'distribuiu material',
      'mostrou revista', 'passou revista'
    ]
  },
  {
    id: 107,
    text: "Ter em seu poder ou introduzir, em área de bombeiro-militar ou sob a jurisdição de bombeiro-militar, inflamável ou explosivo, sem permissão da autoridade competente.",
    keywords: [
      'explosivo', 'explosivos', 'material explosivo',
      'inflamável', 'inflamáveis', 'material inflamável',
      'bomba', 'artefato explosivo', 'granada',
      'combustível', 'gasolina', 'álcool',
      'perigoso', 'material perigoso',
      'proibido', 'sem autorização', 'não permitido',
      'trouxe explosivo', 'entrou com inflamável',
      'guardou material perigoso'
    ]
  },
  {
    id: 108,
    text: "Ter em seu poder, introduzir ou distribuir, em área de bombeiro-militar ou sob a jurisdição de bombeiro-militar, tóxicos, ou entorpecentes, a não ser mediante prescrição de autoridade competente.",
    keywords: [
      'droga', 'drogas', 'entorpecente',
      'entorpecente', 'entorpecentes', 'substância entorpecente',
      'tóxico', 'tóxicos', 'substância tóxica',
      'maconha', 'cannabis', 'erva',
      'cocaína', 'crack', 'pó',
      'tráfico', 'traficou', 'vendeu droga',
      'usar droga', 'usou droga', 'consumiu droga',
      'trouxe droga', 'entrou com droga',
      'distribuiu droga', 'passou droga',
      'estava com droga', 'foi pego com droga'
    ]
  },
  {
    id: 109,
    text: "Ter em seu poder ou introduzir, em área de bombeiro-militar ou sob jurisdição de bombeiro-militar, bebidas alcoólicas, salvo quando devidamente autorizado.",
    keywords: [
      'álcool', 'bebida alcoólica', 'bebida',
      'bebida', 'bebidas', 'garrafa',
      'cerveja', 'cervejas', 'latinha',
      'cachaça', 'pinga', 'aguardente',
      'embriaguez', 'beber', 'bebendo',
      'beber', 'bebeu', 'tomou',
      'trouxe bebida', 'entrou com bebida',
      'guardou bebida', 'escondeu bebida',
      'whisky', 'vodka', 'vinho', 'destilado'
    ]
  },
  {
    id: 110,
    text: "Fazer uso, estar sob ação ou introduzir outrem a uso de tóxicos, entorpecentes ou produtos alucinógenos.",
    keywords: [
      'droga', 'drogas', 'usou droga',
      'entorpecente', 'entorpecentes', 'substância',
      'drogado', 'sob efeito', 'alterado',
      'chapado', 'estava chapado', 'alterado por drogas',
      'alucinógeno', 'alucinógenos', 'substância alucinógena',
      'usar droga', 'usou droga', 'fez uso',
      'tóxico', 'tóxicos', 'intoxicado',
      'induziu a usar', 'ofereceu droga',
      'estava sob efeito', 'apresentava sinais de uso'
    ]
  },
  {
    id: 111,
    text: "Embriagar-se ou induzir outro à embriaguez, embora tal estado não tenha sido constatado por médico.",
    keywords: [
      'bêbado', 'estava bêbado', 'ficou bêbado',
      'embriaguez', 'embriagado', 'embriagar-se',
      'alcoolizado', 'estava alcoolizado', 'ficou alcoolizado',
      'bebida', 'bebeu demais', 'tomou demais',
      'álcool', 'álcool em excesso', 'abusou do álcool',
      'embriagar', 'se embriagou', 'ficou embriagado',
      'induziu a beber', 'fez beber', 'levou a beber',
      'estava alterado', 'cheiro de álcool', 'hálito alcoólico',
      'cambaleando', 'mal conseguia andar', 'fala arrastada'
    ]
  },
  {
    id: 112,
    text: "Usar o uniforme, quando de folga, se isso contrariar ordem de autoridade competente.",
    keywords: [
      'uniforme', 'usou uniforme', 'vestiu uniforme',
      'folga', 'dia de folga', 'estava de folga',
      'farda', 'fardado', 'de farda',
      'fardado', 'estava fardado', 'andou fardado',
      'sem autorização', 'contrariando ordem', 'foi proibido',
      'saiu fardado', 'andou de farda',
      'foi proibido usar', 'descumpriu ordem'
    ]
  },
  {
    id: 113,
    text: "Usar, quando uniformizado, barba, cabelos, bigode ou costeletas excessivamente comprido ou exagerados, contrariando disposições a respeito.",
    keywords: [
      'barba', 'barba grande', 'barbudo',
      'cabelo', 'cabelo comprido', 'cabelo grande',
      'bigode', 'bigode grande', 'bigodudo',
      'costeleta', 'costeletas', 'costeletas grandes',
      'aparência', 'má aparência', 'desleixado',
      'desleixo', 'relaxado', 'fora do padrão',
      'irregular', 'não estava no padrão',
      'cabelo fora do corte', 'não fez a barba',
      'corte irregular', 'apresentação pessoal inadequada'
    ]
  },
  {
    id: 114,
    text: "Utilizar ou autorizar a utilização dos subordinados para serviços não previstos em regulamento.",
    keywords: [
      'serviço particular', 'serviço pessoal', 'bico',
      'subordinado', 'subordinados', 'utilizou subordinado',
      'exploração', 'explorou', 'explorar',
      'desvio função', 'desvio de função', 'desviou função',
      'trabalho pessoal', 'favor pessoal', 'serviço doméstico',
      'mandou fazer serviço particular', 'usou para serviço pessoal',
      'trabalhou na casa', 'fez serviço doméstico',
      'mandou buscar', 'mandou fazer compras'
    ]
  },
  {
    id: 115,
    text: "Dar por escrito ou verbalmente, ordem ilegal ou claramente inexeqüível, que possa acarretar ao subordinado responsabilidade, ainda que não chegue a ser comprida.",
    keywords: [
      'ordem ilegal', 'ordem irregular', 'ordem abusiva',
      'abuso', 'abusou', 'abuso de poder',
      'inexequível', 'ordem impossível', 'impossível de cumprir',
      'subordinado', 'mandou subordinado',
      'irregular', 'ilegalidade', 'ordem arbitrária',
      'mandou fazer algo ilegal', 'ordenou irregularidade',
      'deu ordem absurda', 'passou ordem que não podia'
    ]
  },
  {
    id: 116,
    text: "Prestar informação a superior induzindo-o a erro deliberada ou intencionalmente.",
    keywords: [
      'mentir', 'mentiu', 'mentiu para superior',
      'enganar', 'enganou', 'enganou superior',
      'induzir erro', 'induziu a erro', 'levou a erro',
      'superior', 'oficial', 'comandante',
      'informação falsa', 'informou errado', 'passou informação falsa',
      'deliberado', 'deliberadamente', 'propositalmente',
      'manipulou informação', 'distorceu informação',
      'fez parecer', 'deu impressão errada',
      'omitiu para enganar', 'contou apenas parte'
    ]
  },
  {
    id: 117,
    text: "Omitir, em nota de ocorrência, relatório ou qualquer documento, dados indispensáveis ao esclarecimento dos fatos.",
    keywords: [
      'omissão', 'omitiu', 'omitindo',
      'relatório', 'relatório incompleto', 'relatório falho',
      'documento', 'documentação', 'documento incompleto',
      'ocorrência', 'nota de ocorrência', 'boletim',
      'esconder', 'escondeu', 'ocultou',
      'não informar', 'não informou', 'deixou de informar',
      'faltou informação', 'informação incompleta',
      'não mencionou', 'deixou de mencionar',
      'não registrou', 'deixou de registrar'
    ]
  },
  {
    id: 118,
    text: "Violar ou Deixar de preservar local de crime.",
    keywords: [
      'local de crime', 'cena de crime', 'local do crime',
      'preservar', 'preservação', 'não preservou',
      'violar', 'violou', 'violando',
      'contaminação', 'contaminou', 'contaminando',
      'prova', 'provas', 'evidência',
      'perícia', 'pericial', 'trabalho pericial',
      'mexeu no local', 'alterou local',
      'não isolou', 'deixou pessoas entrarem',
      'permitiu acesso', 'não cercou área'
    ]
  },
  {
    id: 119,
    text: "Soltar preso ou detido ou dispensar parte de ocorrência sem ordem de autoridade competente.",
    keywords: [
      'soltar preso', 'soltou preso', 'liberou preso',
      'liberar', 'liberou', 'liberando',
      'detido', 'soltou detido', 'liberou detido',
      'ocorrência', 'dispensou ocorrência',
      'sem autorização', 'sem ordem', 'por conta própria',
      'mandou embora', 'deixou ir',
      'dispensou vítima', 'dispensou testemunha',
      'não levou para delegacia', 'liberou no local'
    ]
  },
  {
    id: 120,
    text: "Participar o bombeiro-militar da ativa, de firma comercial, de emprego industrial de qualquer natureza, ou nelas exercer função ou emprego remunerado, salvo como acionista ou quotista em sociedade anônima ou por cotas de responsabilidade limitada.",
    keywords: [
      'empresa', 'empresário', 'dono de empresa',
      'comércio', 'comerciante', 'loja',
      'bico', 'trabalho paralelo', 'segundo emprego',
      'emprego paralelo', 'outro emprego', 'emprego fora',
      'trabalho extra', 'renda extra', 'atividade paralela',
      'CNPJ', 'abriu empresa', 'tem CNPJ',
      'trabalha fora', 'faz bico', 'tem outro trabalho',
      'sócio de empresa', 'administra empresa'
    ]
  },
  {
    id: 121,
    text: "Transportar em viatura ou viaturas de que é responsável pessoas estranhas sem permissão da autoridade competente, salvo quando a comprovada natureza do serviço assim o exigir.",
    keywords: [
      'viatura', 'veículo', 'carro oficial',
      'carona', 'deu carona', 'levou carona',
      'transporte', 'transportou', 'levou pessoa',
      'pessoa estranha', 'terceiro', 'civil',
      'sem autorização', 'não autorizado', 'sem permissão',
      'levou conhecido', 'transportou familiar',
      'deu carona para amigo', 'levou pessoa não autorizada'
    ]
  },
  {
    id: 122,
    text: "Não observar as ordens em vigor relativas ao tráfego nas saídas e regressos de socorros, bem como nos deslocamentos de viaturas nas imediações e interior dos quartéis, quando não estiverem em serviço de socorros.",
    keywords: [
      'trânsito', 'regra de trânsito', 'norma de trânsito',
      'viatura', 'viaturas', 'veículo',
      'velocidade', 'excesso de velocidade', 'alta velocidade',
      'direção', 'dirigiu', 'condução',
      'quartel', 'interior do quartel', 'pátio',
      'deslocamento', 'deslocou', 'movimento',
      'dirigiu rápido demais', 'não respeitou limite',
      'manobra perigosa', 'direção imprudente'
    ]
  },
  {
    id: 123,
    text: "Executar exercícios profissionais que envolvam acentuados perigos, sem autorização superior, salvos nos casos de competições, demonstrações, etc., em que haverá um responsável.",
    keywords: [
      'exercício perigoso', 'atividade perigosa', 'treinamento arriscado',
      'risco', 'arriscado', 'de risco',
      'sem autorização', 'não autorizado', 'sem permissão',
      'treinamento', 'instrução', 'exercício',
      'segurança', 'falta de segurança', 'sem segurança',
      'fez exercício perigoso', 'realizou atividade de risco',
      'treinou sem autorização', 'executou manobra perigosa'
    ]
  },
  {
    id: 124,
    text: "Afastar-se do local de incêndio, desabamento, inundação ou outro qualquer serviço de socorro, sem estar autorizado.",
    keywords: [
      'abandonar', 'abandonou', 'largou',
      'incêndio', 'local de incêndio', 'cena de incêndio',
      'socorro', 'serviço de socorro', 'ocorrência',
      'afastar', 'afastou', 'se afastou',
      'sair', 'saiu', 'foi embora',
      'local de ocorrência', 'cena da ocorrência',
      'saiu da ocorrência', 'deixou a ocorrência',
      'abandonou o local', 'foi embora da cena',
      'desabamento', 'inundação', 'resgate'
    ]
  },
  {
    id: 125,
    text: "Afastar-se o motorista da viatura sob sua responsabilidade, nos serviços de incêndio e outros misteres da profissão.",
    keywords: [
      'motorista', 'condutor', 'operador',
      'viatura', 'veículo', 'caminhão',
      'afastar', 'afastou', 'se afastou',
      'abandonar', 'abandonou', 'largou',
      'serviço', 'ocorrência', 'incêndio',
      'deixou viatura', 'saiu da viatura',
      'abandonou veículo', 'largou o carro',
      'não estava na viatura', 'viatura sem motorista'
    ]
  },
  {
    id: 126,
    text: "Não dar ciência à Administração dos avisos de incêndio de regular ou grande proporções que tenha recebido e nos quais haja socorro empenhado.",
    keywords: [
      'incêndio', 'incêndio grande', 'grande incêndio',
      'comunicar', 'comunicação', 'não comunicou',
      'aviso', 'aviso de incêndio', 'chamado',
      'administração', 'não informou administração',
      'omissão', 'omitiu', 'deixou de informar',
      'não passou informação', 'não avisou',
      'não deu ciência', 'ocultou informação'
    ]
  },
  {
    id: 127,
    text: "Faltar à corrida para incêndio ou outros socorros.",
    keywords: [
      'falta', 'faltou', 'não foi',
      'incêndio', 'ocorrência de incêndio', 'chamado de incêndio',
      'socorro', 'ocorrência', 'chamado',
      'não comparecer', 'não compareceu', 'não atendeu',
      'ocorrência', 'chamado', 'acionamento',
      'não saiu para ocorrência', 'não atendeu chamado',
      'ficou no quartel', 'não embarcou'
    ]
  },
  {
    id: 128,
    text: "Receber ou permitir que seu subordinado receba, em local de socorro, quaisquer objetos ou valores, mesmo quando doados pelo proprietário ou responsável pelo local dos sinistro.",
    keywords: [
      'receber', 'recebeu', 'aceitou',
      'doação', 'doou', 'presente',
      'propina', 'suborno', 'gratificação',
      'valor', 'dinheiro', 'pagamento',
      'objeto', 'presente', 'mimo',
      'socorro', 'ocorrência', 'local de ocorrência',
      'corrupção', 'corrompeu', 'se deixou corromper',
      'aceitou dinheiro', 'recebeu presente',
      'gorjeta', 'gratificação', 'bonificação'
    ]
  },
  {
    id: 129,
    text: "Afastar-se o oficial BM de sua residência quando nela deva permanecer por motivo de serviço ou punição.",
    keywords: [
      'residência', 'casa', 'domicílio',
      'afastar', 'afastou', 'se afastou',
      'oficial', 'oficial BM',
      'punição', 'punido', 'cumprindo punição',
      'casa', 'ficar em casa', 'permanecer em casa',
      'serviço', 'por motivo de serviço',
      'saiu de casa', 'deixou residência',
      'não estava em casa', 'ausentou-se da residência'
    ]
  }
];

// Função para calcular score de relevância para busca inteligente
function calcularScoreRelevancia(item: ItemTipificacaoEnriquecido, termos: string[]): number {
  let score = 0;
  const textLower = item.text.toLowerCase();
  const keywordsLower = item.keywords.map(k => k.toLowerCase());

  for (const termo of termos) {
    const termoLower = termo.toLowerCase();

    // Pular termos muito curtos
    if (termoLower.length < 2) continue;

    // Correspondência exata no texto = maior pontuação
    if (textLower.includes(termoLower)) {
      score += 15;
    }

    // Correspondência exata em keyword
    for (const keyword of keywordsLower) {
      // Correspondência exata
      if (keyword === termoLower) {
        score += 20;
        break;
      }
      // Keyword contém o termo ou termo contém keyword
      if (keyword.includes(termoLower) || termoLower.includes(keyword)) {
        score += 10;
        break;
      }
    }

    // Correspondência parcial (início da palavra)
    for (const keyword of keywordsLower) {
      if (keyword.startsWith(termoLower) || termoLower.startsWith(keyword)) {
        score += 5;
        break;
      }
    }
  }

  return score;
}

// Função para buscar itens por texto com busca inteligente
export function buscarItensInteligente(texto: string): ItemTipificacaoEnriquecido[] {
  if (!texto || texto.trim().length === 0) {
    return ITENS_TIPIFICACAO_ENRIQUECIDOS;
  }

  // Verificar se o texto contém números (busca por número do item)
  const numerosEncontrados: number[] = [];
  const regexNumeros = /\b(\d{1,3})\b/g;
  let match;
  while ((match = regexNumeros.exec(texto)) !== null) {
    const numero = parseInt(match[1], 10);
    if (numero >= 1 && numero <= 129) {
      numerosEncontrados.push(numero);
    }
  }

  // Extrair termos de busca (remover palavras comuns e números)
  const palavrasComuns = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'para', 'com', 'em', 'um', 'uma', 'que', 'no', 'na', 'nos', 'nas', 'por', 'ao', 'se', 'seu', 'sua', 'item', 'artigo', 'inciso', 'número', 'numero', 'nº', 'n', 'era', 'foi', 'ser', 'ter', 'quando', 'como', 'mais', 'muito', 'bem', 'mal', 'ele', 'ela'];
  const termos = texto
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length >= 2 && !palavrasComuns.includes(t) && !/^\d+$/.test(t));

  // Se só temos números, retornar os itens correspondentes
  if (termos.length === 0 && numerosEncontrados.length > 0) {
    const itensEncontrados = numerosEncontrados
      .map(num => ITENS_TIPIFICACAO_ENRIQUECIDOS.find(item => item.id === num))
      .filter((item): item is ItemTipificacaoEnriquecido => item !== undefined);
    return itensEncontrados;
  }

  // Se não temos termos nem números válidos, retornar todos
  if (termos.length === 0) {
    return ITENS_TIPIFICACAO_ENRIQUECIDOS;
  }

  // Calcular score para cada item
  const itensComScore = ITENS_TIPIFICACAO_ENRIQUECIDOS.map(item => {
    let score = calcularScoreRelevancia(item, termos);

    // Adicionar pontuação extra se o item está nos números encontrados
    if (numerosEncontrados.includes(item.id)) {
      score += 100; // Prioridade alta para correspondência exata de número
    }

    return { item, score };
  });

  // Filtrar itens com score > 0 e ordenar por score
  return itensComScore
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

// Função para buscar item por número
export function buscarItemEnriquecidoPorNumero(numero: number): ItemTipificacaoEnriquecido | undefined {
  return ITENS_TIPIFICACAO_ENRIQUECIDOS.find(item => item.id === numero);
}
