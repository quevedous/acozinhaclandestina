const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;
const TEMPO_ESTAGIO = 5000;

const ESTAGIOS = {
  1: { min: 18, max: 34, nome: 'secar', corNome: 'Azul-Ciano (Chama Branda)', hex: '#2563eb' },
  2: { min: 64, max: 80, nome: 'dourar', corNome: 'Âmbar Dourado (Chama Média-Alta)', hex: '#d97706' }
};

const CODIGO_SECRETO = "741";

const CALDA = { min: 100, max: 140, alvo: 118, tol: 3, vel: 28 };

const ITENS = {
  chave:       { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Vai servir para abrir um painel na Câmara Fria.' },
  mapa:        { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha:    { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' },
  termometro:  { nome: 'Termômetro Digital', icone: '🌡️', desc: 'Selecione e clique no frasco de calda para medir o ponto.' },
  yuzu:        { nome: 'Fruta de Yuzu Congelada', icone: '🍋', desc: 'Precisa descongelar aos poucos. O mármore frio ajuda.' },
  merengue:    { nome: 'Merengue Assado', icone: '🍥', desc: 'Assado no ponto exato. Será usado no prato final.' },
  calda:       { nome: 'Calda no Ponto', icone: '🍯', desc: 'Calda de açúcar no ponto de bola mole, 118 °C.' },
  papel_dica:  { nome: 'Papel Enigma da Despensa', icone: '📜', desc: 'Um bilhete rasgado com o enigma para abrir a porta eletrônica. Clique para decifrar.' },
  chave_porta: { nome: 'Chave da Câmara Fria', icone: '🔑', desc: 'Chave obtida na bancada de frascos.' }
};

const PADRAO = {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  erros: 0,
  acertos: 0,
  chavePega: false,
  mapaPego: false,
  potesAbertos: false,
  portaAberta: false,
  fornoEtapa: 0,
  assadoEm: 0,
  merengue: false,
  caldaPronta: false,
  yuzuUsado: false,
  papelColetado: false
};

function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}
let estado = Object.assign({}, PADRAO, carregarEstado() || {});
function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}
salvar();

const $ = s => document.querySelector(s);
const overlay = $('#modal-overlay');
const modalTitulo = $('#modal-titulo');
const modalCorpo = $('#modal-corpo');
let travado = false;
let selecionado = null;
let aoFechar = null;

function fala(texto) { $('#mensagem').textContent = texto; }

function abrirModal(titulo, html) {
  if (aoFechar) { aoFechar(); aoFechar = null; }
  modalTitulo.textContent = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}
function fecharModal() {
  if (travado) return;
  if (aoFechar) { aoFechar(); aoFechar = null; }
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}
$('#modal-fechar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
  if ((e.key === 'h' || e.key === 'H') && overlay.hidden) $('#cena').classList.toggle('debug');
});

function renderInventario() {
  const barra = $('#inventory-bar');
  if(!barra) return;
  barra.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const id = estado.inventario[i];
    if (id && ITENS[id]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot cheio' + (selecionado === id ? ' ativo' : '');
      b.title = ITENS[id].nome;
      b.setAttribute('aria-label', ITENS[id].nome);
      b.textContent = ITENS[id].icone;
      b.addEventListener('click', () => clicarItem(id));
      barra.appendChild(b);
    } else {
      const d = document.createElement('div');
      d.className = 'slot';
      barra.appendChild(d);
    }
  }
}
function addItem(id) {
  if (!estado.inventario.includes(id)) estado.inventario.push(id);
  salvar();
  renderInventario();
}
function removerItem(id) {
  estado.inventario = estado.inventario.filter(i => i !== id);
  salvar();
  renderInventario();
}
function clicarItem(id) {
  if (id === 'mapa') {
    selecionado = null;
    renderInventario();
    abrirMapa();
    return;
  }
  if (id === 'papel_dica') {
    selecionado = null;
    renderInventario();
    abrirEnigmaPapel();
    return;
  }
  if (selecionado === id) {
    selecionado = null;
    fala('Item guardado.');
  } else {
    selecionado = id;
    fala(ITENS[id].nome + ': ' + ITENS[id].desc);
  }
  renderInventario();
}
function ligar(id, alvo, fn, usos) {
  const el = $(id);
  if(el) {
    el.addEventListener('click', () => {
      if (selecionado) {
        if (usos && usos[selecionado]) { usos[selecionado](); return; }
        fala(ITENS[selecionado].nome + ' não funciona em: ' + alvo + '. Clique no item de novo para guardá-lo.');
        return;
      }
      fn();
    });
  }
}

function abrirMapa() {
  abrirModal('Mapa do Restaurante', `
    <div class="mapa">
      <div class="sala">1 · Despensa</div>
      <div class="sala atual">2 · Confeitaria e Fornos<br>(você está aqui)</div>
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A porta de madeira à esquerda leva à Câmara Fria.</p>
  `);
}

function abrirReceita() {
  abrirModal('Papel de receitas', `
    <div class="papel">
      <p><strong>Merengue Suíço da Casa</strong></p>
      <p>4 claras, 220 g de açúcar e uma pitada de sal. Bater em banho-maria até firmar.</p>
      <p><strong>Estágio 1 (Secar):</strong> exige <strong>Chama Azul-Ciano</strong> (calor suave).</p>
      <p><strong>Estágio 2 (Dourar):</strong> veja a cor no Cartaz da parede.</p>
      <p>"Não olhe números! O segredo do merengue perfeito está na cor da chama do queimador."</p>
    </div>
  `);
}

function abrirPoster() {
  abrirModal('Cartaz do merengue', `
    <div class="papel">
      <p><strong>MERENGUE · Espectro de Cozimento</strong></p>
      <p>O merengue perfeito é assado em dois estágios visuais:</p>
      <p><strong>1º Secar:</strong> <span class="amostra-cor" style="background:#2563eb"></span> Azul-Ciano</p>
      <p><strong>2º Dourar:</strong> <span class="amostra-cor" style="background:#d97706"></span> Âmbar Dourado</p>
    </div>
  `);
}

function abrirTabela() {
  abrirModal('Guia de Chamas', `
    <div class="papel">
      <p><strong>Escala Cromática do Queimador</strong></p>
      <table class="tabela-conv">
        <tr><th>Cor da Chama</th><th>Intensidade</th></tr>
        <tr><td><span class="amostra-cor" style="background:#2563eb"></span>Azul-Ciano</td><td>Baixa (Secagem)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#10b981"></span>Verde-Esmeralda</td><td>Morna (Fermentação)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#d97706"></span>Âmbar Dourado</td><td>Média-Alta (Caramelizar)</td></tr>
        <tr><td><span class="amostra-cor" style="background:#dc2626"></span>Vermelho-Brasa</td><td>Máxima (Queima rápido)</td></tr>
      </table>
    </div>
  `);
}

function calcularCorChama(val) {
  if (val < 18) return { nome: 'Azul Profundo (Muito Frio)', hex: '#1e3a8a' };
  if (val <= 34) return { nome: 'Azul-Ciano (Chama Branda)', hex: '#2563eb' };
  if (val < 64) return { nome: 'Verde-Esmeralda (Morna)', hex: '#10b981' };
  if (val <= 80) return { nome: 'Âmbar Dourado (Média-Alta)', hex: '#d97706' };
  return { nome: 'Vermelho-Brasa (Quente Demais!)', hex: '#dc2626' };
}

function abrirPainel(n) {
  const e = ESTAGIOS[n];
  let valorAtual = 50;
  const corInicial = calcularCorChama(valorAtual);

  abrirModal('Queimador · Estágio ' + n + ' (' + e.nome + ')', `
    <div class="display-forno">
      FORNO CONFEITARIA · ESTÁGIO ${n}<br>
      Ajuste o regulador de gás até atingir a cor indicada na receita.
    </div>
    <div class="visor-chama" id="visor-chama" style="background:${corInicial.hex}">
      ${corInicial.nome}
    </div>
    <input type="range" class="slider-pixel" id="slider-chama" min="0" max="100" value="${valorAtual}">
    <button type="button" class="btn-pixel" id="confirmar-chama">ACENDER QUEIMADOR</button>
    <p class="dica-modal" id="msg-forno">Arraste o controle para mudar a cor da chama.</p>
  `);

  const slider = $('#slider-chama');
  const visor = $('#visor-chama');

  slider.addEventListener('input', () => {
    valorAtual = Number(slider.value);
    const info = calcularCorChama(valorAtual);
    visor.style.backgroundColor = info.hex;
    visor.textContent = info.nome;
  });

  $('#confirmar-chama').addEventListener('click', () => {
    if (valorAtual >= e.min && valorAtual <= e.max) {
      estado.fornoEtapa = n === 1 ? 1 : 3;
      estado.assadoEm = Date.now() + TEMPO_ESTAGIO;
      estado.acertos++;
      salvar();
      atualizarForno();
      fecharModal();
      fala(n === 1
        ? 'Chama Azul-Ciano estabilizada! O merengue começou a secar no Estágio 1.'
        : 'Chama Âmbar Dourada estabilizada! O merengue está dourando no Estágio 2.');
    } else {
      estado.erros++;
      salvar();
      $('#msg-forno').textContent = 'Essa cor de chama vai estragar o ponto! Confira a Receita e o Cartaz.';
    }
  });
}

function abrirForno() {
  const et = estado.fornoEtapa;
  if (et === 0) { abrirPainel(1); return; }
  if (et === 2) { abrirPainel(2); return; }
  if (et === 1 || et === 3) {
    const s = Math.max(1, Math.ceil((estado.assadoEm - Date.now()) / 1000));
    fala('O merengue ainda está assando. Faltam cerca de ' + s + ' segundos.');
    return;
  }
  if (et === 4) {
    estado.merengue = true;
    estado.fornoEtapa = 5;
    salvar();
    addItem('merengue');
    atualizarForno();
    fala('Você tirou o merengue do forno, dourado e firme!');
    return;
  }
  fala('O forno está vazio. O merengue já está no seu inventário.');
}

function atualizarForno() {
  const f = $('#no-forno');
  if(!f) return;
  const agora = Date.now();
  if (estado.fornoEtapa === 1 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 2;
    salvar();
    fala('Ding! Estágio 1 concluído. Clique no forno para ajustar a chama do Estágio 2.');
  } else if (estado.fornoEtapa === 3 && agora >= estado.assadoEm) {
    estado.fornoEtapa = 4;
    salvar();
    fala('Ding! O merengue está dourado e pronto. Clique no forno para retirá-lo.');
  }
  f.classList.toggle('ligado', estado.fornoEtapa === 1 || estado.fornoEtapa === 3);
  f.classList.toggle('pronto', estado.fornoEtapa === 2 || estado.fornoEtapa === 4);
}

function abrirCalda() {
  if (estado.caldaPronta) {
    fala('A calda já está no ponto. Guarde-a para o prato final.');
    return;
  }
  selecionado = null;
  renderInventario();
  const span = CALDA.max - CALDA.min;
  const zonaEsq = ((CALDA.alvo - CALDA.tol - CALDA.min) / span) * 100;
  const zonaLarg = ((2 * CALDA.tol) / span) * 100;
  abrirModal('Ponto da calda', `
    <p>Pare o termômetro no <strong>Ponto de Bola Mole: ${CALDA.alvo} °C</strong>.</p>
    <div class="termo">
      <div class="zona" style="left:${zonaEsq}%;width:${zonaLarg}%"></div>
      <div class="agulha" id="agulha"></div>
    </div>
    <div class="leitura" id="leitura">${CALDA.min.toFixed(1)} °C</div>
    <button type="button" class="btn-pixel" id="parar">PARAR</button>
    <p class="dica-modal" id="calda-msg">Clique em PARAR quando a agulha estiver na faixa verde.</p>
  `);
  const agulha = $('#agulha');
  const leitura = $('#leitura');
  let temp = CALDA.min;
  const t0 = performance.now();
  let raf = 0;
  const quadro = agora => {
    const d = ((agora - t0) / 1000) * CALDA.vel;
    const m = d % (2 * span);
    temp = CALDA.min + (m <= span ? m : 2 * span - m);
    if(agulha) agulha.style.left = (((temp - CALDA.min) / span) * 100) + '%';
    if(leitura) leitura.textContent = temp.toFixed(1) + ' °C';
    raf = requestAnimationFrame(quadro);
  };
  raf = requestAnimationFrame(quadro);
  aoFechar = () => cancelAnimationFrame(raf);

  $('#parar').addEventListener('click', () => {
    if (Math.abs(temp - CALDA.alvo) <= CALDA.tol) {
      estado.caldaPronta = true;
      estado.acertos++;
      salvar();
      addItem('calda');
      fecharModal();
      fala('Perfeito! A calda parou em ' + temp.toFixed(1) + ' °C.');
    } else {
      estado.erros++;
      salvar();
      $('#calda-msg').textContent = temp < CALDA.alvo
        ? 'Cedo demais: a calda ainda está rala (' + temp.toFixed(1) + ' °C).'
        : 'Passou do ponto (' + temp.toFixed(1) + ' °C).';
    }
  });
}

ligar('#no-receita', 'Receita', abrirReceita);
ligar('#no-poster', 'Cartaz', abrirPoster);
ligar('#no-tabela', 'Guia de Chamas', abrirTabela);
ligar('#no-forno', 'Forno', abrirForno);

ligar('#no-potes-meio', 'Potes de farinha', () => {
  window.location.href = 'farinhas.html';
});

// Lógica da porta na Cena 2: Com a chave selecionada vai para a cena 3, sem a chave vai para a bancada
ligar('#no-porta', 'Porta', () => {
  if (selecionado === 'chave_porta') {
    fala('Você usou a chave e abriu a porta para a cena 3!');
    setTimeout(() => {
      window.location.href = 'cena3.html';
    }, 1000);
  } else {
    window.location.href = 'bancada.html';
  }
});

ligar('#no-calda', 'Frasco de calda', () => {
  if (estado.caldaPronta) {
    fala('A calda já está pronta e guardada.');
  } else if (estado.inventario.includes('termometro')) {
    fala('Selecione o termômetro digital no inventário e clique no frasco.');
  } else {
    fala('Um frasco de açúcar caramelizando. Falta um termômetro para acertar o ponto.');
  }
}, { termometro: abrirCalda });

ligar('#no-marmore', 'Bancada', () => {
  fala('O mármore está gelado. Serve para descongelar coisas devagar.');
}, {
  yuzu: () => {
    removerItem('yuzu');
    selecionado = null;
    estado.yuzuUsado = true;
    salvar();
    renderInventario();
    fala('Você deixou o yuzu sobre o mármore frio para descongelar.');
  }
});

const avisoForno = () => fala('Forno vazio e desligado.');
ligar('#no-forno2', 'Forno', avisoForno);
ligar('#no-forno3', 'Forno', avisoForno);
ligar('#no-forno4', 'Forno', avisoForno);

ligar('#no-janela', 'Janela', () => fala('Uma janela com grades.'));
ligar('#no-frasco', 'Alambique', () => fala('Um alambique de vidro com líquido borbulhando.'));
ligar('#no-extrato', 'Extrato', () => fala('Garrafa de extrato.'));
ligar('#no-yuzu', 'Yuzu', () => fala('Pote de yuzu.'));
ligar('#no-barril', 'Barril', () => fala('Barril vazio.'));
ligar('#no-caixote', 'Caixote', () => fala('Caixote com potes vazios.'));
ligar('#no-prateleira', 'Prateleira', () => fala('Potes de ingredientes.'));
ligar('#no-panelas', 'Panelas', () => fala('Panelas empilhadas.'));
ligar('#no-bicos', 'Bicos', () => fala('Bicos de confeitar.'));
ligar('#no-batedeira', 'Batedeira', () => fala('Batedeira industrial.'));

function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return m + ':' + s;
}
function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  try { sessionStorage.removeItem(CHAVE_ESTADO); } catch (e) {}
  abrirModal('FORA DO TEMPO!', `
    <p>O concurso começou sem você.</p>
    <a class="btn-pixel" href="../index.html">Voltar ao menu</a>
  `);
}
function tick() {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');
  if(cron) {
    cron.textContent = formatar(restante);
    cron.classList.toggle('urgente', restante <= 60);
  }
  atualizarForno();
  if (restante <= 0) fimDeJogo();
}
const relogio = setInterval(tick, 1000);

renderInventario();
tick();
fala('Estação de Confeitaria. O merengue está no forno de cima.');