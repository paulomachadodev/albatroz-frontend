import { of } from 'rxjs';
import { PrimeNG } from 'primeng/config';
import { ToastService } from '../../../../core/feedback/toast.service';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { VendasService } from '../../services/vendas.service';
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
    componente.aplicarFiltros();
    componente.exportarRelatorio('xlsx');
    expect(vendas.listarRelatorioProdutos).not.toHaveBeenCalled();
    expect(vendas.exportarRelatorioProdutos).not.toHaveBeenCalled();
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
});
