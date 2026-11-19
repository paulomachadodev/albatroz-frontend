import { CONFIGURACOES_GRUPOS } from '../../contextos/administracao/configuracoes/configuracoes-catalogo';

export interface ItemMenu {
  id: string;
  label: string;
  icone?: string;
  rota?: string;
  permissao?: string;
  qualquerPermissao?: string[];
  apenasComTiny?: boolean;
  apenasDashboard?: boolean;
  filhos?: ItemMenu[];
}

export interface PaginaMenu {
  item: ItemMenu;
  caminho: string;
  ancestrais: string[];
}

export const MENU_CATALOGO: ItemMenu[] = [
  { id: 'inicio', label: 'Início', icone: 'space_dashboard', rota: '/dashboard', apenasDashboard: true },
  { id: 'cadastros', label: 'Cadastros', icone: 'folder_open', filhos: [
    { id: 'produtos', label: 'Produtos', rota: '/produtos', permissao: 'produtos:ler' },
    { id: 'busca-preco', label: 'Busca preço', rota: '/produtos/busca-preco', permissao: 'produtos:ler' },
    { id: 'contatos', label: 'Contatos', rota: '/cadastros/contatos', permissao: 'contatos:ler' },
    { id: 'escolas', label: 'Escolas', rota: '/cadastros/escolas', permissao: 'cadastros:ler' },
    { id: 'series', label: 'Séries', rota: '/cadastros/series', permissao: 'cadastros:ler' }
  ] },
  { id: 'comercial', label: 'Comercial', icone: 'point_of_sale', filhos: [
    { id: 'orcamentos', label: 'Orçamentos', rota: '/cotacoes/listas-escolares', permissao: 'cotacoes:ler' },
    { id: 'vendas', label: 'Relatório de vendas', rota: '/vendas/relatorio-produtos', permissao: 'vendas:ler' }
  ] },
  { id: 'compras', label: 'Compras', icone: 'shopping_cart', filhos: [
    { id: 'compras-relatorio', label: 'Relatório', rota: '/compras', permissao: 'compras:ler' },
    { id: 'compras-fornecedores', label: 'Fornecedores', rota: '/compras/fornecedores', permissao: 'compras:ler' },
    { id: 'compras-pedidos', label: 'Pedidos', rota: '/compras/pedidos', permissao: 'compras:ler' },
    { id: 'compras-documentos', label: 'Documentos', filhos: [
      { id: 'notas-entrada', label: 'Entrada de notas', rota: '/compras/notas-entrada', permissao: 'compras:ler' },
      { id: 'ctes', label: 'CT-e', rota: '/compras/ctes', permissao: 'compras:ler' },
      { id: 'manifestacao', label: 'Manifestação NF-e', rota: '/compras/manifestacao', permissao: 'compras:ler' }
    ] }
  ] },
  { id: 'estoque', label: 'Estoque', icone: 'package_2', filhos: [
    { id: 'estoque-painel', label: 'Visão do estoque', rota: '/estoque', permissao: 'estoque:ler' },
    { id: 'balanco', label: 'Balanço', rota: '/balanco', permissao: 'estoque:ler', apenasComTiny: true }
  ] },
  { id: 'atendimento', label: 'Atendimento', icone: 'forum', filhos: [
    { id: 'whatsapp', label: 'WhatsApp', rota: '/whatsapp/atendimentos', permissao: 'atendimento:ler' }
  ] },
  { id: 'financeiro', label: 'Financeiro', icone: 'payments', filhos: [
    { id: 'cartoes', label: 'Cartões', rota: '/financeiro/cartoes', permissao: 'financeiro:ler' },
    { id: 'contas-pagar', label: 'Contas a pagar', rota: '/financeiro/contas-pagar', permissao: 'financeiro:ler' },
    { id: 'dda', label: 'Conciliação DDA', rota: '/financeiro/dda', permissao: 'financeiro:ler' }
  ] },
  { id: 'fiscal', label: 'Fiscal', icone: 'receipt_long', filhos: [
    { id: 'naturezas', label: 'Naturezas de operação', rota: '/fiscal/naturezas-operacao', permissao: 'configuracoes:ler' }
  ] },
  { id: 'marketing', label: 'Marketing', icone: 'campaign', filhos: [
    { id: 'marketing-criar', label: 'Criar postagem', rota: '/marketing/criar', permissao: 'marketing:criar' },
    { id: 'marketing-aprovacoes', label: 'Aprovações', rota: '/marketing/aprovacoes', permissao: 'marketing:ler' },
    { id: 'marketing-rotinas', label: 'Rotinas', rota: '/marketing/rotinas', permissao: 'marketing:ler' },
    { id: 'marketing-insights', label: 'Insights', rota: '/marketing/insights', permissao: 'marketing:ler' },
    { id: 'marketing-estrategia', label: 'Estratégia editorial', rota: '/marketing/estrategia', permissao: 'marketing:ler' },
    { id: 'marketing-briefings', label: 'Briefings', rota: '/marketing/briefings', permissao: 'marketing:ler' },
    { id: 'marketing-pecas', label: 'Peças', rota: '/marketing/pecas', permissao: 'marketing:ler' },
    { id: 'marketing-calendario', label: 'Calendário', rota: '/marketing/calendario', permissao: 'marketing:ler' }
  ] },
  { id: 'albia', label: 'Albia IA', icone: 'auto_awesome', rota: '/albia' },
  { id: 'configuracoes', label: 'Configurações', icone: 'settings', rota: '/configuracoes', filhos: CONFIGURACOES_GRUPOS.map(grupo => ({
    id: `configuracoes-${grupo.id}`, label: grupo.titulo, filhos: grupo.destinos.map(destino => ({
      id: `configuracoes-${destino.id}`, label: destino.titulo, rota: destino.rota, permissao: destino.permissao, apenasComTiny: destino.apenasComTiny
    }))
  })) }
];

export function filtrarMenu(itens: ItemMenu[], temPermissao: (chave: string) => boolean, tinyAtivo: boolean, dashboard: boolean): ItemMenu[] {
  return itens.flatMap(item => {
    if (item.apenasComTiny && !tinyAtivo || item.apenasDashboard && !dashboard) return [];
    if (item.permissao && !temPermissao(item.permissao)) return [];
    if (item.qualquerPermissao && !item.qualquerPermissao.some(temPermissao)) return [];
    if (!item.filhos) return [item];
    const filhos = filtrarMenu(item.filhos, temPermissao, tinyAtivo, dashboard);
    return filhos.length ? [{ ...item, filhos }] : [];
  });
}

export function listarPaginas(itens: ItemMenu[], caminho: string[] = [], ancestrais: string[] = []): PaginaMenu[] {
  return itens.flatMap(item => [
    ...(item.rota ? [{ item, caminho: [...caminho, item.label].join(' / '), ancestrais }] : []),
    ...(item.filhos ? listarPaginas(item.filhos, [...caminho, item.label], [...ancestrais, item.id]) : [])
  ]);
}

export function encontrarPagina(paginas: PaginaMenu[], url: string): PaginaMenu | undefined {
  const pathname = url.split(/[?#]/)[0];
  return paginas.filter(p => p.item.rota && (pathname === p.item.rota || pathname.startsWith(`${p.item.rota}/`)))
    .sort((a, b) => (b.item.rota?.length ?? 0) - (a.item.rota?.length ?? 0))[0];
}

export function normalizarBusca(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}
