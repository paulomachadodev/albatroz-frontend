import * as XLSX from 'xlsx';

export function exportarPlanilha<T>(linhas: T[], nomeBase: string, nomeAba: string, formato: 'xlsx' | 'csv' = 'xlsx') {
  const planilha = XLSX.utils.json_to_sheet(linhas);
  if (formato === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(planilha);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, nomeAba);
  XLSX.writeFile(livro, `${nomeBase}.xlsx`);
}
