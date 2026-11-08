import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AlertaService } from '../../../core/services/alerta.service';
import { RegisterComponent } from './register.component';
import { MENSAJES_REGISTRO } from './registro-errores';

const DATOS_VALIDOS = {
  nombre_completo: 'Persona Prueba',
  email: 'persona@test.dev',
  documento: 'DOC-1',
  telefono: '3001234567',
  password: 'Usuario123*',
  password_confirm: 'Usuario123*',
};

describe('RegisterComponent — notificaciones de error', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let alerta: { error: ReturnType<typeof vi.fn>; exito: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    alerta = { error: vi.fn(), exito: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlertaService, useValue: alerta },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fixture = TestBed.createComponent(RegisterComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function enviar(payload: Record<string, string> = DATOS_VALIDOS) {
    fixture.componentInstance.form.patchValue(payload);
    fixture.componentInstance.onSubmit();
    return httpMock.expectOne((req) => req.url.endsWith('/auth/register/'));
  }

  it('no muestra ninguna alerta en un registro exitoso', () => {
    const req = enviar();
    req.flush({ detail: 'ok', user: {} }, { status: 201, statusText: 'Created' });
    expect(alerta.error).not.toHaveBeenCalled();
  });

  it('notifica el correo duplicado y conserva los datos escritos', () => {
    const req = enviar();
    req.flush({ email: ['Ya existe.'] }, { status: 400, statusText: 'Bad Request' });

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith(
      'Correo ya registrado',
      MENSAJES_REGISTRO.correoDuplicado,
    );
    const valor = fixture.componentInstance.form.getRawValue();
    expect(valor.email).toBe('persona@test.dev');
    expect(valor.documento).toBe('DOC-1');
    expect(valor.nombre_completo).toBe('Persona Prueba');
  });

  it('notifica el documento duplicado', () => {
    const req = enviar();
    req.flush({ documento: ['Ya existe.'] }, { status: 400, statusText: 'Bad Request' });

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith(
      'Documento ya registrado',
      MENSAJES_REGISTRO.documentoDuplicado,
    );
    expect(fixture.componentInstance.form.getRawValue().documento).toBe('DOC-1');
  });

  it('notifica cuando el correo y el documento ya existen', () => {
    const req = enviar();
    req.flush(
      { email: ['x'], documento: ['y'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith(
      'Datos ya registrados',
      MENSAJES_REGISTRO.ambosDuplicados,
    );
  });

  it('notifica un error inesperado del servidor', () => {
    const req = enviar();
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith(
      'No se pudo completar el registro',
      MENSAJES_REGISTRO.inesperado,
    );
  });

  it('notifica un error de conexión cuando no hay respuesta', () => {
    const req = enviar();
    req.error(new ProgressEvent('error'));

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith('Sin conexión', MENSAJES_REGISTRO.conexion);
  });

  it('no envía la petición y notifica si faltan campos obligatorios', () => {
    fixture.componentInstance.form.patchValue({
      nombre_completo: '',
      email: '',
      documento: '',
      password: '',
      password_confirm: '',
    });
    fixture.componentInstance.onSubmit();

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith('Faltan datos', MENSAJES_REGISTRO.obligatorios);
    httpMock.expectNone((req) => req.url.endsWith('/auth/register/'));
  });

  it('notifica un correo inválido', () => {
    fixture.componentInstance.form.patchValue({ ...DATOS_VALIDOS, email: 'no-es-correo' });
    fixture.componentInstance.onSubmit();

    expect(alerta.error).toHaveBeenCalledTimes(1);
    expect(alerta.error).toHaveBeenCalledWith('Correo inválido', MENSAJES_REGISTRO.correoInvalido);
    httpMock.expectNone((req) => req.url.endsWith('/auth/register/'));
  });
});
