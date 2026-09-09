import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { Resultado } from '../../core/models';

export interface FaturamentoMesItem {
  ano: number;
  mes: number;
  faturamento: number;
}

export interface VendaRecente {
  numero: string;
  cliente: string;
  valor: number;
  data: string;
  vendedor?: string;
}

export interface DashboardResumo {
  faturamentoMes: number;
  faturamentoMesAnterior: number;
  pedidosMes: number;
  pedidosMesAnterior: number;
  ticketMedioMes: number;
  produtosEstoqueCritico: number;
  faturamentoPorMes: FaturamentoMesItem[];
  ultimasVendas: VendaRecente[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private endpoint = '/v1/dashboard';

  constructor(private api: ApiService) {}

  obter(): Observable<Resultado<DashboardResumo>> {
    return this.api.get<DashboardResumo>(this.endpoint);
  }
}
