'use strict';

/* ------------------------------------------------------------------
   ABAS DO TOPO (Como jogar · História · Desenvolvedores) + TELA CHEIA
   Para editar os textos, mexa só no objeto ABAS logo abaixo.
------------------------------------------------------------------- */
const ABAS = {
  'como-jogar': {
    titulo: 'COMO JOGAR',
    html: `
      <p class="intro">Você acordou trancado na despensa de uma cozinha clandestina. O concurso do Chef começa em minutos e você precisa chegar à bancada final com a sobremesa pronta.</p>

      <h3>Objetivo</h3>
      <p>Atravessar os cenários, resolver os enigmas e montar a sobremesa na pista principal antes que o cronômetro chegue a 00:00.</p>

      <h3>Passo a passo</h3>
      <ol>
        <li><strong>Explore o cenário.</strong> Passe o mouse sobre os objetos: uma seta pulando mostra o que pode ser clicado.</li>
        <li><strong>Colete itens.</strong> Tudo o que você pegar vai para o inventário, na barra preta do topo da tela.</li>
        <li><strong>Use os itens.</strong> Clique em um item do inventário para selecioná-lo e depois clique no objeto onde quer usá-lo.</li>
        <li><strong>Resolva os enigmas.</strong> Conversões de medidas, sequências, minigames de tempo e muito mais abrem novas portas.</li>
        <li><strong>Avance de cenário.</strong> Cada área tem um objetivo principal que libera a próxima.</li>
        <li><strong>Empratar.</strong> Na pista final, siga a sequência correta e monte o prato com cuidado.</li>
      </ol>

      <h3>Tempo e pontuação</h3>
      <ul>
        <li>O cronômetro fica no topo da tela e não pausa, nem com esta janela aberta.</li>
        <li>Sua <strong>precisão</strong> sobe com acertos de primeira e bom desempenho nos minigames.</li>
        <li>Tentativas erradas diminuem a precisão.</li>
      </ul>

      <h3>Os 4 finais</h3>
      <ul>
        <li><strong>A Nova Estrela Michelin:</strong> mais de 3 minutos restantes e precisão a partir de 90%.</li>
        <li><strong>Aprovado com Ressalvas:</strong> dentro do tempo, precisão entre 70% e 89%.</li>
        <li><strong>Desastre Empratado:</strong> dentro do tempo, precisão abaixo de 70%.</li>
        <li><strong>Fora do Tempo!:</strong> o cronômetro chegou a zero.</li>
      </ul>

      <p class="dica"><strong>Dica:</strong> leia bilhetes, rótulos e diários com atenção. As respostas dos enigmas costumam estar escondidas neles.</p>
    `
  },

  'historia': {
    titulo: 'HISTÓRIA',
    html: `
      <p class="intro">Existe um restaurante que não aparece em nenhum mapa. Seus jantares são disputados em segredo e o prêmio do concurso do Chef é a lendária receita do Bolo Clandestino.</p>

      <p>Você é um confeiteiro convidado para a prova final, mas algo deu errado: ao chegar, você foi trancado na despensa, sem ingredientes e sem explicações.</p>

      <p>Para sair, será preciso decifrar bilhetes rasgados, dominar fornos, caldas e temperaturas, atravessar a câmara fria e chegar ao escritório do Chef. Só então a pista principal estará à sua espera, com os jurados já sentados à mesa.</p>

      <p>O relógio já começou a correr. Você tem 15 minutos para escapar, montar o bolo e provar que merece a receita.</p>

      <p class="dica">Edite este texto em <strong>js/abas.js</strong> para contar a história do jeito que você quiser.</p>
    `
  },

  'desenvolvedores': {
    titulo: 'DESENVOLVEDORES',
    html: `
      <p class="intro">O Mistério da Cozinha Clandestina foi feito por:</p>

      <ul class="equipe">
        <li><strong>Nome do desenvolvedor 1</strong><br>Programação e game design</li>
        <li><strong>Nome do desenvolvedor 2</strong><br>Arte e cenários</li>
        <li><strong>Nome do desenvolvedor 3</strong><br>Enigmas e roteiro</li>
      </ul>

      <p>Código-fonte: <a href="https://github.com/quevedous/acozinhaclandestina" target="_blank" rel="noopener">github.com/quevedous/acozinhaclandestina</a></p>

      <p class="dica">Troque os nomes e funções em <strong>js/abas.js</strong>.</p>
    `
  }
};

const $a = (s) => document.querySelector(s);
const modalAba = $a('#modal-aba');
const botoesAba = document.querySelectorAll('.aba[data-aba]');

function marcarAba(id) {
  botoesAba.forEach((b) => b.classList.toggle('ativa', b.dataset.aba === id));
}

function abrirAba(id) {
  const aba = ABAS[id];
  if (!aba) return;
  $a('#aba-titulo').textContent = aba.titulo;
  $a('#aba-corpo').innerHTML = aba.html;
  $a('#aba-corpo').scrollTop = 0;
  modalAba.hidden = false;
  marcarAba(id);
}

function fecharAba() {
  modalAba.hidden = true;
  marcarAba(null);
}

botoesAba.forEach((b) => {
  b.addEventListener('click', () => {
    if (!modalAba.hidden && b.classList.contains('ativa')) { fecharAba(); return; }
    const diario = $a('#modal-diario');
    if (diario) diario.hidden = true;
    abrirAba(b.dataset.aba);
  });
});

$a('#aba-fechar').addEventListener('click', fecharAba);
modalAba.addEventListener('click', (e) => { if (e.target === modalAba) fecharAba(); });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modalAba.hidden) fecharAba();
  const diario = $a('#modal-diario');
  if (diario && !diario.hidden) diario.hidden = true;
});

/* Abrir o Diário fecha a aba aberta (um modal por vez) */
$a('#btn-diario').addEventListener('click', () => { if (!modalAba.hidden) fecharAba(); });

/* Tela cheia */
const btnTelaCheia = $a('#btn-tela-cheia');
btnTelaCheia.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});
document.addEventListener('fullscreenchange', () => {
  const cheia = !!document.fullscreenElement;
  btnTelaCheia.title = cheia ? 'Sair da tela cheia' : 'Tela cheia';
  btnTelaCheia.setAttribute('aria-label', btnTelaCheia.title);
});