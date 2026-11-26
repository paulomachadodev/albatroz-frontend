import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { CampoMascaraComponent } from '../../../../../shared/components/campo-mascara/campo-mascara.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { ListaEscolarResumo } from '../../models/lista-escolar.model';
import { ListasEscolaresService } from '../../services/listas-escolares.service';

@Component({
  selector: 'app-enviar-lista-whatsapp',
  standalone: true,
  imports: [FormsModule, DrawerComponent, CampoMascaraComponent],
  templateUrl: './enviar-lista-whatsapp.component.html'
})
export class EnviarListaWhatsappComponent {
  private readonly service = inject(ListasEscolaresService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lista = input<ListaEscolarResumo | null>(null);
  readonly fechar = output<void>();

  readonly carregando = signal(false);
  readonly enviando = signal(false);
  readonly motivo = signal<string | null>(null);
  readonly falhou = signal(false);
  telefone = '';
  mensagem = '';
  mensagemPadrao = '';
  private carga?: Subscription;

  constructor() {
    effect(() => {
      const lista = this.lista();
      untracked(() => this.abrir(lista));
    });
  }

  private abrir(lista: ListaEscolarResumo | null): void {
    this.carga?.unsubscribe();
    this.telefone = '';
    this.mensagem = '';
    this.mensagemPadrao = '';
    this.motivo.set(null);
    this.falhou.set(false);
    if (!lista) return;
    this.carregando.set(true);
    this.carga = this.service.obterModeloWhatsapp(lista.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso || !resposta.dados) { this.falhou.set(true); return; }
          this.mensagem = this.mensagemPadrao = resposta.dados.mensagem;
          this.motivo.set(resposta.dados.podeEnviar ? null : resposta.dados.motivo);
        },
        error: erro => { this.falhou.set(true); this.toast.erroServidor(erro, 'Não foi possível preparar o envio.'); }
      });
  }

  podeEnviar(): boolean {
    return this.telefone.length >= 10 && this.mensagem.trim().length > 0 && !this.motivo() && !this.falhou() && !this.carregando() && !this.enviando();
  }

  restaurar(): void {
    this.mensagem = this.mensagemPadrao;
  }

  enviar(): void {
    const lista = this.lista();
    if (!lista || !this.podeEnviar()) return;
    this.enviando.set(true);
    this.service.enviarPorWhatsapp(lista.id, { telefone: this.telefone, mensagem: this.mensagem.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false))).subscribe({
        next: () => { this.toast.sucesso('Lista enviada pelo WhatsApp.'); this.fechar.emit(); },
        error: erro => this.toast.erroServidor(erro, 'Não foi possível enviar a lista.')
      });
  }
}
