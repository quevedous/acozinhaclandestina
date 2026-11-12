'use strict';

(() => {
  const CENA = Number(location.pathname.match(/cena(\d+)/)?.[1] ?? 0);
  const IMG = '../img/daniela.png';
  const $d = (seletor) => document.querySelector(seletor);
  const jaAvisou = new Set();

  const INTRO = [
    'Oi! Eu sou a Daniela, a ratinha-chef desta cozinha. Você acordou trancado na despensa, e eu vou te ajudar a sair.',
    'Clique nos objetos do cenário para inspecionar. Alguns guardam pistas, outros guardam itens, e muitos são só enfeite.',
    'Tudo que você pegar vai para o inventário, na barra lá embaixo. Clique no item para selecioná-lo e depois clique no objeto onde quer usá-lo.',
    'Você tem 15 minutos. Primeiro objetivo: achar a senha da porta e o mapa do restaurante. E pegue tudo o que puder antes de sair, que eu vou te avisar se esquecer algo! Se precisar de uma dica, clique em DICA, mas ela custa 1 minuto.',
  ];

  const LEMBRETE_DICA = 'Lembrete: se precisar de ajuda, clique em DICA no canto da tela. Cada dica custa 1 minuto do seu tempo.';

  const BOAS_VINDAS = {
    2: [
      'Estamos na Confeitaria! A porta da Câmara Fria só abre depois que o merengue sair do forno.',
      LEMBRETE_DICA,
    ],
    3: [
      'Brrr, a Câmara Fria! Aqui estão duas coisas de que a Confeitaria precisa: um termômetro e a fruta de yuzu congelada. Leve os dois para lá e depois volte.',
      LEMBRETE_DICA,
    ],
    4: [
      'O Escritório do Chef! A chave mestra e o armário de especiarias são o caminho da saída.',
      LEMBRETE_DICA,
    ],
  };

  const BAUNILHA = ['o Extrato de Baunilha Rara', 'fica nos potes trancados da Despensa e sem ele não dá para tirar a nota máxima'];

  const FALTAS = {
    1: () => [
      !estado.chavePega && ['a Chave de Fenda de Confeiteiro', 'ela está escondida nos sacos de farinha'],
      !estado.potesAbertos && BAUNILHA,
    ],
    3: () => [
      !estado.emulsaoPronta && ['o creme em emulsão', 'faça no misturador de emulsão, porque ele será usado no prato final'],
    ],
    4: () => [
      !estado.potesAbertos && BAUNILHA,
      !estado.inventario.includes('especiarias') && ['as Especiarias Raras', 'ficam dentro do armário de especiarias'],
    ],
  };

  const faltas = () => (FALTAS[CENA]?.() ?? []).filter(Boolean);

  const dicaAtual = () => {
    const e = estado;
    const dicas = {
      1: [
        [!e.portaAberta, 'O bilhete rasgado na parede tem duas contas, uma de farinha e uma de temperatura. A senha é as duas respostas juntas.'],
        [!e.mapaPego, 'Tem um papel dobrado dentro do caixote. Pode ser o mapa do restaurante.'],
        [!e.chavePega, 'Já mexeu nos sacos de farinha? Às vezes tem algo escondido.'],
        [!e.potesAbertos, 'Os potes trancados pedem uma ordem, do mais suave ao mais forte. O diário do caixote pode ajudar.'],
      ],
      2: [
        [e.fornoEtapa === 0, 'Clique no forno de cima. O painel pede a temperatura em °C, e o visor mostra em °F. O papel de conversão e a receita ajudam.'],
        [e.fornoEtapa === 1 || e.fornoEtapa === 3, 'O merengue ainda está assando. Espere alguns segundos e clique no forno de novo.'],
        [e.fornoEtapa === 2, 'No estágio 2 o visor não mostra a temperatura. Ela está escrita em algum lugar do cenário. Depois é só converter para °C.'],
        [e.fornoEtapa === 4, 'O merengue está pronto! Clique no forno para retirá-lo.'],
        [!e.merengue, 'A porta da Câmara Fria só abre quando o merengue sair do forno.'],
        [e.merengue && !e.caldaPronta, 'A calda precisa de um termômetro, e ele está na Câmara Fria. Depois selecione o termômetro e clique no frasco de calda.'],
        [e.merengue && !e.yuzuUsado, 'Quando tiver o yuzu congelado, deixe-o sobre a bancada de mármore para descongelar.'],
      ],
      3: [
        [!e.termostatoAberto, 'O painel do termostato está preso por parafusos. Selecione a chave de fenda no inventário e clique no painel. Atrás dele tem algo que a Confeitaria precisa.'],
        [!e.caixaAberta, 'O freezer de frutas tem uma trava de balança com 4 dígitos: a massa de dois recipientes. Leia as etiquetas deles e use a fórmula do cartaz.'],
        [!e.segurancaAberta, 'O teclado de segurança pede a temperatura do freezer em °C. O visor mostra 14 °F, e o cartaz da parede explica como converter.'],
        [!e.emulsaoPronta, 'O misturador de emulsão não é obrigatório para sair, mas o creme vai ser usado no prato final. Mantenha o indicador na zona verde.'],
        [!e.caldaPronta || !e.yuzuUsado, 'Volte à Confeitaria: use o termômetro no frasco de calda e deixe o yuzu descongelando no mármore. Só depois a porta do freezer abre.'],
      ],
      4: [
        [!e.chaveMestraPega, 'O quadro de avisos diz onde está a chave mestra.'],
        [!e.armarioAberto, 'Use a chave mestra no armário de especiarias antes de sair.'],
      ],
    };
    return (dicas[CENA] ?? []).find(([precisa]) => precisa)?.[1]
      ?? 'Parece que você já tem tudo por aqui. Vá para a porta de saída!';
  };

  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="daniela" id="daniela-dlg" aria-labelledby="daniela-nome">
      <img class="daniela-rato" src="${IMG}" alt="Daniela, uma ratinha de chapéu de chef e avental, segurando uma colher de pau">
      <div class="daniela-balao">
        <p class="daniela-nome" id="daniela-nome">Daniela</p>
        <p class="daniela-fala" id="daniela-fala" aria-live="polite"></p>
        <div class="daniela-acoes" id="daniela-acoes"></div>
      </div>
    </dialog>
    <button class="daniela-ajuda" id="daniela-ajuda" type="button" aria-label="Pedir uma dica para a Daniela (custa 1 minuto)">
      <img src="${IMG}" alt=""><span>DICA</span>
    </button>
  `);

  const dlg = $d('#daniela-dlg');
  let falas = [];
  let finais = [];
  let passo = 0;
  let botoes = [];
  let aoFechar = null;

  const posicionar = () => {
    const cena = $d('#cena')?.getBoundingClientRect();
    const largura = cena ? cena.width * 0.94 : Math.min(720, innerWidth * 0.94);
    const esquerda = cena ? cena.left + (cena.width - largura) / 2 : (innerWidth - largura) / 2;
    const base = cena ? innerHeight - cena.bottom + 14 : 24;
    dlg.style.setProperty('--d-larg', `${largura}px`);
    dlg.style.setProperty('--d-esq', `${esquerda}px`);
    dlg.style.setProperty('--d-base', `${base}px`);
  };

  const mostrar = () => {
    $d('#daniela-fala').textContent = falas[passo];
    const ultimo = passo === falas.length - 1;
    botoes = ultimo ? finais : [{ texto: 'PRÓXIMO ▶', fn: () => { passo++; mostrar(); } }];
    $d('#daniela-acoes').innerHTML = botoes
      .map((b, i) => `<button type="button" data-i="${i}">${b.texto}</button>`)
      .join('');
    $d('#daniela-acoes button').focus();
  };

  const dizer = (linhas, opcoes = {}) => {
    falas = linhas;
    passo = 0;
    aoFechar = opcoes.aoFechar ?? null;
    finais = opcoes.botoes ?? [{ texto: 'ENTENDI!', fn: () => dlg.close() }];
    posicionar();
    if (!dlg.open) dlg.showModal();
    mostrar();
  };

  $d('#daniela-acoes').addEventListener('click', ({ target }) => {
    botoes[target.dataset.i]?.fn();
  });

  dlg.addEventListener('close', () => {
    const fn = aoFechar;
    aoFechar = null;
    fn?.();
  });

  window.addEventListener('resize', posicionar);

  const CUSTO_DICA = 60;

  const pedirDica = () => {
    const restante = Math.ceil((estado.fim - Date.now()) / 1000);
    if (restante <= CUSTO_DICA) {
      return dizer(['Falta menos de 1 minuto no relógio, então você não tem tempo para pagar uma dica. Corra!']);
    }
    dizer(['Atenção! Cada dica custa 1 minuto do seu tempo. Quer mesmo ver a dica?'], {
      botoes: [
        {
          texto: 'PROSSEGUIR',
          fn: () => {
            estado.fim -= CUSTO_DICA * 1000;
            salvar();
            tick();
            dizer([dicaAtual()]);
          },
        },
        { texto: 'CANCELAR', fn: () => dlg.close() },
      ],
    });
  };

  $d('#daniela-ajuda').addEventListener('click', pedirDica);

  document.addEventListener('click', (evento) => {
    const link = evento.target.closest('a.btn-pixel');
    const destino = link?.getAttribute('href') ?? '';
    if (!/^cena\d+\.html$/.test(destino)) return;
    if (Number(destino.match(/\d+/)[0]) <= CENA || jaAvisou.has(destino)) return;
    const falta = faltas();
    if (!falta.length) return;

    evento.preventDefault();
    const lista = falta.map(([nome, onde]) => `${nome} (${onde})`).join('; ');
    dizer([`Ei, espera! Você ainda não pegou: ${lista}.`], {
      botoes: [
        { texto: 'VOU PROCURAR', fn: () => dlg.close() },
        { texto: 'SAIR MESMO ASSIM', fn: () => { jaAvisou.add(destino); location.href = destino; } },
      ],
    });
  }, true);

  const umaVez = (chave) => {
    try {
      if (sessionStorage.getItem(chave)) return false;
      sessionStorage.setItem(chave, '1');
    } catch (erro) {}
    return true;
  };

  if (CENA === 1 && umaVez('daniela_intro')) {
    const inicio = Date.now();
    dizer(INTRO, {
      botoes: [{ texto: 'VAMOS LÁ!', fn: () => dlg.close() }],
      aoFechar: () => {
        estado.fim += Date.now() - inicio;
        salvar();
      },
    });
  } else if (BOAS_VINDAS[CENA] && umaVez(`daniela_cena${CENA}`)) {
    dizer(BOAS_VINDAS[CENA]);
  }
})();