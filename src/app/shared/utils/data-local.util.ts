export function dataCalendarioLocal(data = new Date()): string {
  return `${String(data.getFullYear()).padStart(4, '0')}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function lerDataLocal(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  return Number.isFinite(data.getTime()) && dataCalendarioLocal(data) === valor ? data : null;
}
