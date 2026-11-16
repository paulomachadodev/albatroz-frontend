import { CONFIGURACOES_GRUPOS, filtrarConfiguracoes } from '../../contextos/administracao/configuracoes/configuracoes-catalogo';
import { MENU_CATALOGO, encontrarPagina, filtrarMenu, listarPaginas, normalizarBusca } from './menu-catalogo';

describe('Navegação autorizada', () => {
  it('concentra os destinos administrativos em configurações sem duplicações', () => {
    expect(MENU_CATALOGO.some(item => item.id === 'administracao')).toBeFalse();
    const paginas = listarPaginas(filtrarMenu(MENU_CATALOGO, () => true, true, true));
    for (const rota of ['/usuarios', '/perfis', '/relatorios']) {
      const destinos = paginas.filter(p => p.item.rota === rota);
      expect(destinos.length).toBe(1);
      expect(destinos[0].ancestrais).toEqual(['configuracoes', 'configuracoes-pessoas']);
    }
    const grupos = filtrarConfiguracoes(chave => chave === 'relatorios:ler', false);
    expect(grupos[0].titulo).toBe('Administração');
    expect(grupos[0].destinos.map(d => d.rota)).toEqual(['/relatorios']);
  });

  it('remove recursivamente destinos negados e grupos vazios', () => {
    const menu = filtrarMenu(MENU_CATALOGO, chave => chave === 'compras:ler', false, false);
    const paginas = listarPaginas(menu);
    expect(paginas.some(p => p.item.id === 'notas-entrada')).toBeTrue();
    expect(paginas.some(p => p.item.id === 'usuarios')).toBeFalse();
    expect(menu.some(item => item.id === 'administracao')).toBeFalse();
  });

  it('não herda Tiny nem dashboard quando a empresa não tem acesso', () => {
    const paginas = listarPaginas(filtrarMenu(MENU_CATALOGO, () => true, false, false));
    expect(paginas.some(p => p.item.rota === '/integracoes/tiny')).toBeFalse();
    expect(paginas.some(p => p.item.rota === '/balanco')).toBeFalse();
    expect(paginas.some(p => p.item.rota === '/dashboard')).toBeFalse();
  });

  it('encontra a página mais específica e não ativa relatório ao navegar aos documentos', () => {
    const paginas = listarPaginas(filtrarMenu(MENU_CATALOGO, () => true, true, true));
    const pagina = encontrarPagina(paginas, '/compras/notas-entrada/42?origem=lista');
    expect(pagina?.item.id).toBe('notas-entrada');
    expect(pagina?.ancestrais).toEqual(['compras', 'compras-documentos']);
  });

  it('não confunde prefixos de nomes de rotas', () => {
    expect(encontrarPagina([{ item: { id: 'produto', label: 'Produto', rota: '/produto' }, caminho: 'Produto', ancestrais: [] }], '/produtos')).toBeUndefined();
  });

  it('permite central restrita a perfis sem exigir acesso genérico a configurações', () => {
    const grupos = filtrarConfiguracoes(chave => chave === 'perfis:ler', false);
    expect(grupos.map(g => g.id)).toEqual(['pessoas']);
    expect(grupos[0].destinos.map(d => d.id)).toEqual(['perfis']);
    expect(listarPaginas(filtrarMenu(MENU_CATALOGO, chave => chave === 'perfis:ler', false, false)).some(p => p.item.rota === '/configuracoes')).toBeTrue();
  });

  it('filtra título, caminho e sinônimos sem depender de acentos', () => {
    expect(filtrarConfiguracoes(() => true, true, 'smtp')[0].destinos[0].id).toBe('email');
    expect(filtrarConfiguracoes(() => true, true, 'cnab')[0].destinos[0].id).toBe('fiscal');
    expect(normalizarBusca('  Permissões  ')).toBe('permissoes');
    expect(filtrarConfiguracoes(() => false, true, 'smtp')).toEqual([]);
  });

  it('não inclui formulários futuros nem IDs repetidos', () => {
    const destinos = CONFIGURACOES_GRUPOS.flatMap(g => g.destinos);
    expect(new Set(destinos.map(d => d.id)).size).toBe(destinos.length);
    expect(destinos.some(d => /gemini|identidade|redes sociais/i.test(d.titulo))).toBeFalse();
  });
});
