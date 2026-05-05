import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';

import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { InventoryDetailComponent } from './components/inventory-detail/inventory-detail.component';
import { InventoryFormComponent } from './components/inventory-form/inventory-form.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { StockAlertComponent } from './components/stock-alert/stock-alert.component';
import { SupplierManagementComponent } from './components/supplier-management/supplier-management.component';
import { DishManagementComponent } from './components/dish-management/dish-management.component';
import { DishDetailComponent } from './components/dish-detail/dish-detail.component';
import { DrinkManagementComponent } from './components/drink-management/drink-management.component';
import { DrinkDetailComponent } from './components/drink-detail/drink-detail.component';
import { AdditionManagementComponent } from './components/addition-management/addition-management.component';
import { DailyMenuComponent } from './components/daily-menu/daily-menu.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InventoryMovementsComponent } from './components/inventory-movements/inventory-movements.component';
import { MenuTemplatesComponent } from './components/menu-templates/menu-templates.component';
import { MenuPublicationDetailComponent } from './components/menu-publication-detail/menu-publication-detail.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
        // Sin RoleGuard - accesible para todos los usuarios autenticados
      },
      {
        path: 'list',
        component: InventoryListComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['product:read'] }
      },
      {
        path: 'detail/:id',
        component: InventoryDetailComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['product:read'] }
      },
      {
        path: 'new',
        component: InventoryFormComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['product:write'] }
      },
      {
        path: 'edit/:id',
        component: InventoryFormComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['product:write'] }
      },
      {
        path: 'categories',
        component: CategoryManagementComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['category:read'] }
      },
      {
        path: 'alerts',
        component: StockAlertComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['stock_alert:read'] }
      },
      {
        path: 'suppliers',
        component: SupplierManagementComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['supplier:read'] }
      },
      {
        path: 'dishes',
        component: DishManagementComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['dish:read'] }
      },
      {
        path: 'dishes/:id',
        component: DishDetailComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['dish:read'] }
      },
      {
        path: 'drinks',
        component: DrinkManagementComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['drink:read'] }
      },
      {
        path: 'drinks/:id',
        component: DrinkDetailComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['drink:read'] }
      },
      {
        path: 'additions',
        component: AdditionManagementComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['addition:read'] }
      },
      {
        path: 'daily-menu',
        component: DailyMenuComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['daily_menu:read'] }
      },
      {
        path: 'daily-menu/:id',
        component: MenuPublicationDetailComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['daily_menu:read'] }
      },
      {
        path: 'menu-templates',
        component: MenuTemplatesComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['daily_menu:read'] }
      },
      {
        path: 'movements',
        component: InventoryMovementsComponent,
        canActivate: [RoleGuard],
        data: { permissions: ['inventory_movement:read'] }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
