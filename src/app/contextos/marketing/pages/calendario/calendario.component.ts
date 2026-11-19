import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { dataCalendarioLocal, lerDataLocal } from '../../../../shared/utils/data-local.util';
import { CATEGORIAS_DATA, CLASSE_CATEGORIA_DATA, Calendario, DataMarketing } from '../../models/calendario.model';
import { PecaResumo, STATUS_PECA } from '../../models/peca.model';
import { CalendarioService } from '../../services/calendario.service';
import { PecasService } from '../../services/pecas.service';

interface DiaGrade {
  chave: string;
  numero: number;
  foraDoMes: boolean;
  hoje: boolean;
  datas: DataMarketing[];
  pecas: PecaResumo[];
}

function inicioDaSemana(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() - data.getDay());
}

function paraCampoLocal(iso: string | null): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dataCalendarioLocal(data)}T${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

@Component({
  selector: 'app-calendario-marketing',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, BreadcrumbComponent, PageHeaderComponent, ModalComponent],
  templateUrl: './calendario.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CalendarioMarketingComponent {
  private readonly calendarios = inject(CalendarioService);
  private readonly pecasService = inject(PecasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;
  private gravacao?: Subscription;

  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('marketing:ler'));
  readonly podeEditar = computed(() => this.contextoValido() && this.auth.temPermissao('marketing:editar'));
  readonly nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly categorias = CATEGORIAS_DATA;
  readonly classeCategoria = CLASSE_CATEGORIA_DATA;
  readonly statusPeca = STATUS_PECA;
  readonly legenda = [1, 2, 3, 4];

  readonly modo = signal<'mes' | 'semana'>('mes');
  readonly semanaInicio = signal(inicioDaSemana(new Date()));
  readonly arrastando = signal<PecaResumo | null>(null);
  readonly mes = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly carregando = signal(true);
  readonly habilitado = signal(false);
  readonly calendario = signal<Calendario | null>(null);
  readonly todasPecas = signal<PecaResumo[]>([]);
  readonly selecionada = signal<PecaResumo | null>(null);
  readonly salvando = signal(false);
  readonly novaData = new FormControl('', { nonNullable: true });

  readonly titulo = computed(() => {
    if (this.modo() === 'semana') {
      const inicio = this.semanaInicio();
      const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
      const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
      return formato.format(inicio) + ' a ' + formato.format(fim) + '/' + fim.getFullYear();
    }
    const texto = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.mes());
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  readonly dias = computed<DiaGrade[]>(() => {
    const semana = this.modo() === 'semana';
    const mes = this.mes();
    const primeiro = semana ? this.semanaInicio() : new Date(mes.getFullYear(), mes.getMonth(), 1);
    const hoje = dataCalendarioLocal();
    const cal = this.calendario();
    const datasUnicas = (cal?.datas ?? []).filter(d => !d.fim);
    const pecasPorDia = new Map<string, PecaResumo[]>();
    for (const peca of cal?.pecas ?? []) {
      if (!peca.planejadaPara) continue;
      const chave = dataCalendarioLocal(new Date(peca.planejadaPara));
      pecasPorDia.set(chave, [...(pecasPorDia.get(chave) ?? []), peca]);
    }
    return Array.from({ length: semana ? 7 : 42 }, (_, i) => {
      const data = semana
        ? new Date(primeiro.getFullYear(), primeiro.getMonth(), primeiro.getDate() + i)
        : new Date(primeiro.getFullYear(), primeiro.getMonth(), 1 - primeiro.getDay() + i);
      const chave = dataCalendarioLocal(data);
      return {
        chave, numero: data.getDate(), foraDoMes: !semana && data.getMonth() !== mes.getMonth(), hoje: chave === hoje,
        datas: datasUnicas.filter(d => d.inicio === chave).sort((a, b) => b.relevancia - a.relevancia),
        pecas: (pecasPorDia.get(chave) ?? []).sort((a, b) => (a.planejadaPara ?? '').localeCompare(b.planejadaPara ?? ''))
      };
    });
  });

  readonly periodos = computed(() => (this.calendario()?.datas ?? []).filter(d => !!d.fim));
  readonly agenda = computed(() => this.dias().filter(d => !d.foraDoMes && (d.datas.length > 0 || d.pecas.length > 0)));
  readonly semData = computed(() => this.todasPecas().filter(p => !p.planejadaPara && p.status !== 3));

  constructor() {
    this.destroyRef.onDestroy(() => { this.consulta?.unsubscribe(); this.gravacao?.unsubscribe(); });
    effect(() => {
      if (this.contextoValido()) return;
      this.consulta?.unsubscribe();
      this.gravacao?.unsubscribe();
      this.calendario.set(null);
      this.selecionada.set(null);
      this.carregando.set(false);
      queueMicrotask(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/marketing'], { replaceUrl: true }); });
    });
    this.carregar();
  }

  mudarModo(modo: 'mes' | 'semana'): void {
    if (this.modo() === modo) return;
    if (modo === 'semana') {
      const hoje = new Date();
      const base = this.mes().getMonth() === hoje.getMonth() && this.mes().getFullYear() === hoje.getFullYear() ? hoje : this.mes();
      this.semanaInicio.set(inicioDaSemana(base));
    } else {
      const inicio = this.semanaInicio();
      this.mes.set(new Date(inicio.getFullYear(), inicio.getMonth(), 1));
    }
    this.modo.set(modo);
    this.carregar();
  }

  mudarMes(deslocamento: number): void {
    if (this.modo() === 'semana') {
      const inicio = this.semanaInicio();
      this.semanaInicio.set(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7 * deslocamento));
      this.carregar();
      return;
    }
    const atual = this.mes();
    this.mes.set(new Date(atual.getFullYear(), atual.getMonth() + deslocamento, 1));
    this.carregar();
  }

  irParaHoje(): void {
    const hoje = new Date();
    this.mes.set(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    this.semanaInicio.set(inicioDaSemana(hoje));
    this.carregar();
  }

  carregar(): void {
    if (!this.contextoValido()) return;
    const grade = this.dias();
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = forkJoin({
      calendario: this.calendarios.obter(grade[0].chave, grade[grade.length - 1].chave),
      pecas: this.pecasService.listar()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ calendario, pecas }) => {
        if (!this.contextoValido()) return;
        this.carregando.set(false);
        if (calendario.sucesso && calendario.dados) { this.habilitado.set(calendario.dados.habilitado); this.calendario.set(calendario.dados); }
        else this.toast.erro('Não foi possível carregar o calendário.');
        if (pecas.sucesso && pecas.dados) this.todasPecas.set(pecas.dados.itens);
      },
      error: erro => { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível carregar o calendário.'); }
    });
  }

  abrir(peca: PecaResumo): void {
    this.selecionada.set(peca);
    this.novaData.setValue(paraCampoLocal(peca.planejadaPara));
  }

  fechar(): void {
    if (!this.salvando()) this.selecionada.set(null);
  }

  salvarData(remover = false): void {
    const peca = this.selecionada();
    if (!peca || !this.podeEditar() || this.salvando()) return;
    const valor = remover ? '' : this.novaData.value;
    if (!remover && !valor) { this.toast.aviso('Escolha a data e a hora.'); return; }
    const data = valor ? new Date(valor) : null;
    if (data && Number.isNaN(data.getTime())) { this.toast.aviso('Data inválida.'); return; }
    this.salvando.set(true);
    this.gravacao?.unsubscribe();
    this.gravacao = this.pecasService.planejar(peca.id, data ? data.toISOString() : null, peca.versao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.salvando.set(false);
        if (res.sucesso) { this.selecionada.set(null); this.toast.sucesso(remover ? 'Data prevista removida.' : 'Data prevista alterada.'); this.carregar(); }
        else this.toast.erro('Não foi possível alterar a data.');
      },
      error: erro => { this.salvando.set(false); this.toast.erroServidor(erro, 'Não foi possível alterar a data. Atualize o calendário e tente de novo.'); }
    });
  }

  iniciarArraste(evento: DragEvent, peca: PecaResumo): void {
    if (!this.podeEditar() || this.salvando() || peca.publicada) { evento.preventDefault(); return; }
    this.arrastando.set(peca);
    evento.dataTransfer?.setData('text/plain', String(peca.id));
    if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'move';
  }

  permitirSoltar(evento: DragEvent): void {
    if (this.arrastando()) evento.preventDefault();
  }

  soltar(evento: DragEvent, dia: DiaGrade): void {
    evento.preventDefault();
    const peca = this.arrastando();
    this.arrastando.set(null);
    if (!peca || !peca.planejadaPara || !this.podeEditar() || this.salvando()) return;
    const atual = new Date(peca.planejadaPara);
    const destino = lerDataLocal(dia.chave);
    if (!destino || Number.isNaN(atual.getTime())) return;
    if (dataCalendarioLocal(atual) === dia.chave) return;
    destino.setHours(atual.getHours(), atual.getMinutes(), 0, 0);
    this.salvando.set(true);
    this.gravacao?.unsubscribe();
    this.gravacao = this.pecasService.planejar(peca.id, destino.toISOString(), peca.versao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.salvando.set(false);
        if (res.sucesso) { this.toast.sucesso('Data prevista alterada.'); this.carregar(); }
        else this.toast.erro('Não foi possível mover a peça.');
      },
      error: erro => { this.salvando.set(false); this.toast.erroServidor(erro, 'Não foi possível mover a peça. Atualize o calendário e tente de novo.'); this.carregar(); }
    });
  }

  intervaloDoPeriodo(periodo: DataMarketing): { inicio: Date | null; fim: Date | null } {
    return { inicio: lerDataLocal(periodo.inicio), fim: periodo.fim ? lerDataLocal(periodo.fim) : null };
  }

  dataDoDia(dia: DiaGrade): Date | null {
    return lerDataLocal(dia.chave);
  }
}
