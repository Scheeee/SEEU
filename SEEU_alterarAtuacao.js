// ==UserScript==
// @name         SEEU - Alterar atuação e retornar ao processo
// @namespace    https://github.com/scheeee
// @version      1.0
// @description  Altera a área de atuação no SEEU e retorna automaticamente ao processo
// @match        https://seeu.pje.jus.br/seeu/processo.do
// @match        https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @match        https://seeu.pje.jus.br/seeu/usuario/areaAtuacao.do?*
// @match        https://seeu.pje.jus.br/seeu/inicio.do*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const RETURN_KEY = 'REABRIR_PROCESSO_DEPOIS';
  const BUTTON_CLASS = '_btn_v82dh_1';

  const isProcessoPage = () =>
    location.href.includes('/processo.do') || location.href.includes('/visualizacaoProcesso.do');

  const isAreaAtuacaoPage = () =>
    location.href.includes('/areaAtuacao.do');

    if (isAreaAtuacaoPage()) {
        const voltarPara = localStorage.getItem(RETURN_KEY);
        if (voltarPara) {
            localStorage.removeItem(RETURN_KEY);
            window.top.location.href = voltarPara;
        }
    }
  if (isProcessoPage()) {
    alterarAtuacao();
  }

  function alterarAtuacao() {
    const areaAtual = document.querySelector('#areaatuacao')?.textContent ?? '';
    const linkAlterar = document.querySelector('#alterarAreaAtuacao');

    const match = decodeURI(linkAlterar?.href ?? '').match(
      /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
    );
    const urlAlterar = match?.[1];
    const informacoesProcessuais = document.querySelector('#informacoesProcessuais');
    const linhaJuizo = Array.from(informacoesProcessuais?.querySelectorAll('tr') ?? [])
      .filter(x => x.cells.length === 2)
      .find(x => (x.cells[0]?.textContent?.trim() ?? '') === 'Juízo:');
    const juizo = linhaJuizo?.cells[1]?.textContent?.trim() ?? '';

    if (!urlAlterar || areaAtual === juizo) return;

    const button = criarBotao(urlAlterar, juizo);
    linhaJuizo.cells[1]?.append(' ', button);
  }

  function criarBotao(urlAlterar, juizoProcesso) {
    const button = document.createElement('input');
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.value = 'Alternar para esta área de atuação';
    button.onclick = async evt => {
      evt.preventDefault();
      button.disabled = true;
      try {
        await alternar(urlAlterar, juizoProcesso);
      } catch (err) {
        console.error(err);
        alert(`Erro ao alternar para "${juizoProcesso}". Você tem acesso a essa área?`);
      } finally {
        button.disabled = false;
      }
    };
    return button;
  }

  async function alternar(url, area) {
    const doc = await XHR(url);
    const links = Array.from(
      doc.querySelectorAll('a[href][target="mainFrame"]')
    ).filter(x => x.textContent?.trim() === area);
    if (links.length !== 1) throw new Error('Link da nova atuação não encontrado');

    const link = links[0];
    const processoAtual = window.location.href;
    localStorage.setItem(RETURN_KEY, processoAtual);
    document.body.appendChild(link);
    link.click();
  }

  function XHR(url) {
    return new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'document';
      xhr.onload = () => res(xhr.response);
      xhr.onerror = rej;
      xhr.send();
    });
  }
})();

