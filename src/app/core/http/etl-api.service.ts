import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resultado } from '../models/resultado.model';

@Injectable({
  providedIn: 'root'
})
export class EtlApiService {
  private baseUrl = environment.etlApiUrl;

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

  post<T>(path: string, body?: any): Observable<Resultado<T>> {
    return this.http.post<Resultado<T>>(`${this.baseUrl}${path}`, body ?? {});
  }
}
