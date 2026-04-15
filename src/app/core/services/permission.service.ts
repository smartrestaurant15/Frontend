import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { UserRole } from '@features/auth/models/user-role.enum';

/**
 * Servicio para gestionar permisos granulares basados en roles
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  // Mapeo de roles a permisos
  private readonly ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
    [UserRole.ADMIN]: new Set([
      // Órdenes
      'order:read', 'order:write', 'order:delete',
      // Administración
      'admin:read', 'admin:write',
      'user:read', 'user:write', 'user:delete',
      'audit:read',
      // Inventario (productos)
      'inventory:read', 'inventory:write', 'inventory:delete',
      'product:read', 'product:write', 'product:delete', // Alias para inventario
      // Proveedores
      'supplier:read', 'supplier:write', 'supplier:delete',
      // Platos
      'dish:read', 'dish:write', 'dish:delete',
      // Bebidas
      'drink:read', 'drink:write', 'drink:delete',
      // Adiciones
      'addition:read', 'addition:write', 'addition:delete',
      // Menú del día
      'daily_menu:read', 'daily_menu:write', 'daily_menu:delete',
      // Categorías
      'category:read', 'category:write', 'category:delete',
      // Alertas de stock
      'stock_alert:read',
      // Movimientos de inventario
      'inventory_movement:read', 'inventory_movement:write'
    ]),
    
    [UserRole.KITCHEN]: new Set([
      // Órdenes
      'order:read', 'order:write',
      // Inventario (productos)
      'inventory:read', 'inventory:write', 'inventory:delete',
      'product:read', 'product:write', 'product:delete', // Alias para inventario
      // Proveedores
      'supplier:read', 'supplier:write', 'supplier:delete',
      // Platos
      'dish:read', 'dish:write', 'dish:delete',
      // Bebidas
      'drink:read', 'drink:write', 'drink:delete',
      // Adiciones
      'addition:read', 'addition:write', 'addition:delete',
      // Menú del día
      'daily_menu:read', 'daily_menu:write', 'daily_menu:delete',
      // Categorías
      'category:read', 'category:write', 'category:delete',
      // Alertas de stock
      'stock_alert:read',
      // Movimientos de inventario
      'inventory_movement:read', 'inventory_movement:write'
    ]),
    
    [UserRole.WAITER]: new Set([
      // Órdenes
      'order:read', 'order:write',
      // Solo lectura
      'dish:read',
      'drink:read',
      'addition:read',
      'daily_menu:read',
      'stock_alert:read'
    ]),
    
    [UserRole.CUSTOMER]: new Set([
      'order:read'
    ])
  };

  constructor(private storageService: StorageService) {}

  /**
   * Verifica si el usuario actual tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole) {
      return false;
    }

    const permissions = this.ROLE_PERMISSIONS[userRole];
    return permissions ? permissions.has(permission) : false;
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Verifica si el usuario puede leer un módulo específico
   */
  canRead(module: string): boolean {
    return this.hasPermission(`${module}:read`);
  }

  /**
   * Verifica si el usuario puede escribir en un módulo específico
   */
  canWrite(module: string): boolean {
    return this.hasPermission(`${module}:write`);
  }

  /**
   * Verifica si el usuario puede eliminar en un módulo específico
   */
  canDelete(module: string): boolean {
    return this.hasPermission(`${module}:delete`);
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  getUserPermissions(): Set<string> {
    const userRole = this.getUserRole();
    if (!userRole) {
      return new Set();
    }

    return this.ROLE_PERMISSIONS[userRole] || new Set();
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Verifica si el usuario es personal del restaurante (no cliente)
   */
  isStaff(): boolean {
    const userRole = this.getUserRole();
    return userRole === UserRole.ADMIN || 
           userRole === UserRole.KITCHEN || 
           userRole === UserRole.WAITER;
  }

  /**
   * Verifica si el usuario es cliente
   */
  isCustomer(): boolean {
    return this.hasRole(UserRole.CUSTOMER);
  }

  /**
   * Obtiene el rol del usuario actual
   */
  private getUserRole(): UserRole | null {
    const roleString = this.storageService.getUserRole();
    
    // Validar que el string sea un valor válido del enum
    if (!roleString || !Object.values(UserRole).includes(roleString as UserRole)) {
      return null;
    }
    
    return roleString as UserRole;
  }

  /**
   * Obtiene el nivel de privilegio del rol actual
   */
  getPrivilegeLevel(): number {
    const userRole = this.getUserRole();
    const levels: Record<UserRole, number> = {
      [UserRole.ADMIN]: 4,
      [UserRole.KITCHEN]: 3,
      [UserRole.WAITER]: 2,
      [UserRole.CUSTOMER]: 1
    };
    return userRole ? levels[userRole] : 0;
  }

  /**
   * Verifica si el usuario tiene al menos el nivel de privilegio especificado
   */
  hasPrivilegeLevel(level: number): boolean {
    return this.getPrivilegeLevel() >= level;
  }
}
