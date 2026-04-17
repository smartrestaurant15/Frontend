import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { TablesComponent } from './components/tables/tables.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard',  component: DashboardComponent },
      { path: 'users',      component: UserManagementComponent },
      { path: 'users/:id',  component: UserDetailComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'tables',     component: TablesComponent },
      {
        path: 'inventory',
        loadChildren: () => import('../inventory/inventory.module').then(m => m.InventoryModule)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
