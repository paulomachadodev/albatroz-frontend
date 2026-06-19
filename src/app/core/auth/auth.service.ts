import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequisicao {
  email: string;
  senha: string;
  empresaId: number;
}

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfis: string[];
}

export interface AutenticacaoResposta {
  accessToken: string;
  refreshToken: string;
  expiracaoSegundos: number;
  usuarioId: number;
  nome: string;
  email: string;
  perfis: string[];
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  empresa_id?: string;
  exp: number;
  [k: string]: unknown;
}

const TOKEN_KEY = 'albatroz.access';
const REFRESH_KEY = 'albatroz.refresh';
const USER_KEY = 'albatroz.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/autenticacao`;

  private _usuario = signal<UsuarioAutenticado | null>(this.lerUsuarioPersistido());
  usuario = this._usuario.asReadonly();
  isAuthenticated = computed(() => this._usuario() !== null && this.tokenValido());

  login(req: LoginRequisicao): Observable<AutenticacaoResposta> {
    const body = { email: req.email, senha: req.senha, empresaId: req.empresaId };
    return this.http.post<AutenticacaoResposta>(`${this.endpoint}/login`, body).pipe(
      tap(resp => this.persistirSessao(resp))
    );
  }

  esqueciSenha(email: string, empresaId: number): Observable<void> {
    // Endpoint backend ainda não implementado — placeholder
    return this.http.post<void>(`${this.endpoint}/esqueci-senha`, { email, empresaId });
  }

  logout(): void {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      this.http.post(`${this.endpoint}/logout`, { refreshToken: refresh }).subscribe({
        error: () => void 0
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._usuario.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  renovar(): Observable<AutenticacaoResposta> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AutenticacaoResposta>(`${this.endpoint}/renovar`, { refreshToken }).pipe(
      tap(resp => this.persistirSessao(resp))
    );
  }

  empresaIdAtual(): number | null {
    const payload = this.decodeToken();
    if (!payload?.empresa_id) return null;
    const n = parseInt(payload.empresa_id, 10);
    return isNaN(n) ? null : n;
  }

  private persistirSessao(resp: AutenticacaoResposta): void {
    localStorage.setItem(TOKEN_KEY, resp.accessToken);
    localStorage.setItem(REFRESH_KEY, resp.refreshToken);
    const u: UsuarioAutenticado = {
      id: resp.usuarioId,
      nome: resp.nome,
      email: resp.email,
      perfis: resp.perfis ?? []
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    this._usuario.set(u);
  }

  private lerUsuarioPersistido(): UsuarioAutenticado | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UsuarioAutenticado; } catch { return null; }
  }

  private decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64)) as JwtPayload;
    } catch { return null; }
  }

  private tokenValido(): boolean {
    const payload = this.decodeToken();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }
}
