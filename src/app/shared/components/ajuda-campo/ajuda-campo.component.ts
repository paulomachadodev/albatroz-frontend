import { Component, computed, input, signal } from '@angular/core';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-ajuda-campo', standalone: true, imports: [PopoverModule],
  template: `<button type="button" (click)="painel.toggle($event)" [attr.aria-label]="'Ajuda: ' + titulo()" aria-haspopup="dialog" [attr.aria-expanded]="aberto()" class="ml-1 inline-flex size-6 items-center justify-center rounded-full text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span class="material-symbols-outlined text-base" aria-hidden="true">help</span></button><p-popover #painel [ariaLabel]="'Ajuda: ' + titulo()" appendTo="body" [baseZIndex]="120" (onShow)="aberto.set(true)" (onHide)="aberto.set(false)"><div class="max-w-[min(20rem,calc(100vw-3rem))] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm"><p class="font-bold">{{ titulo() }}</p><p class="text-slate-600 dark:text-slate-300">{{ descricao() }}</p><p class="text-xs text-slate-500">Exemplo: {{ exemplo() }}</p><button type="button" (click)="painel.hide()" class="text-xs font-semibold text-primary">Fechar ajuda</button></div></p-popover>`
})
export class AjudaCampoComponent {
  titulo = input.required<string>();
  descricao = input('Descreva somente informações reais e autorizadas da empresa. Este campo orienta o conteúdo e não altera o cadastro de outras empresas.');
  exemplo = input('Use uma descrição curta, clara e fiel à sua empresa.');
  readonly aberto = signal(false);
}
