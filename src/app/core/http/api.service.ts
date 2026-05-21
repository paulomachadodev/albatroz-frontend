import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resultado } from '../models/resultado.model';
import { ParametrosPaginacao, Paginacao } from '../models/paginacao.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: any): Observable<Resultado<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] != null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Resultado<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any): Observable<Resultado<T>> {
    return this.http.post<Resultado<T>>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: any): Observable<Resultado<T>> {
    return this.http.put<Resultado<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<Resultado<T>> {
    return this.http.delete<Resultado<T>>(`${this.baseUrl}${path}`);
  }

  getPaginado<T>(
    path: string,
    paginacao: ParametrosPaginacao,
    filtros?: any
  ): Observable<Resultado<Paginacao<T>>> {
    let params = {
      pagina: paginacao.pagina,
      tamanho: paginacao.tamanho,
      ...(paginacao.ordenacao && { ordenacao: paginacao.ordenacao }),
      ...(paginacao.direcao && { direcao: paginacao.direcao }),
      ...filtros
    };
    return this.get<Paginacao<T>>(path, params);
  }
}
