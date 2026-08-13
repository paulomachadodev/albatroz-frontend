import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Ordenacao {
  campo: string;
  direcao: 'asc' | 'desc';
}

/**
 * Helper visual pra cabeçalho de coluna ordenável dentro de `#cabecalho` do
 * app-listagem-paginada (ou de qualquer outra tabela). Não sabe nada sobre
 * paginação/listagem — só mostra o label + seta e emite `ordenar` quando
 * clicado. Cada tela decide quais colunas usam isso e escuta o evento pra
 * disparar a busca ordenada.
 *
 * Uso dentro do próprio <th> projetado pela tela:
 * ```html
 * <ng-template #cabecalho>
 *   <tr>
 *     <th>
 *       <app-th-ordenavel campo="protocolo" [ordenacaoAtual]="ordenacaoAtual()" (ordenar)="aoOrdenar($event)">
 *         Protocolo
 *       </app-th-ordenavel>
 *     </th>
 *   </tr>
 * </ng-template>
 * ```
 *
 * Comportamento: clique alterna asc -> desc -> asc (2 estados) enquanto a
 * coluna estiver ativa; ao clicar numa coluna diferente da atual, ela vira a
 * ativa começando em asc. Não existe estado "sem ordenação" depois do
 * primeiro clique — decisão pra manter o toggle simples e previsível.
 */
@Component({
  selector: 'app-th-ordenavel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './th-ordenavel.component.html',
  host: { class: 'inline-block' }
})
export class ThOrdenavelComponent {
  campo = input.required<string>();
  ordenacaoAtual = input<Ordenacao | null>(null);

  ordenar = output<Ordenacao>();

  get ativa(): boolean {
    return this.ordenacaoAtual()?.campo === this.campo();
  }

  get direcaoAtual(): 'asc' | 'desc' | null {
    return this.ativa ? this.ordenacaoAtual()!.direcao : null;
  }

  get icone(): string {
    if (!this.ativa) return 'unfold_more';
    return this.direcaoAtual === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  aoClicar() {
    const novaDirecao: 'asc' | 'desc' = this.ativa && this.direcaoAtual === 'asc' ? 'desc' : 'asc';
    this.ordenar.emit({ campo: this.campo(), direcao: novaDirecao });
  }
}
