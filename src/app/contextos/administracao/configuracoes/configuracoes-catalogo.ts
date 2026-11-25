export interface DestinoConfiguracao {
  id: string;
  titulo: string;
  descricao: string;
  rota: string;
  permissao: string;
  termos?: string;
  apenasComTiny?: boolean;
}

export interface GrupoConfiguracao {
  id: string;
  titulo: string;
  destinos: DestinoConfiguracao[];
}

export const CONFIGURACOES_GRUPOS: GrupoConfiguracao[] = [
  { id: 'empresa', titulo: 'Empresa', destinos: [
    { id: 'identidade-marca', titulo: 'Identidade da marca', descricao: 'Contexto, comunicação e identidade visual da empresa atual.', rota: '/configuracoes/identidade-marca', permissao: 'identidade_marca:ler', termos: 'logo marca cores paleta público segmento fontes tom voz' },
    { id: 'dados-empresa', titulo: 'Dados da empresa', descricao: 'Cadastro, endereço e contatos.', rota: '/configuracoes/dados-empresa', permissao: 'configuracoes:ler', termos: 'cnpj razão social nome fantasia' }
  ] },
  { id: 'pessoas', titulo: 'Administração', destinos: [
    { id: 'usuarios', titulo: 'Usuários', descricao: 'Pessoas que acessam o sistema.', rota: '/usuarios', permissao: 'usuarios:ler', termos: 'equipe login senha' },
    { id: 'perfis', titulo: 'Perfis e permissões', descricao: 'Acesso aos recursos da empresa.', rota: '/perfis', permissao: 'perfis:ler', termos: 'segurança autorização' },
    { id: 'relatorios', titulo: 'Relatórios', descricao: 'Acesso aos relatórios administrativos.', rota: '/relatorios', permissao: 'relatorios:ler', termos: 'administração' }
  ] },
  { id: 'comercial', titulo: 'Comercial e operação', destinos: [
    { id: 'venda', titulo: 'Listas de preço', descricao: 'Tabelas e regras de cálculo.', rota: '/configuracoes/listas-preco', permissao: 'produtos:ler', termos: 'venda valores percentual' },
    { id: 'metas', titulo: 'Metas e vendedores', descricao: 'Objetivos mensais e regras por vendedor.', rota: '/configuracoes/metas', permissao: 'configuracoes:ler' },
    { id: 'condicoes-comerciais', titulo: 'Condições comerciais', descricao: 'Pagamento, validade e condições das propostas.', rota: '/configuracoes/condicoes-comerciais', permissao: 'cotacoes:ler', termos: 'cotação orçamento parcelas descontos' },
    { id: 'estoque', titulo: 'Parâmetros de estoque', descricao: 'Meta diária de contagem.', rota: '/configuracoes/estoque', permissao: 'configuracoes:ler', termos: 'balanço inventário' }
  ] },
  { id: 'fiscal', titulo: 'Fiscal e financeiro', destinos: [
    { id: 'fiscal', titulo: 'Fiscal e bancos CNAB', descricao: 'Certificado A1, regime tributário e arquivos bancários.', rota: '/configuracoes/fiscal', permissao: 'configuracoes:ler', termos: 'pfx emissão nfe cte ambiente banco' },
    { id: 'naturezas', titulo: 'Naturezas de operação', descricao: 'Cadastro de regras de tributação.', rota: '/fiscal/naturezas-operacao', permissao: 'configuracoes:ler', termos: 'imposto fiscal cfop' }
  ] },
  { id: 'inteligencia-artificial', titulo: 'Inteligência artificial', destinos: [
    { id: 'ia-limites', titulo: 'Limites de IA', descricao: 'Orçamento, reservas e alertas da empresa atual.', rota: '/configuracoes/ia/limites', permissao: 'ia_configuracoes:ler', termos: 'proteção concorrência reserva orçamento financeiro alerta' },
    { id: 'ia-consumo', titulo: 'Consumo de IA', descricao: 'Tokens e custos calculados das requisições medidas.', rota: '/configuracoes/ia/consumo', permissao: 'ia_consumo:ler', termos: 'google gastos tarifa custo requisições tokens' },
    { id: 'ia-validacoes', titulo: 'Histórico de validações Google', descricao: 'Tentativas de validação e tokens informados pelo Google.', rota: '/configuracoes/ia/validacoes', permissao: 'ia_configuracoes:ler', termos: 'consumo tokens histórico validação ia' },
    { id: 'ia-configuracao', titulo: 'Inteligência artificial', descricao: 'Chave Google e modelo da empresa atual.', rota: '/configuracoes/ia', permissao: 'ia_configuracoes:ler', termos: 'google gemini chave credencial modelo ia' }
  ] },
  { id: 'integracoes', titulo: 'Integrações e canais', destinos: [
    { id: 'mercado-livre', titulo: 'Mercado Livre', descricao: 'Conta da empresa, fotos de produtos e anúncios.', rota: '/configuracoes/mercado-livre', permissao: 'integracoes_marketplace:ler', termos: 'marketplace anúncio loja vendedor imagens fotos mercadolivre' },
    { id: 'redes-sociais', titulo: 'Redes sociais', descricao: 'Perfis editoriais e conexão com Facebook e Instagram.', rota: '/configuracoes/redes-sociais', permissao: 'integracoes_sociais:ler', termos: 'facebook instagram tiktok whatsapp perfil conta' },
    { id: 'banco-imagens', titulo: 'Banco de imagens', descricao: 'Chave do Unsplash para os fundos das artes de marketing.', rota: '/configuracoes/banco-imagens', permissao: 'integracoes_sociais:ler', termos: 'unsplash fotos fundo imagem chave marketing' },
    { id: 'waha', titulo: 'Integração WAHA (WhatsApp)', descricao: 'Conectar o número da loja, ler o QR code e escolher quem a Albia atende.', rota: '/configuracoes/waha', permissao: 'waha:ler', termos: 'whatsapp waha qr code conectar albia bloquear numero atendimento bot' },
    { id: 'email', titulo: 'E-mail e SMTP', descricao: 'Servidor de envio e remetente.', rota: '/configuracoes/email', permissao: 'configuracoes:ler', termos: 'smtp comunicação email' },
    { id: 'integracoes', titulo: 'Catálogos e site', descricao: 'Google Merchant, catálogo Meta e endereço do site.', rota: '/configuracoes/catalogos', permissao: 'configuracoes:ler', termos: 'feed facebook instagram integração' },
    { id: 'tiny-etl', titulo: 'Alertas de sincronização', descricao: 'E-mail para alertas do Tiny e ETL.', rota: '/configuracoes/alertas-sincronizacao', permissao: 'configuracoes:ler', apenasComTiny: true },
    { id: 'tiny', titulo: 'ERP Tiny', descricao: 'Acompanhar integração e sincronização.', rota: '/integracoes/tiny', permissao: 'configuracoes:ler', apenasComTiny: true, termos: 'etl' }
  ] }
];

export function filtrarConfiguracoes(temPermissao: (chave: string) => boolean, tinyAtivo: boolean, busca = '', grupoId = ''): GrupoConfiguracao[] {
  const normalizar = (valor: string): string => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const termos = normalizar(busca).trim().split(/\s+/).filter(Boolean);
  return CONFIGURACOES_GRUPOS.filter(grupo => !grupoId || grupo.id === grupoId).map(grupo => ({ ...grupo, destinos: grupo.destinos.filter(destino =>
    temPermissao(destino.permissao) && (!destino.apenasComTiny || tinyAtivo) && termos.every(termo => normalizar(`${grupo.titulo} ${destino.titulo} ${destino.descricao} ${destino.termos ?? ''}`).includes(termo))
  ) })).filter(grupo => grupo.destinos.length > 0);
}
