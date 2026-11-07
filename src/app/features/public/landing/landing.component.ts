import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);

  readonly destacadas = signal<Noticia[]>([]);

  readonly beneficios = [
    {
      icono: '🔒',
      titulo: 'Denuncia anónima real',
      texto: 'La identidad queda sólo en tu cuenta. El profesional ve la modalidad, nunca tus datos.',
    },
    {
      icono: '💬',
      titulo: 'Chat en tiempo real',
      texto: 'Conversación privada con el profesional asignado, sin intermediarios.',
    },
    {
      icono: '📈',
      titulo: 'Seguimiento claro',
      texto: 'Consultá el estado de tu caso y cada actualización del proceso.',
    },
    {
      icono: '📚',
      titulo: 'Recursos confiables',
      texto: 'Noticias, pódcast y foro para informarte y sentirte acompañada o acompañado.',
    },
  ];

  readonly pasos = [
    { numero: '1', titulo: 'Creá tu cuenta', texto: 'Registrate con tu correo en menos de un minuto.' },
    { numero: '2', titulo: 'Contá lo que pasó', texto: 'Elegí denuncia pública o anónima y describí los hechos.' },
    { numero: '3', titulo: 'Recibí acompañamiento', texto: 'Un profesional atiende tu caso y podés hablar por chat.' },
    { numero: '4', titulo: 'Seguí tu proceso', texto: 'Mirá el estado y las actualizaciones desde tu panel.' },
  ];

  ngOnInit(): void {
    this.noticiaService.listar().subscribe({
      next: (noticias) => this.destacadas.set(noticias.slice(0, 3)),
      error: () => this.destacadas.set([]),
    });
  }
}
