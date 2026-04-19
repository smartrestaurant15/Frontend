import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { CustomerHomeComponent } from './components/customer-home/customer-home.component';
import { CustomerMenuComponent } from './components/customer-menu/customer-menu.component';
import { CustomerMyOrdersComponent } from './components/customer-my-orders/customer-my-orders.component';
import { PaymentResultComponent } from './components/payment-result/payment-result.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'home',           component: CustomerHomeComponent,    canActivate: [RoleGuard], data: { roles: ['CUSTOMER'] } },
      { path: 'menu',           component: CustomerMenuComponent,    canActivate: [RoleGuard], data: { roles: ['CUSTOMER'] } },
      { path: 'my-orders',      component: CustomerMyOrdersComponent, canActivate: [RoleGuard], data: { roles: ['CUSTOMER'] } },
      { path: 'payment-result', component: PaymentResultComponent,   canActivate: [RoleGuard], data: { roles: ['CUSTOMER'] } },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
