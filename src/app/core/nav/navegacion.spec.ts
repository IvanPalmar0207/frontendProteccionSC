import { NAVEGACION } from './navegacion';

describe('NAVEGACION por rol', () => {
  it('el administrador no tiene acceso al chat en su navegación', () => {
    const rutas = NAVEGACION.ADMINISTRADOR.map((item) => item.ruta);
    expect(rutas).not.toContain('/chat');
  });

  it('el usuario normal no usa panel lateral y conserva sus rutas', () => {
    const rutas = NAVEGACION.USUARIO.map((item) => item.ruta);
    expect(rutas).toContain('/usuario/perfil');
    expect(rutas).toContain('/usuario/denuncias');
    expect(rutas).toContain('/chat');
  });

  it('profesional y administrador acceden a su perfil', () => {
    expect(NAVEGACION.PROFESIONAL.map((i) => i.ruta)).toContain('/profesional/perfil');
    expect(NAVEGACION.ADMINISTRADOR.map((i) => i.ruta)).toContain('/admin/perfil');
  });
});
