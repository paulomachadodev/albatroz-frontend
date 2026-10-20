const CHAVE = 'albatroz.ultima_empresa_id';

export function lerEmpresaLembrada(): number | null {
  try {
    const valor = Number(localStorage.getItem(CHAVE));
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

export function guardarEmpresaLembrada(empresaId: number): void {
  try {
    localStorage.setItem(CHAVE, String(empresaId));
  } catch {
    return;
  }
}
