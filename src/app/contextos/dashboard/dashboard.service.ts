import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { Resultado } from '../../core/models';

export type GranularidadeDashboard = 'dia' | 'mes' | 'ano';

export interface SeriePonto {
  chave: string;
  valor: number;
}

export interface VendaRecente {
  numero: string;
  cliente: string;
  valor: number;
  data: string;
  vendedor?: string;
}

export interface MetaMensal {
  valorMeta: number;
  origemMeta: string;
  faturamentoAtual: number;
  percentualAtingido: number;
  faturamentoProjetado: number;
  pedidosAtuais: number;
  pedidosProjetados: number;
  ticketMedioReal: number;
  ticketMedioNecessario: number;
}

export interface MetaVendedor {
  idVendedor: string | null;
  nome: string;
  pedidos: number;
  valor: number;
  ticketMedio: number;
  valorMeta: number | null;
  percentualAtingido: number | null;
  semVendedor: boolean;
}

export interface FormaPagamento {
  forma: string;
  quantidade: number;
  valor: number;
  ticketMedio: number;
}

export interface CurvaAbcResumo {
  skusCurvaAValor: number;
  skusCurvaBValor: number;
  skusCurvaCValor: number;
  skusCurvaAQuantidade: number;
  skusCurvaBQuantidade: number;
  skusCurvaCQuantidade: number;
}

export interface DashboardResumo {
  faturamentoMes: number;
  faturamentoMesAnterior: number;
  pedidosMes: number;
  pedidosMesAnterior: number;
  ticketMedioMes: number;
  produtosEstoqueCritico: number;
  serieAtual: SeriePonto[];
  seriePeriodoAnterior: SeriePonto[];
  ultimasVendas: VendaRecente[];
  meta: MetaMensal;
  metaPorVendedor: MetaVendedor[];
  vendasPorFormaPagamento: FormaPagamento[];
  curvaAbc: CurvaAbcResumo;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private endpoint = '/v1/dashboard';

  constructor(private api: ApiService) {}

  obter(granularidade: GranularidadeDashboard): Observable<Resultado<DashboardResumo>> {
    return this.api.get<DashboardResumo>(this.endpoint, { granularidade });
  }
}
