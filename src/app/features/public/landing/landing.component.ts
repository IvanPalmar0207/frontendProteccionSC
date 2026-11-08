import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { ParallaxDirective } from '../../../core/animations/parallax.directive';
import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';

interface Paso {
  numero: string;
  titulo: string;
  texto: string;
  foto: string;
  alt: string;
}

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, InViewDirective, ParallaxDirective],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);

  readonly destacadas = signal<Noticia[]>([]);

  readonly beneficios = [
    {
      icono: '🔒',
      titulo: 'Anonimato protegido',
      texto: 'Tu identidad queda sólo en tu cuenta; el profesional ve la modalidad, nunca tus datos.',
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

  /** These four steps describe exactly what the system does. */
  readonly pasos: Paso[] = [
    {
      numero: '01',
      titulo: 'Creas tu cuenta',
      texto: 'Te registrás con tu correo en menos de un minuto y accedés a tu espacio personal.',
      foto: '/photos/proceso-1.webp',
      alt: 'Personas conversando en un espacio de trabajo luminoso',
    },
    {
      numero: '02',
      titulo: 'Registrás la denuncia',
      texto: 'Eliges modalidad pública o anónima y describes lo sucedido con el detalle que puedas.',
      foto: '/photos/proceso-2.webp',
      alt: 'Personas conversando en una mesa, compartiendo información',
    },
    {
      numero: '03',
      titulo: 'La denuncia se procesa',
      texto: 'Un profesional autorizado toma el caso, actualiza el estado y deja observaciones.',
      foto: '/photos/proceso-3.webp',
      alt: 'Dos personas manteniendo una conversación de acompañamiento',
    },
    {
      numero: '04',
      titulo: 'Seguís el avance',
      texto: 'Consultás el seguimiento, conversás por chat y accedés a los canales de acompañamiento.',
      foto: '/photos/proceso-4.webp',
      alt: 'Persona sonriendo durante una conversación profesional',
    },
  ];

  ngOnInit(): void {
    this.noticiaService.listar().subscribe({
      next: (noticias) => this.destacadas.set(noticias.slice(0, 3)),
      error: () => this.destacadas.set([]),
    });
  }
}
