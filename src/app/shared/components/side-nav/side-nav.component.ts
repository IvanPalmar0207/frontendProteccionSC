import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NAVEGACION, NavItem } from '../../../core/nav/navegacion';

@Component({
  selector: 'app-side-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  private readonly auth = inject(AuthService);

  readonly items = computed<NavItem[]>(() => {
    const role = this.auth.role();
    return role ? (NAVEGACION[role] ?? []) : [];
  });
}
