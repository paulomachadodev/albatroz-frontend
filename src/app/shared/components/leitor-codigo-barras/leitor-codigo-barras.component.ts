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
  zoomSuportado = signal(false);
  zoomAtual = signal(1);
  zoomMin = signal(1);
  zoomMax = signal(1);
  zoomPasso = signal(0.5);

  private static readonly JANELA_DEBOUNCE_MS = 2500;
  private static readonly INTERVALO_RETRIGGER_FOCO_MS = 1500;
  private static readonly INTERVALO_SWEEP_FOCO_MS = 800;
  private static readonly ZOOM_INICIAL_IDEAL = 2;
  private static readonly DISTANCIAS_FOCO_SWEEP = [0.02, 0.06, 0.1, 0.18, 0.3];

  private reader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  private ultimoCodigoLido: string | null = null;
  private ultimoLidoEm = 0;
  private track?: MediaStreamTrack;
  private intervalRetriggerFoco?: ReturnType<typeof setInterval>;
  private intervalSweepFoco?: ReturnType<typeof setInterval>;
  private indiceSweepFoco = 0;
  private modosFocoAlternados: ('continuous' | 'single-shot')[] = ['single-shot', 'continuous'];
  private indiceModoFoco = 0;

  async ngAfterViewInit() {
    this.audioContext = new AudioContext();
    this.audioContext.resume();

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
      this.configurarFallbacksDeFoco();
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
    clearInterval(this.intervalRetriggerFoco);
    clearInterval(this.intervalSweepFoco);
    this.controls?.stop();
    this.audioContext?.close();
  }

  private configurarFallbacksDeFoco(): void {
    const stream = this.video().nativeElement.srcObject as MediaStream | null;
    this.track = stream?.getVideoTracks()[0];
    if (!this.track) return;

    let capacidades: MediaTrackCapabilities;
    try {
      capacidades = this.track.getCapabilities();
    } catch {
      return;
    }

    this.configurarZoom(capacidades);

    if ('focusDistance' in capacidades && capacidades.focusDistance) {
      this.iniciarSweepFocoManual();
    } else if ('focusMode' in capacidades && capacidades.focusMode) {
      this.iniciarRetriggerFocoContinuo();
    }
  }

  private configurarZoom(capacidades: MediaTrackCapabilities): void {
    const zoom = (capacidades as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }).zoom;
    if (!zoom) return;

    this.zoomSuportado.set(true);
    this.zoomMin.set(zoom.min);
    this.zoomMax.set(zoom.max);
    this.zoomPasso.set(zoom.step ?? 0.5);

    const valorInicial = Math.min(Math.max(LeitorCodigoBarrasComponent.ZOOM_INICIAL_IDEAL, zoom.min), zoom.max);
    this.aplicarZoom(valorInicial);
  }

  aplicarZoom(valor: number): void {
    if (!this.track) return;
    const valorLimitado = Math.min(Math.max(valor, this.zoomMin()), this.zoomMax());
    this.track
      .applyConstraints({ advanced: [{ zoom: valorLimitado } as MediaTrackConstraintSet] })
      .then(() => this.zoomAtual.set(valorLimitado))
      .catch(() => {});
  }

  private iniciarRetriggerFocoContinuo(): void {
    this.intervalRetriggerFoco = setInterval(() => {
      if (!this.track) return;
      const modo = this.modosFocoAlternados[this.indiceModoFoco % this.modosFocoAlternados.length];
      this.indiceModoFoco++;
      this.track.applyConstraints({ advanced: [{ focusMode: modo } as MediaTrackConstraintSet] }).catch(() => {});
    }, LeitorCodigoBarrasComponent.INTERVALO_RETRIGGER_FOCO_MS);
  }

  private iniciarSweepFocoManual(): void {
    this.intervalSweepFoco = setInterval(() => {
      if (!this.track) return;
      const distancia = LeitorCodigoBarrasComponent.DISTANCIAS_FOCO_SWEEP[this.indiceSweepFoco % LeitorCodigoBarrasComponent.DISTANCIAS_FOCO_SWEEP.length];
      this.indiceSweepFoco++;
      this.track.applyConstraints({ advanced: [{ focusDistance: distancia } as MediaTrackConstraintSet] }).catch(() => {});
    }, LeitorCodigoBarrasComponent.INTERVALO_SWEEP_FOCO_MS);
  }

  focarNoToque(evento: MouseEvent): void {
    if (!this.track) return;
    const alvo = evento.currentTarget as HTMLElement;
    const retangulo = alvo.getBoundingClientRect();
    const x = (evento.clientX - retangulo.left) / retangulo.width;
    const y = (evento.clientY - retangulo.top) / retangulo.height;
    this.track
      .applyConstraints({ advanced: [{ pointsOfInterest: [{ x, y }] } as unknown as MediaTrackConstraintSet] })
      .catch(() => {});
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
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') this.audioContext.resume();

    const oscilador = this.audioContext.createOscillator();
    const ganho = this.audioContext.createGain();
    oscilador.type = 'square';
    oscilador.frequency.value = 1800;
    ganho.gain.value = 0.5;
    oscilador.connect(ganho);
    ganho.connect(this.audioContext.destination);
    oscilador.start();
    oscilador.stop(this.audioContext.currentTime + 0.12);
  }
}
