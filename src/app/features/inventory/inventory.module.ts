import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { InventoryRoutingModule } from './inventory-routing.module';
import { SharedModule } from '@shared/shared.module';

import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { InventoryDetailComponent } from './components/inventory-detail/inventory-detail.component';
import { InventoryFormComponent } from './components/inventory-form/inventory-form.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { CategoryFormModalComponent } from './components/category-management/category-form-modal.component';
import { StockAlertComponent } from './components/stock-alert/stock-alert.component';
import { SupplierManagementComponent } from './components/supplier-management/supplier-management.component';
import { SupplierFormModalComponent } from './components/supplier-management/supplier-form-modal.component';
import { DishManagementComponent } from './components/dish-management/dish-management.component';
import { DishFormModalComponent } from './components/dish-management/dish-form-modal.component';
import { DishDetailComponent } from './components/dish-detail/dish-detail.component';
import { DrinkManagementComponent } from './components/drink-management/drink-management.component';
import { DrinkFormModalComponent } from './components/drink-management/drink-form-modal.component';
import { DrinkDetailComponent } from './components/drink-detail/drink-detail.component';
import { AdditionManagementComponent } from './components/addition-management/addition-management.component';
import { AdditionFormModalComponent } from './components/addition-management/addition-form-modal.component';
import { DailyMenuComponent } from './components/daily-menu/daily-menu.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InventoryMovementsComponent } from './components/inventory-movements/inventory-movements.component';

@NgModule({
  declarations: [
    InventoryListComponent,
    InventoryDetailComponent,
    InventoryFormComponent,
    CategoryManagementComponent,
    CategoryFormModalComponent,
    StockAlertComponent,
    SupplierManagementComponent,
    SupplierFormModalComponent,
    DishManagementComponent,
    DishFormModalComponent,
    DishDetailComponent,
    DrinkManagementComponent,
    DrinkFormModalComponent,
    DrinkDetailComponent,
    AdditionManagementComponent,
    AdditionFormModalComponent,
    DailyMenuComponent,
    DashboardComponent,
    InventoryMovementsComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ]
})
export class InventoryModule { }
