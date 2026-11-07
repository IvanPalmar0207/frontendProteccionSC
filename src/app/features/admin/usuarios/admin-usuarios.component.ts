import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Rol, Usuario } from '../../../core/models/api.models';
import { AdminUsuarioService } from '../../../core/services/admin-usuario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RolPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-admin-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RolPipe],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss',
})
export class AdminUsuariosComponent implements OnInit {
  private readonly usuariosService = inject(AdminUsuarioService);
  private readonly notificaciones = inject(NotificationService);

  readonly cargando = signal(true);
  readonly usuarios = signal<Usuario[]>([]);
  readonly roles: Rol[] = ['USUARIO', 'PROFESIONAL', 'ADMINISTRADOR'];

  ngOnInit(): void {
    this.cargar();
  }

  cambiarRol(usuario: Usuario, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as Rol;
    this.usuariosService.actualizar(usuario.id, { role }).subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
        this.notificaciones.exito(`Rol de ${actualizado.email} actualizado a ${actualizado.role}.`);
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    this.usuariosService.actualizar(usuario.id, { is_active: !usuario.is_active }).subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
        this.notificaciones.exito(
          actualizado.is_active ? 'Cuenta activada.' : 'Cuenta desactivada.',
        );
      },
    });
  }

  private cargar(): void {
    this.usuariosService.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
