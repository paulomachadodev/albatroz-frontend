import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Agendamento, STATUS_AGENDAMENTO } from '../models/agendamento.model';
import { AgendamentosService } from '../services/agendamentos.service';

@Component({
  selector: 'app-agendar-publicacao',
  standalone: true,
  imports: [FormsModule, DatePipe, ModalComponent],
  templateUrl: './agendar-publicacao.component.html'
})
export class AgendarPublicacaoComponent {
  private readonly service = inject(AgendamentosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pecaId = input.required<number>();
  readonly destinos = input.required<{ id: number; rotulo: string }[]>();
  readonly escolhidos = input<number[]>([]);
  readonly marcarProdutos = input(false);

  readonly status = STATUS_AGENDAMENTO;
  readonly podeAprovar = computed(() => this.auth.temPermissao('marketing:aprovar'));
  readonly itens = signal<Agendamento[]>([]);
  readonly modal = signal(false);
  readonly processando = signal(false);
  readonly quando = signal('');
  readonly recentes = computed(() => this.itens().filter(a => a.status !== 5).slice(0, 5));
  readonly nomesEscolhidos = computed(() => this.destinos().filter(d => this.escolhidos().includes(d.id)).map(d => d.rotulo).join(' e '));
  readonly minimo = signal('');

  constructor() {
    effect(() => {
      this.pecaId();
      untracked(() => this.carregar());
    });
  }

  rotulo(ativoId: number): string {
    return this.destinos().find(d => d.id === ativoId)?.rotulo ?? 'Destino ' + ativoId;
  }

  abrir(): void {
    if (!this.podeAprovar() || this.escolhidos().length === 0) return;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(9, 0, 0, 0);
    this.quando.set(this.paraCampo(amanha));
    this.minimo.set(this.paraCampo(new Date(Date.now() + 5 * 60000)));
    this.modal.set(true);
  }

  fechar(): void {
    if (!this.processando()) this.modal.set(false);
  }

  agendar(): void {
    if (!this.podeAprovar() || this.processando() || this.escolhidos().length === 0) return;
    const data = new Date(this.quando());
    if (!this.quando() || Number.isNaN(data.getTime())) { this.toast.aviso('Escolha a data e a hora.'); return; }
    this.processando.set(true);
    this.service.agendar(this.pecaId(), { ativoIds: this.escolhidos(), agendadaPara: data.toISOString(), marcarProdutos: this.marcarProdutos() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => {
          this.processando.set(false);
          if (res.sucesso && res.dados) { this.itens.set(res.dados.itens); this.modal.set(false); this.toast.sucesso('Publicação agendada.'); }
          else this.toast.erro('Não foi possível agendar.');
        },
        error: erro => { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível agendar.'); }
      });
  }

  async cancelar(item: Agendamento): Promise<void> {
    if (!this.podeAprovar() || this.processando() || item.status !== 1) return;
    const confirmado = await this.confirm.confirmar('Cancelar o agendamento?', 'A peça não será publicada neste horário.', { textoConfirmar: 'Cancelar agendamento', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.processando.set(true);
    this.service.cancelar(this.pecaId(), item.id, item.versao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.processando.set(false);
        if (res.sucesso && res.dados) { this.itens.set(res.dados.itens); this.toast.sucesso('Agendamento cancelado.'); }
        else this.toast.erro('Não foi possível cancelar.');
      },
      error: erro => { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível cancelar.'); this.carregar(); }
    });
  }

  private carregar(): void {
    if (!this.auth.temPermissao('marketing:ler')) return;
    this.service.listar(this.pecaId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => { if (res.sucesso && res.dados) this.itens.set(res.dados.itens); },
      error: () => this.itens.set([])
    });
  }

  private paraCampo(data: Date): string {
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}`;
  }
}
