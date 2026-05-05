import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../models/user-role.enum';

/**
 * Servicio para manejar redirecciones basadas en roles de usuario
 */
@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {

  // Mapeo de roles a rutas de dashboard
  private readonly ROLE_ROUTES: Record<UserRole, string> = {
    [UserRole.ADMIN]:    '/admin/dashboard',
    [UserRole.KITCHEN]:  '/orders/kitchen',
    [UserRole.WAITER]:   '/orders/waiter',
    [UserRole.CASHIER]:  '/orders/cashier',
    [UserRole.CUSTOMER]: '/customer/home'
  };

  constructor(private router: Router) {}

  /**
   * Redirige al usuario a su dashboard correspondiente según su rol
   */
  redirectByRole(role: UserRole, requiresPasswordChange: boolean = false): void {
    // Si requiere cambio de contraseña, redirigir primero a cambio de contraseña
    if (requiresPasswordChange) {
      this.router.navigate(['/auth/change-password'], {
        queryParams: { forced: 'true' }
      });
      return;
    }

    // Redirigir según el rol
    const route = this.ROLE_ROUTES[role] || '/customer/home';
    this.router.navigate([route]);
  }

  /**
   * Obtiene la ruta de dashboard para un rol específico
   */
  getDashboardRoute(role: UserRole): string {
    return this.ROLE_ROUTES[role] || '/customer/home';
  }

  /**
   * Verifica si una ruta es válida para un rol específico
   */
  isRouteAllowedForRole(route: string, role: UserRole): boolean {
    const allowedRoute = this.ROLE_ROUTES[role];
    return route.startsWith(allowedRoute.split('/')[1]);
  }
}
