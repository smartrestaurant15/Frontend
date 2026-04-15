import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '@core/services/storage.service';
import { AuthService } from '@features/auth/services/auth.service';
import { UserRole } from '@features/auth/models/user-role.enum';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';
  userRole: string = '';
  
  // Navigation sections organized by functional area
  navSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard', icon: '🏠', route: '/inventory/dashboard', roles: [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER] }
      ]
    },
    {
      title: 'Gestión',
      items: [
        { label: 'Inventario', icon: '📦', route: '/inventory/list', roles: [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER] },
        { label: 'Categorías', icon: '📁', route: '/inventory/categories', roles: [UserRole.ADMIN] },
        { label: 'Proveedores', icon: '🚚', route: '/inventory/suppliers', roles: [UserRole.ADMIN, UserRole.KITCHEN] }
      ]
    },
    {
      title: 'Menú',
      items: [
        { label: 'Platos', icon: '🍝', route: '/inventory/dishes', roles: [UserRole.ADMIN, UserRole.KITCHEN] },
        { label: 'Bebidas', icon: '🥤', route: '/inventory/drinks', roles: [UserRole.ADMIN, UserRole.KITCHEN] },
        { label: 'Adiciones', icon: '➕', route: '/inventory/additions', roles: [UserRole.ADMIN, UserRole.KITCHEN] }
      ]
    },
    {
      title: 'Alertas',
      items: [
        { label: 'Stock Bajo', icon: '⚠️', route: '/inventory/alerts', roles: [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER] }
      ]
    },
    {
      title: 'Órdenes',
      items: [
        { label: 'Tablero Cocina', icon: '🍳', route: '/orders/kitchen', roles: [UserRole.KITCHEN, UserRole.ADMIN] },
        { label: 'Órdenes',       icon: '📋', route: '/orders/waiter',  roles: [UserRole.WAITER,  UserRole.ADMIN] },
        { label: 'Mis Pedidos',   icon: '🛍',  route: '/orders/my-orders', roles: [UserRole.CUSTOMER] }
      ]
    }
  ];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.storageService.getUserRole();
    this.currentRoute = this.router.url;
    
    // Listen to route changes
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  hasAccess(item: NavItem): boolean {
    // Si no hay rol definido, mostrar todo (para testing)
    if (!this.userRole) {
      return true;
    }
    return item.roles.includes(this.userRole as UserRole);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getVisibleSections(): NavSection[] {
    return this.navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => this.hasAccess(item))
      }))
      .filter(section => section.items.length > 0);
  }
}
