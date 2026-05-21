import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoginRequisicao {
  email: string;
  senha: string;
}

export interface LoginResposta {
  token: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    role: string;
    empresa_id: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = signal(this.hasToken());
  usuario$ = new BehaviorSubject<LoginResposta['usuario'] | null>(null);

  constructor(private http: HttpClient) {}

  login(credenciais: LoginRequisicao): Observable<LoginResposta> {
    return new Observable(observer => {
      // Placeholder para login real
      observer.error({ mensagem: 'Not implemented' });
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.usuario$.next(null);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
