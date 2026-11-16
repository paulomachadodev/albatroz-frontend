import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../http/api.service';
import { EmpresaFlags, EmpresaFlagsService } from './empresa-flags.service';

describe('Flags da empresa da sessão', () => {
  it('descarta cache e resposta anterior ao trocar a empresa autenticada', () => {
    const empresa = signal<number | null>(1);
    const usuario = signal({ id: 8 });
    const primeira = new Subject<{ dados: EmpresaFlags }>();
    const segunda = new Subject<{ dados: EmpresaFlags }>();
    const get = jasmine.createSpy('get').and.returnValues(primeira, segunda);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa() } },
      { provide: ApiService, useValue: { get } }
    ] });
    const service = TestBed.inject(EmpresaFlagsService);
    TestBed.tick();
    primeira.next({ dados: { tinyAtivo: true, tinyPush: true } });
    TestBed.tick();
    expect(service.tinyAtivo()).toBeTrue();
    empresa.set(2);
    usuario.set({ id: 8 });
    TestBed.tick();
    expect(service.flags()).toBeNull();
    primeira.next({ dados: { tinyAtivo: true, tinyPush: true } });
    expect(service.flags()).toBeNull();
    segunda.next({ dados: { tinyAtivo: false, tinyPush: false } });
    TestBed.tick();
    expect(service.tinyAtivo()).toBeFalse();
    expect(get).toHaveBeenCalledTimes(2);
    empresa.set(null);
    usuario.set({ id: 8 });
    TestBed.tick();
    expect(service.flags()).toBeNull();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
