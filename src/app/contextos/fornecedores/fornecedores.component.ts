import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface FornecedorItem {
  Id: number;
  Nome: string;
  Cnpj: string;
  Cidade: string;
  LeadTime: number;
  Status: 'Ativo' | 'Inativo' | 'Pendente';
}

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './fornecedores.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class FornecedoresComponent {
  carregando = signal(false);
  filtro = signal('');

  private fornecedores = signal<FornecedorItem[]>([
    { Id: 1, Nome: 'Tilibra Produtos Escolares', Cnpj: '44.990.901/0001-43', Cidade: 'Bauru/SP', LeadTime: 3, Status: 'Ativo' },
    { Id: 2, Nome: 'Faber-Castell', Cnpj: '12.345.678/0001-90', Cidade: 'São Carlos/SP', LeadTime: 5, Status: 'Ativo' },
    { Id: 3, Nome: 'Cis / Sertic', Cnpj: '98.765.432/0001-10', Cidade: 'Curitiba/PR', LeadTime: 12, Status: 'Pendente' },
    { Id: 4, Nome: 'Maped Brasil', Cnpj: '55.444.333/0001-22', Cidade: 'São Paulo/SP', LeadTime: 8, Status: 'Inativo' },
  ]);

  itens = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    if (!f) return this.fornecedores();
    return this.fornecedores().filter(x =>
      x.Nome.toLowerCase().includes(f) || x.Cnpj.includes(f) || x.Cidade.toLowerCase().includes(f)
    );
  });

  total = computed(() => this.fornecedores().length);
  ativos = computed(() => this.fornecedores().filter(x => x.Status === 'Ativo').length);
  leadTimeMedio = computed(() => {
    const lista = this.fornecedores();
    return lista.length ? Math.round(lista.reduce((a, x) => a + x.LeadTime, 0) / lista.length) : 0;
  });

  aoBuscar(valor: string) {
    this.filtro.set(valor);
  }

  classeStatus(status: FornecedorItem['Status']): string {
    switch (status) {
      case 'Ativo':    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'Pendente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 'Inativo':  return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    }
  }
}
