export interface AssuntoEmAlta { titulo: string; veiculo: string; link: string; publicadoEm: string; repeticoes: number; }
export interface AssuntosEmAlta { habilitado: boolean; itens: AssuntoEmAlta[]; atualizadoEm: string; }

export function horasDesde(dataIso: string, agora: Date = new Date()): string {
  const horas = Math.max(0, Math.round((agora.getTime() - new Date(dataIso).getTime()) / 3600000));
  return horas < 1 ? 'agora há pouco' : horas < 24 ? `há ${horas} h` : `há ${Math.round(horas / 24)} d`;
}
