import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
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
  permissoes: string[];
  temaPreferido: 'light' | 'dark';
}

export interface AutenticacaoResposta {
  accessToken: string;
  refreshToken: string;
  expiracaoSegundos: number;
  usuarioId: number;
  nome: string;
  email: string;
  perfis: string[];
  permissoes: string[];
  temaPreferido: 'light' | 'dark';
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
const REFRESH_LOCK_KEY = 'albatroz.refresh.lock';
const REFRESH_LOCK_TTL_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/autenticacao`;

  private _usuario = signal<UsuarioAutenticado | null>(this.lerUsuarioPersistido());
  usuario = this._usuario.asReadonly();
  isAuthenticated = computed(() => this._usuario() !== null && this.tokenValido());

  private _renovandoToken$: Observable<AutenticacaoResposta> | null = null;
  private readonly canal = new BroadcastChannel('albatroz-auth');

  constructor() {
    this.canal.onmessage = (ev: MessageEvent) => {
      if (ev.data?.tipo === 'logout') {
        this._usuario.set(null);
      }
    };
  }

  login(req: LoginRequisicao): Observable<AutenticacaoResposta> {
    const body = { email: req.email, senha: req.senha, empresaId: req.empresaId };
    return this.http.post<AutenticacaoResposta>(`${this.endpoint}/login`, body).pipe(
      tap(resp => this.persistirSessao(resp))
    );
  }

  esqueciSenha(email: string, empresaId: number): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/esqueci-senha`, { email, empresaId });
  }

  redefinirSenha(token: string, novaSenha: string): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/redefinir-senha`, { token, novaSenha });
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
    this.canal.postMessage({ tipo: 'logout' });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  renovar(): Observable<AutenticacaoResposta> {
    if (this._renovandoToken$) return this._renovandoToken$;

    const lock = this.lerLockRenovacao();
    if (lock && Date.now() - lock.ts < REFRESH_LOCK_TTL_MS) {
      const refreshAntesDeEsperar = this.getRefreshToken();
      this._renovandoToken$ = this.aguardarRenovacaoExterna().pipe(
        catchError(() => {
          localStorage.removeItem(REFRESH_LOCK_KEY);
          if (this.getRefreshToken() !== refreshAntesDeEsperar) {
            return this.aguardarTokenPersistido();
          }
          return this.renovarDireto();
        }),
        finalize(() => (this._renovandoToken$ = null)),
        shareReplay(1)
      );
      return this._renovandoToken$;
    }

    return this.renovarDireto();
  }

  private aguardarTokenPersistido(): Observable<AutenticacaoResposta> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const usuario = this._usuario();
    if (!token || !refreshToken || !usuario) return this.renovarDireto();

    return new Observable<AutenticacaoResposta>(subscriber => {
      subscriber.next({
        accessToken: token,
        refreshToken,
        expiracaoSegundos: 0,
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfis: usuario.perfis,
        permissoes: usuario.permissoes,
        temaPreferido: usuario.temaPreferido
      });
      subscriber.complete();
    });
  }

  private renovarDireto(): Observable<AutenticacaoResposta> {
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ ts: Date.now() }));

    const refreshToken = this.getRefreshToken();
    this._renovandoToken$ = this.http
      .post<AutenticacaoResposta>(`${this.endpoint}/renovar`, { refreshToken })
      .pipe(
        tap(resp => {
          this.persistirSessao(resp);
          this.canal.postMessage({ tipo: 'token-renovado', resposta: resp });
        }),
        catchError(err => {
          this.canal.postMessage({ tipo: 'token-renovacao-falhou' });
          return throwError(() => err);
        }),
        finalize(() => {
          localStorage.removeItem(REFRESH_LOCK_KEY);
          this._renovandoToken$ = null;
        }),
        shareReplay(1)
      );
    return this._renovandoToken$;
  }

  private aguardarRenovacaoExterna(): Observable<AutenticacaoResposta> {
    return new Observable<AutenticacaoResposta>(subscriber => {
      const handler = (ev: MessageEvent) => {
        if (ev.data?.tipo === 'token-renovado') {
          subscriber.next(ev.data.resposta as AutenticacaoResposta);
          subscriber.complete();
        } else if (ev.data?.tipo === 'token-renovacao-falhou') {
          subscriber.error(new Error('Renovação de token falhou em outra aba.'));
        }
      };
      this.canal.addEventListener('message', handler);

      const timeoutId = setTimeout(() => {
        subscriber.error(new Error('Timeout esperando renovação de token de outra aba.'));
      }, REFRESH_LOCK_TTL_MS);

      return () => {
        clearTimeout(timeoutId);
        this.canal.removeEventListener('message', handler);
      };
    });
  }

  private lerLockRenovacao(): { ts: number } | null {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as { ts: number }; } catch { return null; }
  }

  definirTemaLocal(tema: 'light' | 'dark'): void {
    const atual = this._usuario();
    if (!atual) return;
    const atualizado: UsuarioAutenticado = { ...atual, temaPreferido: tema };
    localStorage.setItem(USER_KEY, JSON.stringify(atualizado));
    this._usuario.set(atualizado);
  }

  temPermissao(chave: string): boolean {
    return this._usuario()?.permissoes.includes(chave) ?? false;
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
      perfis: resp.perfis ?? [],
      permissoes: resp.permissoes ?? [],
      temaPreferido: resp.temaPreferido ?? 'light'
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

  expiraEmBreve(segundos: number): boolean {
    const payload = this.decodeToken();
    if (!payload) return true;
    return payload.exp * 1000 - Date.now() < segundos * 1000;
  }
}
