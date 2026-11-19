import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = new URL('../src/app', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const MARCA_INFORMATIVA = 'data-acao-informativa';

function arquivosHtml(pasta) {
  return readdirSync(pasta).flatMap(nome => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivosHtml(caminho) : caminho.endsWith('.html') ? [caminho] : [];
  });
}

function regioesDeLinha(texto) {
  const regioes = [];
  const abertura = /<ng-template\s+#linha(Mobile)?\b[^>]*>/g;
  let achado;
  while ((achado = abertura.exec(texto)) !== null) {
    const fim = texto.indexOf('</ng-template>', abertura.lastIndex);
    if (fim === -1) continue;
    const inicio = abertura.lastIndex;
    regioes.push({ texto: texto.slice(inicio, fim), linhaInicial: texto.slice(0, inicio).split('\n').length });
  }
  return regioes;
}

const violacoes = [];
for (const arquivo of arquivosHtml(RAIZ)) {
  const conteudo = readFileSync(arquivo, 'utf8');
  if (!conteudo.includes('app-listagem-paginada')) continue;
  for (const regiao of regioesDeLinha(conteudo)) {
    const elementos = /<(button|a)\b[^>]*>/g;
    let m;
    while ((m = elementos.exec(regiao.texto)) !== null) {
      if (m[0].includes(MARCA_INFORMATIVA)) continue;
      const linha = regiao.linhaInicial + regiao.texto.slice(0, m.index).split('\n').length - 1;
      violacoes.push(`${relative(RAIZ, arquivo)}:${linha}  ${m[0].slice(0, 110)}`);
    }
  }
}

if (violacoes.length) {
  console.error('Ação de linha fora do padrão. Use <app-btn-icone> (ou marque com data-acao-informativa se for só um dado clicável, como contador ou link de texto da própria célula):');
  violacoes.forEach(v => console.error('  ' + v));
  process.exit(1);
}
console.log('Ações de linha: padrão respeitado.');
