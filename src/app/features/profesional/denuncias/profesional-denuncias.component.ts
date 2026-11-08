import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Denuncia, EstadoDenuncia, Modalidad } from '../../../core/models/api.models';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EstadoPipe, ModalidadPipe, TipoSituacionPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-profesional-denuncias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    EmptyStateComponent,
    EstadoPipe,
    ModalidadPipe,
    TipoSituacionPipe,
  ],
  templateUrl: './profesional-denuncias.component.html',
  styleUrl: './profesional-denuncias.component.scss',
})
export class ProfesionalDenunciasComponent implements OnInit {
  private readonly denunciaService = inject(DenunciaService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly denuncias = signal<Denuncia[]>([]);

  readonly filtros = this.fb.nonNullable.group({
    estado: ['' as EstadoDenuncia | ''],
    modalidad: ['' as Modalidad | ''],
  });

  ngOnInit(): void {
    this.cargar();
    this.filtros.valueChanges.subscribe(() => this.cargar());
  }

  private cargar(): void {
    this.cargando.set(true);
    const { estado, modalidad } = this.filtros.getRawValue();
    this.denunciaService
      .listarProfesional({
        estado: estado || undefined,
        modalidad: modalidad || undefined,
      })
      .subscribe({
        next: (lista) => {
          this.denuncias.set(lista);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge badge--danger';
      case 'EN_PROCESO':
        return 'badge badge--warn';
      default:
        return 'badge badge--ok';
    }
  }
}
