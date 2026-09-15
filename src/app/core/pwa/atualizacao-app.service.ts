import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AtualizacaoAppService {
  private swUpdate = inject(SwUpdate);

  iniciar(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate();
      }
    });

    this.swUpdate.checkForUpdate();
  }
}
