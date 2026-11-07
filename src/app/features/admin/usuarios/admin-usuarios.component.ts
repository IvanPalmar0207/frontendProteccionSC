import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Rol, Usuario } from '../../../core/models/api.models';
import { AdminUsuarioService } from '../../../core/services/admin-usuario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';
import { RolPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-admin-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PaginadorComponent, RolPipe],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss',
})
export class AdminUsuariosComponent implements OnInit {
  private readonly usuariosService = inject(AdminUsuarioService);
  private readonly notificaciones = inject(NotificationService);
  private readonly busqueda$ = new Subject<string>();

  readonly cargando = signal(true);
  readonly usuarios = signal<Usuario[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly roles: Rol[] = ['USUARIO', 'PROFESIONAL', 'ADMINISTRADOR'];

  busqueda = '';

  ngOnInit(): void {
    this.cargar();
    this.busqueda$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.cargar();
      });
  }

  onBuscar(valor: string): void {
    this.busqueda = valor;
    this.busqueda$.next(valor);
  }

  cambiarPagina(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  cambiarRol(usuario: Usuario, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as Rol;
    this.usuariosService.actualizar(usuario.id, { role }).subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === actualizado.id ? actualizado : u)),
        );
        this.notificaciones.exito(`Rol de ${actualizado.email} actualizado a ${actualizado.role}.`);
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    this.usuariosService.actualizar(usuario.id, { is_active: !usuario.is_active }).subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === actualizado.id ? actualizado : u)),
        );
        this.notificaciones.exito(actualizado.is_active ? 'Cuenta activada.' : 'Cuenta desactivada.');
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listarPagina(this.page(), this.busqueda).subscribe({
      next: (pagina) => {
        this.usuarios.set(pagina.results);
        this.total.set(pagina.count);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
