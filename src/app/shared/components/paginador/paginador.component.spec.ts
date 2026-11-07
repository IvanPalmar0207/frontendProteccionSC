import { TestBed } from '@angular/core/testing';

import { PaginadorComponent } from './paginador.component';

describe('PaginadorComponent', () => {
  let componente: PaginadorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaginadorComponent] });
    const fixture = TestBed.createComponent(PaginadorComponent);
    componente = fixture.componentInstance;
  });

  it('computes the page count from the total count', () => {
    componente.count = 25;
    componente.pageSize = 10;
    expect(componente.totalPaginas).toBe(3);
  });

  it('computes the visible range', () => {
    componente.count = 25;
    componente.pageSize = 10;
    componente.page = 2;
    expect(componente.desde).toBe(11);
    expect(componente.hasta).toBe(20);
  });

  it('emits the requested page only when it is in range', () => {
    const emitidos: number[] = [];
    componente.cambiar.subscribe((pagina) => emitidos.push(pagina));
    componente.count = 25;
    componente.page = 1;

    componente.ir(2);
    componente.ir(0);
    componente.ir(99);
    componente.ir(1);

    expect(emitidos).toEqual([2]);
  });

  it('reports an empty count without a page range', () => {
    componente.count = 0;
    expect(componente.desde).toBe(0);
    expect(componente.hasta).toBe(0);
  });
});
