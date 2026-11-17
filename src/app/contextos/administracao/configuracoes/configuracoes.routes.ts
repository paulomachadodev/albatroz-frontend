import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';
import { configuracaoAlteradaGuard } from './pages/configuracoes-pagina/configuracao-formulario.base';

const editarConfiguracao = { canActivate: [permissaoGuard], canDeactivate: [configuracaoAlteradaGuard], data: { permissao: 'configuracoes:ler' } };

export const CONFIGURACOES_ROUTES: Routes = [
  { path: 'ia/limites', canActivate: [permissaoGuard], canDeactivate: [configuracaoAlteradaGuard], data: { permissao: 'ia_configuracoes:ler' }, title: 'Limites de IA', loadComponent: () => import('./pages/configuracoes-pagina/ia-limites.component').then(m => m.IaLimitesComponent) },
  { path: 'ia/consumo', canActivate: [permissaoGuard], data: { permissao: 'ia_consumo:ler' }, title: 'Consumo de IA', loadComponent: () => import('./pages/configuracoes-pagina/ia-consumo.component').then(m => m.IaConsumoComponent) },
  { path: 'ia/validacoes', canActivate: [permissaoGuard], data: { permissao: 'ia_configuracoes:ler' }, title: 'Histórico de validações Google', loadComponent: () => import('./pages/configuracoes-pagina/ia-validacoes.component').then(m => m.IaValidacoesComponent) },
  { path: '', pathMatch: 'full', title: 'Configurações', loadComponent: () => import('./pages/configuracoes-pagina/configuracoes-pagina.component').then(m => m.ConfiguracoesPaginaComponent) },
  { path: 'ia', ...editarConfiguracao, data: { permissao: 'ia_configuracoes:ler' }, title: 'Inteligência artificial', loadComponent: () => import('./pages/configuracoes-pagina/ia-configuracao.component').then(m => m.IaConfiguracaoComponent) },
  { path: 'email', ...editarConfiguracao, title: 'E-mail e SMTP', loadComponent: () => import('./pages/configuracoes-pagina/email-configuracao.component').then(m => m.EmailConfiguracaoComponent) },
  { path: 'listas-preco', ...editarConfiguracao, data: { permissao: 'produtos:ler' }, title: 'Listas de preço', loadComponent: () => import('./pages/configuracoes-pagina/venda-configuracao.component').then(m => m.VendaConfiguracaoComponent) },
  { path: 'metas', ...editarConfiguracao, title: 'Metas e vendedores', loadComponent: () => import('./pages/configuracoes-pagina/metas-configuracao.component').then(m => m.MetasConfiguracaoComponent) },
  { path: 'condicoes-comerciais', ...editarConfiguracao, data: { permissao: 'cotacoes:ler' }, title: 'Condições comerciais', loadComponent: () => import('./pages/configuracoes-pagina/condicoes-comerciais-configuracao.component').then(m => m.CondicoesComerciaisConfiguracaoComponent) },
  { path: 'estoque', ...editarConfiguracao, title: 'Parâmetros de estoque', loadComponent: () => import('./pages/configuracoes-pagina/estoque-configuracao.component').then(m => m.EstoqueConfiguracaoComponent) },
  { path: 'fiscal', ...editarConfiguracao, title: 'Fiscal e bancos CNAB', loadComponent: () => import('./pages/configuracoes-pagina/fiscal-configuracao.component').then(m => m.FiscalConfiguracaoComponent) },
  { path: 'catalogos', ...editarConfiguracao, title: 'Catálogos e site', loadComponent: () => import('./pages/configuracoes-pagina/integracoes-configuracao.component').then(m => m.IntegracoesConfiguracaoComponent) },
  { path: 'busca-imagens', ...editarConfiguracao, title: 'Busca de imagens', loadComponent: () => import('./pages/configuracoes-pagina/busca-imagens-configuracao.component').then(m => m.BuscaImagensConfiguracaoComponent) },
  { path: 'alertas-sincronizacao', ...editarConfiguracao, title: 'Alertas de sincronização', loadComponent: () => import('./pages/configuracoes-pagina/tiny-etl-configuracao.component').then(m => m.TinyEtlConfiguracaoComponent) }
];
