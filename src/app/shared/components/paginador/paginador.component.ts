import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Reusable pagination control for server-side paginated tables. */
@Component({
  selector: 'app-paginador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.scss',
})
export class PaginadorComponent {
  @Input() page = 1;
  @Input() count = 0;
  @Input() pageSize = 10;
  @Output() cambiar = new EventEmitter<number>();

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.count / this.pageSize));
  }

  get desde(): number {
    return this.count === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get hasta(): number {
    return Math.min(this.page * this.pageSize, this.count);
  }

  ir(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.page) {
      this.cambiar.emit(pagina);
    }
  }
}
