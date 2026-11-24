'use strict';

(function () {
  var matchCena = location.pathname.match(/cena(\d+)/);
  var CENA = Number(matchCena ? matchCena[1] : 0);
  var IMG = '../img/daniela.png';

  function $d(seletor) {
    return document.querySelector(seletor);
  }

  var jaAvisou = {};

  var INTRO = [
    'Oi! Eu sou a Daniela, a ratinha-chef desta cozinha. Você acordou trancado na despensa, e eu vou te ajudar a sair.',
    'Clique nos objetos do cenário para inspecionar. Alguns guardam pistas, outros guardam itens, e muitos são só enfeite.',
    'Tudo que você pegar vai para o inventário, na barra lá em cima. Clique no item para selecioná-lo e depois clique no objeto onde quer usá-lo.',
    'Você tem 15 minutos. Primeiro objetivo: achar a senha da porta e o mapa do restaurante. E pegue tudo o que puder antes de sair, que eu vou te avisar se esquecer algo! Se precisar de uma dica, clique em DICA, mas ela custa 1 minuto.'
  ];

  var LEMBRETE_DICA = 'Lembrete: se precisar de ajuda, clique em DICA no canto da tela. Cada dica custa 1 minuto do seu tempo.';

  var BOAS_VINDAS = {
    2: [
      'Estamos na Confeitaria! A porta da Câmara Fria só abre depois que o merengue sair do forno.',
      LEMBRETE_DICA
    ],
    3: [
      'Brrr, a Câmara Fria! Aqui estão duas coisas de que a Confeitaria precisa: um termômetro e a fruta de yuzu congelada. Leve os dois para lá e depois volte.',
      LEMBRETE_DICA
    ],
    4: [
      'O Escritório do Chef! A chave mestra e o armário de especiarias são o caminho da saída.',
      LEMBRETE_DICA
    ]
  };

  function faltaPedaco(id) {
    return Boolean(window.Pedacos) && !window.Pedacos.tem(id);
  }

  function temNoInventario(id) {
    for (var i = 0; i < estado.inventario.length; i++) {
      if (estado.inventario[i] === id) return true;
    }
    return false;
  }

  var BAUNILHA = ['o Extrato de Baunilha Rara', 'fica nos potes trancados da Despensa e sem ele não dá para tirar a nota máxima'];

  function faltas() {
    var lista = [];
    if (CENA === 1) {
      if (!estado.chavePega) lista.push(['a Chave de Fenda de Confeiteiro', 'ela está escondida nos sacos de farinha']);
      if (!estado.potesAbertos) lista.push(BAUNILHA);
      if (faltaPedaco(0)) lista.push(['um pedaço de papel rasgado do livro de receitas', 'está brilhando no chão da despensa']);
    } else if (CENA === 2) {
      if (faltaPedaco(1)) lista.push(['um pedaço de papel rasgado do livro de receitas', 'está em cima do barril, perto da bancada']);
    } else if (CENA === 3) {
      if (faltaPedaco(2)) lista.push(['um pedaço de papel rasgado do livro de receitas', 'está brilhando no chão gelado']);
      if (!estado.emulsaoPronta) lista.push(['o creme em emulsão', 'faça no misturador de emulsão, porque ele será usado no prato final']);
    } else if (CENA === 4) {
      if (!estado.livroRestaurado && window.Pedacos && window.Pedacos.lista().length < window.Pedacos.total) {
        lista.push(['os pedaços do livro de receitas', 'faltam alguns, e um deles está na gaveta secreta da mesa']);
      }
      if (!estado.potesAbertos) lista.push(BAUNILHA);
      if (!temNoInventario('especiarias')) lista.push(['as Especiarias Raras', 'ficam dentro do armário de especiarias']);
    }
    return lista;
  }

  function dicaAtual() {
    var e = estado;
    var dicas = {
      1: [
        [!e.portaAberta, 'O bilhete rasgado na parede tem duas contas, uma de farinha e uma de temperatura. A senha é as duas respostas juntas.'],
        [!e.mapaPego, 'Tem um papel dobrado dentro do caixote. Pode ser o mapa do restaurante.'],
        [!e.chavePega, 'Já mexeu nos sacos de farinha? Às vezes tem algo escondido.'],
        [!e.potesAbertos, 'Os potes trancados pedem uma ordem, do mais suave ao mais forte. O diário do caixote pode ajudar.'],
        [faltaPedaco(0), 'Tem um pedaço de papel rasgado brilhando no chão da despensa. Ele é parte de um livro de receitas que você vai montar no Escritório do Chef.']
      ],
      2: [
        [e.fornoEtapa === 0, 'Clique no forno de cima. Leia o Cartaz da Confeitaria e o Guia de Chamas na parede para descobrir qual cor de chama usar na primeira etapa.'],
        [e.fornoEtapa === 1 || e.fornoEtapa === 3, 'O merengue ainda está assando. Espere alguns segundos e clique no forno de novo.'],
        [e.fornoEtapa === 2, 'Na segunda etapa, confira no Cartaz da Confeitaria e no Guia de Chamas qual cor de chama finaliza o merengue sem queimar.'],
        [e.fornoEtapa === 4, 'O merengue está pronto! Clique no forno para retirá-lo.'],
        [!e.merengue, 'A porta da Câmara Fria só abre quando o merengue sair do forno.'],
        [e.merengue && !e.caldaPronta, 'A calda precisa de um termômetro, e ele está na Câmara Fria. Depois selecione o termômetro e clique no frasco de calda.'],
        [e.merengue && !e.yuzuUsado, 'Quando tiver o yuzu congelado, deixe-o sobre a bancada de mármore para descongelar.'],
        [faltaPedaco(1), 'Tem um pedaço de papel rasgado brilhando em cima do barril, ao lado da bancada. Ele é parte de um livro de receitas.']
      ],
      3: [
        [!e.termostatoAberto, 'O painel do termostato está preso por parafusos. Selecione a chave de fenda no inventário e clique no painel. Atrás dele tem algo que a Confeitaria precisa.'],
        [!e.caixaAberta, 'O freezer de frutas tem uma trava de balança com 4 dígitos: a massa de dois recipientes. Leia as etiquetas deles e use a fórmula do cartaz.'],
        [!e.segurancaAberta, 'O teclado de segurança pede a temperatura do freezer em °C. O visor mostra 14 °F, e o cartaz da parede explica como converter.'],
        [!e.emulsaoPronta, 'O misturador de emulsão não é obrigatório para sair, mas o creme vai ser usado no prato final. Mantenha o indicador na zona verde.'],
        [!e.caldaPronta || !e.yuzuUsado, 'Volte à Confeitaria: use o termômetro no frasco de calda e deixe o yuzu descongelando no mármore. Só depois a porta do freezer abre.'],
        [faltaPedaco(2), 'Tem um pedaço de papel rasgado brilhando no chão gelado, à direita. Ele é parte de um livro de receitas.']
      ],
      4: [
        [!e.chaveMestraPega && window.Pedacos && window.Pedacos.lista().length < window.Pedacos.total, 'Para restaurar o livro da estante você precisa dos 4 pedaços de papel: despensa, confeitaria, câmara fria e a gaveta secreta da mesa. Se esqueceu algum, volte pela barra do topo.'],
        [!e.chaveMestraPega, 'O quadro de avisos diz onde está a chave mestra. Ela está no livro rasgado da estante: monte o quebra-cabeça com os 4 pedaços.'],
        [!e.armarioAberto, 'Use a chave mestra no armário de especiarias antes de sair.']
      ]
    };

    var listaDicas = dicas[CENA] || [];
    for (var i = 0; i < listaDicas.length; i++) {
      if (listaDicas[i][0]) return listaDicas[i][1];
    }
    return 'Parece que você já tem tudo por aqui. Vá para a porta de saída!';
  }

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

  var dlg = $d('#daniela-dlg');
  var falas = [];
  var finais = [];
  var passo = 0;
  var botoes = [];
  var aoFechar = null;

  function posicionar() {
    var cenaEl = $d('#cena');
    var cena = cenaEl ? cenaEl.getBoundingClientRect() : null;
    var largura = cena ? cena.width * 0.94 : Math.min(720, innerWidth * 0.94);
    var esquerda = cena ? cena.left + (cena.width - largura) / 2 : (innerWidth - largura) / 2;
    var base = cena ? innerHeight - cena.bottom + 14 : 24;
    dlg.style.setProperty('--d-larg', largura + 'px');
    dlg.style.setProperty('--d-esq', esquerda + 'px');
    dlg.style.setProperty('--d-base', base + 'px');
  }

  function mostrar() {
    $d('#daniela-fala').textContent = falas[passo];
    var ultimo = passo === falas.length - 1;
    botoes = ultimo ? finais : [{
      texto: 'PRÓXIMO ▶',
      fn: function () {
        passo++;
        mostrar();
      }
    }];
    var htmlBotoes = '';
    for (var i = 0; i < botoes.length; i++) {
      htmlBotoes += `<button type="button" data-i="${i}">${botoes[i].texto}</button>`;
    }
    $d('#daniela-acoes').innerHTML = htmlBotoes;
    var primeiroBtn = $d('#daniela-acoes button');
    if (primeiroBtn) primeiroBtn.focus();
  }

  function dizer(linhas, opcoes) {
    opcoes = opcoes || {};
    falas = linhas;
    passo = 0;
    aoFechar = opcoes.aoFechar || null;
    finais = opcoes.botoes || [{
      texto: 'ENTENDI!',
      fn: function () {
        dlg.close();
      }
    }];
    posicionar();
    if (!dlg.open) dlg.showModal();
    mostrar();
  }

  $d('#daniela-acoes').onclick = function (e) {
    var idx = e.target.dataset.i;
    if (idx !== undefined && botoes[idx]) botoes[idx].fn();
  };

  dlg.onclose = function () {
    var fn = aoFechar;
    aoFechar = null;
    if (fn) fn();
  };

  var prevResize = window.onresize;
  window.onresize = function (e) {
    if (prevResize) prevResize(e);
    posicionar();
  };

  var CUSTO_DICA = 60;

  $d('#daniela-ajuda').onclick = function () {
    var restante = Math.ceil((estado.fim - Date.now()) / 1000);
    if (restante <= CUSTO_DICA) {
      dizer(['Falta menos de 1 minuto no relógio, então você não tem tempo para pagar uma dica. Corra!']);
      return;
    }
    dizer(['Atenção! Cada dica custa 1 minuto do seu tempo. Quer mesmo ver a dica?'], {
      botoes: [
        {
          texto: 'PROSSEGUIR',
          fn: function () {
            estado.fim -= CUSTO_DICA * 1000;
            salvar();
            tick();
            dizer([dicaAtual()]);
          }
        },
        {
          texto: 'CANCELAR',
          fn: function () {
            dlg.close();
          }
        }
      ]
    });
  };

  var prevClick = document.onclick;
  document.onclick = function (evento) {
    if (prevClick) prevClick(evento);
    var link = evento.target.closest('a.btn-pixel');
    var destino = link ? (link.getAttribute('href') || '') : '';
    if (!/^cena\d+\.html$/.test(destino)) return;
    if (Number(destino.match(/\d+/)[0]) <= CENA || jaAvisou[destino]) return;
    var falta = faltas();
    if (!falta.length) return;

    evento.preventDefault();
    var partes = [];
    for (var i = 0; i < falta.length; i++) {
      partes.push(falta[i][0] + ' (' + falta[i][1] + ')');
    }
    dizer(['Ei, espera! Você ainda não pegou: ' + partes.join('; ') + '.'], {
      botoes: [
        {
          texto: 'VOU PROCURAR',
          fn: function () {
            dlg.close();
          }
        },
        {
          texto: 'SAIR MESMO ASSIM',
          fn: function () {
            jaAvisou[destino] = true;
            location.href = destino;
          }
        }
      ]
    });
  };

  function umaVez(chave) {
    try {
      if (localStorage.getItem(chave)) return false;
      localStorage.setItem(chave, '1');
    } catch (erro) {}
    return true;
  }

  if (CENA === 1 && umaVez('daniela_intro')) {
    var inicio = Date.now();
    dizer(INTRO, {
      botoes: [{
        texto: 'VAMOS LÁ!',
        fn: function () {
          dlg.close();
        }
      }],
      aoFechar: function () {
        estado.fim += Date.now() - inicio;
        salvar();
      }
    });
  } else if (BOAS_VINDAS[CENA] && umaVez('daniela_cena' + CENA)) {
    dizer(BOAS_VINDAS[CENA]);
  }
})();