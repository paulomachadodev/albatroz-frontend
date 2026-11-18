import { of, Subject } from 'rxjs';
import { PrimeNG } from 'primeng/config';
import { ToastService } from '../../../../core/feedback/toast.service';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { VendasService } from '../../services/vendas.service';
import { RelatorioVendaProduto } from '../../models/relatorio-venda-produto.model';
import { Resultado } from '../../../../core/models/resultado.model';
import { Paginacao } from '../../../../core/models/paginacao.model';
import { RelatorioVendasProdutosComponent } from './relatorio-vendas-produtos.component';

describe('Intervalo do relatório de vendas', () => {
  let componente: RelatorioVendasProdutosComponent;
  let vendas: jasmine.SpyObj<VendasService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    vendas = jasmine.createSpyObj<VendasService>('VendasService', ['listarRelatorioProdutos', 'exportarRelatorioProdutos']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['erro', 'erroServidor']);
    vendas.listarRelatorioProdutos.and.returnValue(of({ sucesso: true, dados: { dados: [], totalRegistros: 0, paginaAtual: 1, totalPaginas: 1, registrosPorPagina: 10 } }));
    componente = new RelatorioVendasProdutosComponent(vendas, {} as MarcasService, {} as ContatosService, toast, jasmine.createSpyObj<PrimeNG>('PrimeNG', ['setConfig']));
    componente.ngOnInit();
  });

  it('preserva datas locais e envia o intervalo completo ao filtro', () => {
    componente.aoMudarPreset('personalizado');
    componente.aoMudarIntervalo([new Date(2026, 10, 5), new Date(2026, 10, 18)]);
    componente.aplicarFiltros();
    expect(vendas.listarRelatorioProdutos).toHaveBeenCalled();
    expect(componente.filtro.dataInicio).toBe('2026-11-05');
    expect(componente.filtro.dataFim).toBe('2026-11-18');
  });

  it('não filtra nem exporta quando falta a data final', () => {
    componente.aoMudarPreset('personalizado');
    componente.aoMudarIntervalo([new Date(2026, 10, 5), null]);
    componente.totalQuantidade.set(20);
    componente.totaisDisponiveis.set(true);
    componente.aplicarFiltros();
    componente.exportarRelatorio('xlsx');
    expect(vendas.listarRelatorioProdutos).not.toHaveBeenCalled();
    expect(vendas.exportarRelatorioProdutos).not.toHaveBeenCalled();
    expect(componente.totalQuantidade()).toBe(0);
    expect(componente.totaisDisponiveis()).toBeFalse();
    expect(toast.erro).toHaveBeenCalledWith('Selecione as datas inicial e final do período.');
  });

  it('retoma os filtros predefinidos e limpa o intervalo personalizado', () => {
    componente.aoMudarPreset('personalizado');
    componente.aoMudarIntervalo([new Date(2026, 10, 5)]);
    componente.aoMudarPreset('mes_atual');
    expect(componente.intervaloDatas).toBeNull();
    expect(componente.filtro.dataInicio).toBeTruthy();
    expect(componente.filtro.dataFim).toBeTruthy();
    componente.limparFiltros();
    expect(componente.periodoPreset).toBe('ult90');
    expect(componente.intervaloDatas).toBeNull();
  });

  it('limpa os totais durante a busca e ignora respostas anteriores', () => {
    const anterior = new Subject<Resultado<Paginacao<RelatorioVendaProduto>>>();
    const atual = new Subject<Resultado<Paginacao<RelatorioVendaProduto>>>();
    vendas.listarRelatorioProdutos.and.returnValues(anterior, atual);
    componente.totalQuantidade.set(25);
    componente.totalValor.set(100);
    componente.totalEstoque.set(30);
    componente.totaisDisponiveis.set(true);
    componente.aplicarFiltros();
    expect(componente.totaisDisponiveis()).toBeFalse();
    expect([componente.totalQuantidade(), componente.totalValor(), componente.totalEstoque()]).toEqual([0, 0, 0]);
    componente.aplicarFiltros();
    const resposta = (quantidade: number): Resultado<Paginacao<RelatorioVendaProduto>> => ({
      sucesso: true, dados: { dados: [{ totalQuantidadeGeral: quantidade, totalValorGeral: 45, totalEstoqueGeral: 60 } as RelatorioVendaProduto], totalRegistros: 1, paginaAtual: 1, totalPaginas: 1, registrosPorPagina: 10 }
    });
    anterior.next(resposta(99));
    expect(componente.totaisDisponiveis()).toBeFalse();
    atual.next(resposta(12));
    expect(componente.totaisDisponiveis()).toBeTrue();
    expect([componente.totalQuantidade(), componente.totalValor(), componente.totalEstoque()]).toEqual([12, 45, 60]);
  });

  it('mantém os totais ocultos quando a busca falha ou retorna vazia', () => {
    const consulta = new Subject<Resultado<Paginacao<RelatorioVendaProduto>>>();
    vendas.listarRelatorioProdutos.and.returnValue(consulta);
    componente.totaisDisponiveis.set(true);
    componente.aplicarFiltros();
    consulta.error(new Error('falha'));
    expect(componente.totaisDisponiveis()).toBeFalse();
    expect(componente.carregando()).toBeFalse();
    vendas.listarRelatorioProdutos.and.returnValue(of({ sucesso: true, dados: { dados: [], totalRegistros: 0, paginaAtual: 1, totalPaginas: 1, registrosPorPagina: 10 } }));
    componente.aplicarFiltros();
    expect(componente.totaisDisponiveis()).toBeFalse();
  });
});
