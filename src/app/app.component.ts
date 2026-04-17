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

  isAdminRoute(): boolean {
    return this.currentRoute.startsWith('/admin') ||
           this.currentRoute.startsWith('/inventory');
  }

  showNavbar(): boolean {
    const hiddenRoutes = [
      '/auth/login', '/auth/register', '/auth/verify-account',
      '/auth/forgot-password', '/auth/reset-password',
      '/auth/profile', '/auth/change-password',
      '/admin',
      '/inventory',
      '/orders/kitchen',
      '/orders/waiter',
      '/customer'
    ];
    const isLanding = this.currentRoute === '/' || this.currentRoute === '';
    return !isLanding && !hiddenRoutes.some(route => this.currentRoute.startsWith(route));
  }

  showChatbot(): boolean {
    const isLanding = this.currentRoute === '/' || this.currentRoute === '';
    const authRoutes = [
      '/auth/login', '/auth/register', '/auth/verify-account',
      '/auth/forgot-password', '/auth/reset-password',
      '/orders/kitchen',
      '/orders/waiter',
      '/customer'
    ];
    return !isLanding && !authRoutes.some(route => this.currentRoute.startsWith(route));
  }
}

