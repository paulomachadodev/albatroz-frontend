import { formatDate } from '@angular/common';

export function formatarDataHora(valor: string | null, formato = 'dd/MM/yyyy HH:mm'): string {
  if (!valor) return '-';
  try {
    return formatDate(valor, formato, 'pt-BR', 'America/Sao_Paulo');
  } catch {
    return '-';
  }
}
