import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { ProdutosDetalheComponent } from './produtos-detalhe.component';
import { ProdutosService } from '../../services/produtos.service';
import { MarcasService } from '../../services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ThemeService } from '../../../../core/theme/theme.service';
import { ProdutoDetalhe } from '../../models/produto.model';
import { Resultado } from '../../../../core/models';

describe('ProdutosDetalheComponent exclusao de imagens', () => {
  let componente: ProdutosDetalheComponent;
  let produtos: jasmine.SpyObj<ProdutosService>;
  let confirmar: jasmine.SpyObj<ConfirmService>;
  let toast: jasmine.SpyObj<ToastService>;
  let exclusao: Subject<Resultado<void>>;
  const imagens = [
    { id: 20, indice: 1, url: 'foto-1.jpg' },
    { id: 21, indice: 2, url: 'foto-2.jpg' }
  ];

  beforeEach(() => {
    produtos = jasmine.createSpyObj<ProdutosService>('ProdutosService', ['excluirImagem', 'obter']);
    confirmar = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirmar']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['sucesso', 'erroServidor', 'erro']);
    confirmar.confirmar.and.resolveTo(true);
    exclusao = new Subject<Resultado<void>>();
    produtos.excluirImagem.and.returnValue(exclusao);
    componente = new ProdutosDetalheComponent(
      {} as ActivatedRoute, {} as Router, produtos, {} as MarcasService,
      {} as ContatosService, toast, confirmar, {} as ThemeService, {} as DomSanitizer
    );
    componente.idProduto = 10;
    componente.produto.set({ id: 10, nome: 'Nome em edicao', imagens: [...imagens] } as ProdutoDetalhe);
  });

  it('remove e renumera a galeria na resposta sem esperar outra consulta nem apagar a edicao', async () => {
    await componente.excluirImagem(imagens[0]);
    expect(componente.excluindoImagemId()).toBe(20);
    expect(componente.produto()?.imagens.length).toBe(2);
    exclusao.next({ sucesso: true });
    expect(componente.produto()?.imagens).toEqual([{ ...imagens[1], indice: 1 }]);
    expect(componente.produto()?.nome).toBe('Nome em edicao');
    expect(componente.excluindoImagemId()).toBeNull();
    expect(produtos.obter).not.toHaveBeenCalled();
  });

  it('reconcilia somente a galeria quando a API falha depois de remover a imagem', async () => {
    produtos.obter.and.returnValue(of({ sucesso: true, dados: { id: 10, nome: 'Nome salvo', imagens: [imagens[1]] } as ProdutoDetalhe }));
    await componente.excluirImagem(imagens[0]);
    exclusao.error(new Error('Falha externa'));
    expect(componente.produto()?.imagens).toEqual([imagens[1]]);
    expect(componente.produto()?.nome).toBe('Nome em edicao');
    expect(toast.erroServidor).toHaveBeenCalled();
  });

  it('impede duas exclusoes simultaneas', async () => {
    await componente.excluirImagem(imagens[0]);
    await componente.excluirImagem(imagens[1]);
    expect(produtos.excluirImagem).toHaveBeenCalledTimes(1);
  });

  it('nao altera outro produto quando a resposta chega depois de navegar', async () => {
    await componente.excluirImagem(imagens[0]);
    componente.idProduto = 11;
    componente.produto.set({ id: 11, nome: 'Outro produto', imagens: [...imagens] } as ProdutoDetalhe);
    exclusao.next({ sucesso: true });
    expect(componente.produto()?.id).toBe(11);
    expect(componente.produto()?.imagens.length).toBe(2);
  });

  it('preserva a galeria quando a exclusao e cancelada', async () => {
    confirmar.confirmar.and.resolveTo(false);
    await componente.excluirImagem(imagens[0]);
    expect(produtos.excluirImagem).not.toHaveBeenCalled();
    expect(componente.produto()?.imagens.length).toBe(2);
  });
});