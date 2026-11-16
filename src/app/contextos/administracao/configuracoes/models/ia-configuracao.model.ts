import { Resultado } from '../../../../core/models/resultado.model';

export interface IaConfiguracao {
  habilitado: boolean;
  configurada: boolean;
  modelo: string | null;
  marcador: string | null;
  versao: string | null;
  validadoEm: string | null;
  fluxosAtuaisMigrados: false;
}

export interface IaConfiguracaoResultado extends Resultado<IaConfiguracao> {
  erro?: string;
}
