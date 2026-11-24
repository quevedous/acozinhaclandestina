/* ------------------------------------------------------------------
   TEXTOS DAS ABAS (Como jogar · História · Desenvolvedores)
   Para editar os textos, mexa só no objeto HUD_ABAS logo abaixo.
   Quem desenha as abas é o js/hud.js (cenas) e o js/capa.js (capa).
------------------------------------------------------------------- */
window.HUD_ABAS = {
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

      <p class="dica"></p>
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