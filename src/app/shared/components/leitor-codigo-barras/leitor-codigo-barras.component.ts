import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

@Component({
  selector: 'app-leitor-codigo-barras',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './leitor-codigo-barras.component.html',
  host: { class: 'block' }
})
export class LeitorCodigoBarrasComponent implements AfterViewInit, OnDestroy {
  video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  codigoLido = output<string>();
  fechar = output<void>();

  buscandoProduto = input<boolean>(false);
  mensagemErroBusca = input<string | null>(null);

  carregando = signal(true);
  erro = signal<string | null>(null);
  modoManual = signal(false);
  codigoManual = '';

  private static readonly JANELA_DEBOUNCE_MS = 2500;

  private reader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  private ultimoCodigoLido: string | null = null;
  private ultimoLidoEm = 0;

  async ngAfterViewInit() {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet]
        }
      };
      this.controls = await this.reader.decodeFromConstraints(constraints, this.video().nativeElement, (resultado) => {
        if (!resultado) return;
        const codigo = resultado.getText();
        const agora = Date.now();
        if (codigo === this.ultimoCodigoLido && agora - this.ultimoLidoEm < LeitorCodigoBarrasComponent.JANELA_DEBOUNCE_MS) {
          return;
        }
        this.ultimoCodigoLido = codigo;
        this.ultimoLidoEm = agora;
        this.tocarBipe();
        this.codigoLido.emit(codigo);
      });
      this.carregando.set(false);
    } catch (e) {
      this.carregando.set(false);
      const nome = (e as DOMException)?.name;
      if (nome === 'NotAllowedError') {
        this.erro.set('Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador pra usar o leitor.');
      } else if (nome === 'NotFoundError' || nome === 'NotReadableError') {
        this.erro.set('Câmera indisponível ou em uso por outro app.');
      } else {
        this.erro.set('Não foi possível abrir a câmera.');
      }
    }
  }

  ngOnDestroy() {
    this.controls?.stop();
    this.audioContext?.close();
  }

  usarModoManual() {
    this.controls?.stop();
    this.modoManual.set(true);
  }

  confirmarCodigoManual() {
    const codigo = this.codigoManual.trim();
    if (!codigo) return;
    this.codigoLido.emit(codigo);
    this.codigoManual = '';
  }

  fecharLeitor() {
    this.fechar.emit();
  }

  private audioContext?: AudioContext;

  private tocarBipe(): void {
    this.audioContext ??= new AudioContext();
    const oscilador = this.audioContext.createOscillator();
    const ganho = this.audioContext.createGain();
    oscilador.type = 'square';
    oscilador.frequency.value = 1800;
    ganho.gain.value = 0.15;
    oscilador.connect(ganho);
    ganho.connect(this.audioContext.destination);
    oscilador.start();
    oscilador.stop(this.audioContext.currentTime + 0.08);
  }
}
