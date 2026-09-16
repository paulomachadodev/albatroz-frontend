import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { ScrollLockService } from '../../services/scroll-lock.service';

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
  controlesVisiveis = signal(false);
  laserTopPercent = signal(8);

  private static readonly JANELA_DEBOUNCE_MS = 2500;
  private static readonly INTERVALO_RETRIGGER_FOCO_MS = 1500;
  private static readonly INTERVALO_SWEEP_FOCO_MS = 800;
  private static readonly ZOOM_INICIAL_IDEAL = 2;
  private static readonly DISTANCIAS_FOCO_SWEEP = [0.02, 0.06, 0.1, 0.18, 0.3];

  private reader = new BrowserMultiFormatReader(LeitorCodigoBarrasComponent.criarHintsDecodificacao());
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
  private ultimoErroNome?: string;
  private scrollLock = inject(ScrollLockService);
  private laserAnimId?: number;
  private timeoutOcultarControles?: ReturnType<typeof setTimeout>;

  private static readonly PERIODO_LASER_MS = 1800;
  private static readonly LASER_TOPO_MIN = 8;
  private static readonly LASER_TOPO_MAX = 88;
  private static readonly OCULTAR_CONTROLES_APOS_MS = 3000;

  constructor() {
    this.scrollLock.travar();
  }

  async ngAfterViewInit() {
    this.animarLaser(performance.now());
    this.audioContext = new AudioContext();
    this.audioContext.resume();
    const lentePreferida = this.lerLentePreferida();
    if (lentePreferida) {
      await this.abrirCamera({ deviceId: { exact: lentePreferida } });
      if (this.erro() && this.ultimoErroNome !== 'NotReadableError') {
        this.limparLentePreferida();
        await this.abrirCamera({ facingMode: { ideal: 'environment' } });
      }
    } else {
      await this.abrirCamera({ facingMode: { ideal: 'environment' } });
    }
  }

  private static criarHintsDecodificacao(): Map<DecodeHintType, unknown> {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39
    ]);
    return hints;
  }

  private static readonly ESPERA_LIBERACAO_CAMERA_MS = 400;
  private static readonly CHAVE_LENTE_PREFERIDA = 'albatroz-leitor-lente-preferida';

  private lerLentePreferida(): string | null {
    try {
      return localStorage.getItem(LeitorCodigoBarrasComponent.CHAVE_LENTE_PREFERIDA);
    } catch {
      return null;
    }
  }

  private salvarLentePreferida(deviceId: string): void {
    try {
      localStorage.setItem(LeitorCodigoBarrasComponent.CHAVE_LENTE_PREFERIDA, deviceId);
    } catch {}
  }

  private limparLentePreferida(): void {
    try {
      localStorage.removeItem(LeitorCodigoBarrasComponent.CHAVE_LENTE_PREFERIDA);
    } catch {}
  }

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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
      this.ultimoErroNome = undefined;
      const stream = this.video().nativeElement.srcObject as MediaStream | null;
      this.track = stream?.getVideoTracks()[0];
      await this.mapearLentesTraseiras();
      this.configurarFallbacksDeFoco();
    } catch (e) {
      const nome = (e as DOMException)?.name;
      this.ultimoErroNome = nome;
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
    if (!this.erro()) {
      this.salvarLentePreferida(proximaLente.deviceId);
    }
    this.trocandoLente.set(false);
  }

  ngOnDestroy() {
    this.destruido = true;
    clearInterval(this.intervalRetriggerFoco);
    clearInterval(this.intervalSweepFoco);
    clearTimeout(this.timeoutOcultarControles);
    if (this.laserAnimId) cancelAnimationFrame(this.laserAnimId);
    this.controls?.stop();
    this.audioContext?.close();
    this.scrollLock.destravar();
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

  private animarLaser = (agora: number): void => {
    const inicio = agora;
    const passo = (tempoAtual: number) => {
      if (this.destruido) return;
      const t = ((tempoAtual - inicio) % LeitorCodigoBarrasComponent.PERIODO_LASER_MS) / LeitorCodigoBarrasComponent.PERIODO_LASER_MS;
      const onda = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      this.laserTopPercent.set(LeitorCodigoBarrasComponent.LASER_TOPO_MIN + onda * (LeitorCodigoBarrasComponent.LASER_TOPO_MAX - LeitorCodigoBarrasComponent.LASER_TOPO_MIN));
      this.laserAnimId = requestAnimationFrame(passo);
    };
    this.laserAnimId = requestAnimationFrame(passo);
  };

  aoTocarNaTela(): void {
    this.controlesVisiveis.set(true);
    clearTimeout(this.timeoutOcultarControles);
    this.timeoutOcultarControles = setTimeout(() => this.controlesVisiveis.set(false), LeitorCodigoBarrasComponent.OCULTAR_CONTROLES_APOS_MS);
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
