import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

export const ESPERA_ENCADEADAS_MS = 150;
export const LIMITE_CARREGAMENTO_MS = 20000;

@Injectable({ providedIn: 'root' })
export class CarregamentoPaginaService {
  private router = inject(Router);

  private navegando = signal(false);
  private aguardando = signal(false);
  private pendentes = signal(0);
  private janelaAberta = false;
  private temporizadorEspera: ReturnType<typeof setTimeout> | null = null;
  private temporizadorLimite: ReturnType<typeof setTimeout> | null = null;

  readonly visivel = computed(() => this.navegando() || this.aguardando());

  iniciar(): void {
    this.router.events.subscribe(evento => {
      if (evento instanceof NavigationStart) this.abrirJanela();
      else if (evento instanceof NavigationEnd || evento instanceof NavigationCancel || evento instanceof NavigationError) this.navegacaoTerminou();
    });
  }

  requisicaoIniciada(): boolean {
    if (!this.janelaAberta) return false;
    this.cancelarEspera();
    this.pendentes.update(n => n + 1);
    return true;
  }

  requisicaoTerminada(contada: boolean): void {
    if (!contada) return;
    this.pendentes.update(n => Math.max(0, n - 1));
    if (this.pendentes() === 0 && !this.navegando()) this.agendarFechamento();
  }

  private abrirJanela(): void {
    this.janelaAberta = true;
    this.navegando.set(true);
    this.aguardando.set(true);
    this.cancelarEspera();
    if (this.temporizadorLimite) clearTimeout(this.temporizadorLimite);
    this.temporizadorLimite = setTimeout(() => this.fechar(), LIMITE_CARREGAMENTO_MS);
  }

  private navegacaoTerminou(): void {
    this.navegando.set(false);
    if (this.pendentes() === 0) this.agendarFechamento();
  }

  private agendarFechamento(): void {
    this.cancelarEspera();
    this.temporizadorEspera = setTimeout(() => this.fechar(), ESPERA_ENCADEADAS_MS);
  }

  private cancelarEspera(): void {
    if (this.temporizadorEspera) clearTimeout(this.temporizadorEspera);
    this.temporizadorEspera = null;
  }

  private fechar(): void {
    this.cancelarEspera();
    if (this.temporizadorLimite) clearTimeout(this.temporizadorLimite);
    this.temporizadorLimite = null;
    this.janelaAberta = false;
    this.navegando.set(false);
    this.aguardando.set(false);
    this.pendentes.set(0);
  }
}
