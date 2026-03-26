import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { InactivityService } from './core/services/inactivity.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'smartRestaurante';
  currentRoute = '';

  constructor(
    private router: Router,
    private inactivityService: InactivityService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {
    // Iniciar el monitoreo de inactividad al cargar la aplicacion
    this.inactivityService.startMonitoring();
  }

  ngOnDestroy(): void {
    // Detener el monitoreo al destruir el componente
    this.inactivityService.stopMonitoring();
  }

  showNavbar(): boolean {
    // No mostrar navbar en rutas de autenticacion
    const authRoutes = ['/auth/login', '/auth/register', '/auth/verify-account',
      '/auth/forgot-password', '/auth/reset-password'];
    return !authRoutes.some(route => this.currentRoute.startsWith(route));
  }
}

