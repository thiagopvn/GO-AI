/**
 * Script de teste para validar a correção do cálculo de comportamento
 *
 * Sistema de unidades:
 * - Repreensão = 1 unidade
 * - Detenção = 2 unidades
 * - Prisão = 4 unidades
 * - 2 prisões equivalentes = 8 unidades
 *
 * Regras (ordem de prioridade):
 * (A) EXCEPCIONAL - 8 anos - 0 punições
 * (B) MAU - 1 ano - > 8 unidades
 * (C) INSUFICIENTE - 1 ano - == 8 unidades
 * (D) ÓTIMO - 4 anos - <= 2 unidades (1 detenção equiv.)
 * (E) BOM - 2 anos - <= 8 unidades (2 prisões equiv.)
 * (F) MAU (fallback) - quando excede BOM
 */

// Simular a função calcularUnidades
function calcularUnidades(pads) {
  return pads.reduce((acc, pad) => {
    const tipoPunicao = String(pad.tipoPunicao || '').toLowerCase();
    if (tipoPunicao === 'repreensao' || tipoPunicao === 'repreensão') {
      return acc + 1;
    } else if (tipoPunicao === 'detencao' || tipoPunicao === 'detenção') {
      return acc + 2;
    } else if (tipoPunicao === 'prisao' || tipoPunicao === 'prisão') {
      return acc + 4;
    }
    return acc;
  }, 0);
}

// Simular filtro por janela de tempo
function filtrarPorJanela(pads, anosJanela) {
  const dataLimite = new Date();
  dataLimite.setFullYear(dataLimite.getFullYear() - anosJanela);

  return pads.filter(pad => {
    const data = pad.dataInicioPunicao;
    return data >= dataLimite;
  });
}

// Simular cálculo de comportamento
function calcularComportamento(pads, tempoServicoAnos) {
  const hoje = new Date();

  // (A) EXCEPCIONAL: 8 anos sem punições
  if (tempoServicoAnos >= 8) {
    const pads8Anos = filtrarPorJanela(pads, 8);
    const unidades8Anos = calcularUnidades(pads8Anos);
    if (unidades8Anos === 0) {
      return 'EXCEPCIONAL';
    }
  }

  // (B) e (C) Avaliar último ano PRIMEIRO
  const pads1Ano = tempoServicoAnos >= 1 ? filtrarPorJanela(pads, 1) : pads;
  const unidades1Ano = calcularUnidades(pads1Ano);

  // MAU: > 8 unidades
  if (unidades1Ano > 8) {
    return 'MAU';
  }

  // INSUFICIENTE: == 8 unidades
  if (unidades1Ano === 8) {
    return 'INSUFICIENTE';
  }

  // (D) ÓTIMO: 4 anos <= 2 unidades
  if (tempoServicoAnos >= 4) {
    const pads4Anos = filtrarPorJanela(pads, 4);
    const unidades4Anos = calcularUnidades(pads4Anos);
    if (unidades4Anos <= 2) {
      return 'OTIMO';
    }
  }

  // (E) BOM: 2 anos <= 8 unidades
  const pads2Anos = tempoServicoAnos >= 2 ? filtrarPorJanela(pads, 2) : pads;
  const unidades2Anos = calcularUnidades(pads2Anos);

  if (unidades2Anos <= 8) {
    return 'BOM';
  }

  // (F) Fallback: MAU
  return 'MAU';
}

// Função para criar PAD de teste
function criarPAD(tipoPunicao, diasAtras = 0) {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  return {
    tipoPunicao,
    diasPunicao: 2, // dias não importam para o cálculo
    dataInicioPunicao: data
  };
}

// Casos de teste
const testCases = [
  {
    nome: 'Caso 1: 1 prisão no último ano -> BOM (não pode ser Insuficiente)',
    pads: [criarPAD('prisao', 30)],
    tempoServico: 10,
    esperado: 'BOM',
    explicacao: '1 prisão = 4 unidades < 8, então não é Insuficiente'
  },
  {
    nome: 'Caso 2: 2 prisões no último ano -> INSUFICIENTE',
    pads: [criarPAD('prisao', 30), criarPAD('prisao', 60)],
    tempoServico: 10,
    esperado: 'INSUFICIENTE',
    explicacao: '2 prisões = 8 unidades == 8, então é Insuficiente'
  },
  {
    nome: 'Caso 3: 3 prisões no último ano -> MAU',
    pads: [criarPAD('prisao', 30), criarPAD('prisao', 60), criarPAD('prisao', 90)],
    tempoServico: 10,
    esperado: 'MAU',
    explicacao: '3 prisões = 12 unidades > 8, então é Mau'
  },
  {
    nome: 'Caso 4: 1 prisão + 2 detenções no último ano -> INSUFICIENTE',
    pads: [criarPAD('prisao', 30), criarPAD('detencao', 60), criarPAD('detencao', 90)],
    tempoServico: 10,
    esperado: 'INSUFICIENTE',
    explicacao: '1 prisão (4) + 2 detenções (4) = 8 unidades == 8'
  },
  {
    nome: 'Caso 5: 9 repreensões no último ano -> MAU',
    pads: Array(9).fill(null).map((_, i) => criarPAD('repreensao', i * 30)),
    tempoServico: 10,
    esperado: 'MAU',
    explicacao: '9 repreensões = 9 unidades > 8'
  },
  {
    nome: 'Caso 6: 0 punições nos últimos 8 anos -> EXCEPCIONAL',
    pads: [],
    tempoServico: 10,
    esperado: 'EXCEPCIONAL',
    explicacao: '0 punições = 0 unidades'
  },
  {
    nome: 'Caso 7: 2 prisões + 1 repreensão nos últimos 2 anos -> MAU',
    pads: [criarPAD('prisao', 100), criarPAD('prisao', 200), criarPAD('repreensao', 300)],
    tempoServico: 10,
    esperado: 'MAU',
    explicacao: '2 prisões (8) + 1 repreensão (1) = 9 unidades > 8 em 2 anos'
  },
  {
    nome: 'Caso 8: 4 repreensões no último ano -> BOM',
    pads: Array(4).fill(null).map((_, i) => criarPAD('repreensao', i * 30)),
    tempoServico: 10,
    esperado: 'BOM',
    explicacao: '4 repreensões = 4 unidades < 8'
  },
  {
    nome: 'Caso 9: 8 repreensões no último ano -> INSUFICIENTE',
    pads: Array(8).fill(null).map((_, i) => criarPAD('repreensao', i * 30)),
    tempoServico: 10,
    esperado: 'INSUFICIENTE',
    explicacao: '8 repreensões = 8 unidades == 8'
  },
  {
    nome: 'Caso 10: 1 detenção nos últimos 4 anos -> ÓTIMO',
    pads: [criarPAD('detencao', 365)],
    tempoServico: 10,
    esperado: 'OTIMO',
    explicacao: '1 detenção = 2 unidades <= 2'
  },
  {
    nome: 'Caso 11: 1 repreensão nos últimos 4 anos -> ÓTIMO',
    pads: [criarPAD('repreensao', 365)],
    tempoServico: 10,
    esperado: 'OTIMO',
    explicacao: '1 repreensão = 1 unidade <= 2'
  },
  {
    nome: 'Caso 12: 2 detenções nos últimos 4 anos -> BOM (não ÓTIMO)',
    pads: [criarPAD('detencao', 365), criarPAD('detencao', 400)],
    tempoServico: 10,
    esperado: 'BOM',
    explicacao: '2 detenções = 4 unidades > 2, mas <= 8'
  },
];

// Executar testes
console.log('='.repeat(80));
console.log('TESTES DE REGRESSÃO - CÁLCULO DE COMPORTAMENTO MILITAR');
console.log('='.repeat(80));
console.log('');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const resultado = calcularComportamento(test.pads, test.tempoServico);
  const unidades = calcularUnidades(test.pads);
  const passou = resultado === test.esperado;

  if (passou) {
    console.log(`✅ ${test.nome}`);
    passed++;
  } else {
    console.log(`❌ ${test.nome}`);
    console.log(`   Esperado: ${test.esperado}, Obtido: ${resultado}`);
    failed++;
  }
  console.log(`   ${test.explicacao}`);
  console.log(`   Total de unidades: ${unidades}`);
  console.log('');
});

console.log('='.repeat(80));
console.log(`RESULTADO: ${passed} passou, ${failed} falhou`);
console.log('='.repeat(80));

if (failed > 0) {
  process.exit(1);
}
