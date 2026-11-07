import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Denuncia } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { DenunciaService } from '../../../core/services/denuncia.service';

@Component({
  selector: 'app-profesional-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './profesional-dashboard.component.html',
  styleUrl: './profesional-dashboard.component.scss',
})
export class ProfesionalDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly denunciaService = inject(DenunciaService);

  readonly usuario = this.auth.usuarioActual;
  readonly cargando = signal(true);
  readonly casos = signal<Denuncia[]>([]);

  readonly resumen = computed(() => {
    const lista = this.casos();
    return {
      total: lista.length,
      pendientes: lista.filter((c) => c.estado === 'PENDIENTE').length,
      enProceso: lista.filter((c) => c.estado === 'EN_PROCESO').length,
      finalizadas: lista.filter((c) => c.estado === 'FINALIZADA').length,
      anonimas: lista.filter((c) => c.es_anonima).length,
    };
  });

  ngOnInit(): void {
    this.denunciaService.listarProfesional().subscribe({
      next: (lista) => {
        this.casos.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
