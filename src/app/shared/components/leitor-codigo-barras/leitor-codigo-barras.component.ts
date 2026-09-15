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
  temMultiplasLentes = signal(false);
  trocandoLente = signal(false);

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
  private lentesTraseiras: MediaDeviceInfo[] = [];
  private indiceLenteAtual = 0;
  private destruido = false;

  async ngAfterViewInit() {
    this.audioContext = new AudioContext();
    this.audioContext.resume();
    await this.abrirCamera({ facingMode: { ideal: 'environment' } });
  }

  private static readonly ESPERA_LIBERACAO_CAMERA_MS = 400;
  private static readonly EH_ANDROID = /Android/i.test(navigator.userAgent);

  private async pararCameraAtual(): Promise<void> {
    this.controls?.stop();
    const stream = this.video().nativeElement.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    this.video().nativeElement.srcObject = null;
    if (stream) {
      await new Promise(resolve => setTimeout(resolve, LeitorCodigoBarrasComponent.ESPERA_LIBERACAO_CAMERA_MS));
    }
  }

  private async abrirCamera(videoConstraints: MediaTrackConstraints, tentativa = 1): Promise<void> {
    await this.pararCameraAtual();
    if (this.destruido) return;
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: LeitorCodigoBarrasComponent.EH_ANDROID ? 640 : 1280 },
          height: { ideal: LeitorCodigoBarrasComponent.EH_ANDROID ? 480 : 720 },
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          ...videoConstraints
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
      this.erro.set(null);
      const stream = this.video().nativeElement.srcObject as MediaStream | null;
      this.track = stream?.getVideoTracks()[0];
      await this.mapearLentesTraseiras();
      this.configurarFallbacksDeFoco();
    } catch (e) {
      const nome = (e as DOMException)?.name;
      if ((nome === 'NotFoundError' || nome === 'NotReadableError') && tentativa < 3) {
        await new Promise(resolve => setTimeout(resolve, LeitorCodigoBarrasComponent.ESPERA_LIBERACAO_CAMERA_MS * (tentativa + 1)));
        if (this.destruido) return;
        return this.abrirCamera(videoConstraints, tentativa + 1);
      }
      this.carregando.set(false);
      if (nome === 'NotAllowedError') {
        this.erro.set('Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador pra usar o leitor.');
      } else if (nome === 'NotFoundError' || nome === 'NotReadableError') {
        this.erro.set('Câmera indisponível ou em uso por outro app.');
      } else {
        this.erro.set('Não foi possível abrir a câmera.');
      }
    }
  }

  private async mapearLentesTraseiras(): Promise<void> {
    if (this.lentesTraseiras.length) return;
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      this.lentesTraseiras = dispositivos.filter(d => {
        if (d.kind !== 'videoinput') return false;
        const rotulo = d.label.toLowerCase();
        return !rotulo.includes('front') && !rotulo.includes('frontal') && !rotulo.includes('user');
      });
      this.temMultiplasLentes.set(this.lentesTraseiras.length > 1);
      const deviceIdAtual = this.track?.getSettings().deviceId;
      if (deviceIdAtual) {
        const indice = this.lentesTraseiras.findIndex(l => l.deviceId === deviceIdAtual);
        if (indice >= 0) this.indiceLenteAtual = indice;
      }
    } catch {
      this.temMultiplasLentes.set(false);
    }
  }

  async trocarLente(): Promise<void> {
    if (!this.lentesTraseiras.length || this.trocandoLente()) return;
    this.trocandoLente.set(true);
    clearInterval(this.intervalRetriggerFoco);
    clearInterval(this.intervalSweepFoco);
    this.indiceLenteAtual = (this.indiceLenteAtual + 1) % this.lentesTraseiras.length;
    const proximaLente = this.lentesTraseiras[this.indiceLenteAtual];
    this.zoomSuportado.set(false);
    this.zoomAtual.set(1);
    await this.abrirCamera({ deviceId: { exact: proximaLente.deviceId } });
    this.trocandoLente.set(false);
  }

  ngOnDestroy() {
    this.destruido = true;
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
