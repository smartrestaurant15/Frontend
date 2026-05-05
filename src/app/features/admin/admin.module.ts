import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';

import { AdminLayoutComponent } from './components/layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { UserFormModalComponent } from './components/user-management/user-form-modal.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { TablesComponent } from './components/tables/tables.component';
import { AdminInvoicesComponent } from './components/invoices/admin-invoices.component';
import { AccountingComponent } from './components/accounting/accounting.component';

import { AdminService } from './services/admin.service';
import { AuditService } from './services/audit.service';
import { DashboardService } from './services/dashboard.service';
import { TableService } from './services/table.service';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    DashboardComponent,
    UserManagementComponent,
    UserFormModalComponent,
    UserDetailComponent,
    AuditLogsComponent,
    TablesComponent,
    AdminInvoicesComponent,
    AccountingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AdminRoutingModule
  ],
  providers: [AdminService, AuditService, DashboardService, TableService]
})
export class AdminModule { }
