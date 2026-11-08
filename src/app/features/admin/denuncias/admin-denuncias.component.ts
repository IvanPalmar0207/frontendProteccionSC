import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Denuncia, EstadoDenuncia } from '../../../core/models/api.models';
import { DenunciaService, ProfesionalResumen } from '../../../core/services/denuncia.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EstadoPipe, ModalidadPipe } from '../../../shared/pipes/labels.pipe';

/** Administrative supervision: list cases and (re)assign a professional. */
@Component({
  selector: 'app-admin-denuncias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EmptyStateComponent, EstadoPipe, ModalidadPipe],
  templateUrl: './admin-denuncias.component.html',
  styleUrl: './admin-denuncias.component.scss',
})
export class AdminDenunciasComponent implements OnInit {
  private readonly denunciaService = inject(DenunciaService);
  private readonly notificaciones = inject(NotificationService);

  readonly cargando = signal(true);
  readonly denuncias = signal<Denuncia[]>([]);
  readonly profesionales = signal<ProfesionalResumen[]>([]);
  readonly guardandoId = signal<number | null>(null);
  readonly asignacion = signal<'' | 'pendientes' | 'asignadas'>('');
  readonly estado = signal<EstadoDenuncia | ''>('');
  private readonly seleccion = signal<Record<number, number | null>>({});

  ngOnInit(): void {
    this.denunciaService.listarProfesionales().subscribe({
      next: (lista) => this.profesionales.set(lista),
      error: () => this.profesionales.set([]),
    });
    this.cargar();
  }

  cambiarFiltro(): void {
    this.cargar();
  }

  /** Selected professional for a row: the explicit choice or the current one. */
  profesionalSeleccionado(denuncia: Denuncia): number | null {
    const elegido = this.seleccion()[denuncia.id];
    return elegido ?? denuncia.profesional_asignado?.id ?? null;
  }

  seleccionar(denuncia: Denuncia, valor: string): void {
    this.seleccion.update((mapa) => ({
      ...mapa,
      [denuncia.id]: valor ? Number(valor) : null,
    }));
  }

  asignar(denuncia: Denuncia): void {
    const profesionalId = this.profesionalSeleccionado(denuncia);
    if (!profesionalId) {
      return;
    }
    this.guardandoId.set(denuncia.id);
    this.denunciaService.asignar(denuncia.id, profesionalId).subscribe({
      next: (actualizada) => {
        this.guardandoId.set(null);
        this.denuncias.update((lista) =>
          lista.map((d) => (d.id === actualizada.id ? actualizada : d)),
        );
        this.notificaciones.exito(`Caso ${actualizada.identificador} asignado.`);
      },
      error: () => this.guardandoId.set(null),
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.denunciaService
      .listarAdmin({ estado: this.estado(), asignacion: this.asignacion() })
      .subscribe({
        next: (lista) => {
          this.denuncias.set(lista);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
