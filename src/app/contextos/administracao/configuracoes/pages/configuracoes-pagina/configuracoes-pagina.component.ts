import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { EmpresaFlagsService } from '../../../../../core/empresa/empresa-flags.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { filtrarConfiguracoes } from '../../configuracoes-catalogo';

@Component({
  selector: 'app-configuracoes-pagina',
  standalone: true,
  imports: [RouterLink, InputTextModule, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './configuracoes-pagina.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ConfiguracoesPaginaComponent {
  private readonly auth = inject(AuthService);
  private readonly flags = inject(EmpresaFlagsService);
  readonly busca = signal('');
  readonly grupoAtivo = signal('');
  readonly categorias = computed(() => filtrarConfiguracoes(chave => this.auth.temPermissao(chave), this.flags.tinyAtivo()));
  readonly grupos = computed(() => filtrarConfiguracoes(chave => this.auth.temPermissao(chave), this.flags.tinyAtivo(), this.busca(), this.grupoAtivo()));

  constructor() {
    this.flags.carregar();
  }

  buscar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }
}
