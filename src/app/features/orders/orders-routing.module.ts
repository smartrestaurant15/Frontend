import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { KitchenBoardComponent } from './components/kitchen-board/kitchen-board.component';
import { WaiterOrdersComponent } from './components/waiter-orders/waiter-orders.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';
import { CashierComponent } from './components/cashier/cashier.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'kitchen',
        component: KitchenBoardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['KITCHEN', 'ADMIN'] }
      },
      {
        path: 'waiter',
        component: WaiterOrdersComponent,
        canActivate: [RoleGuard],
        data: { roles: ['WAITER', 'ADMIN'] }
      },
      {
        path: 'cashier',
        component: CashierComponent,
        canActivate: [RoleGuard],
        data: { roles: ['CASHIER', 'ADMIN'] }
      },
      {
        path: 'my-orders',
        component: CustomerOrdersComponent,
        canActivate: [RoleGuard],
        data: { roles: ['CUSTOMER'] }
      },
      {
        path: '',
        redirectTo: 'waiter',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
