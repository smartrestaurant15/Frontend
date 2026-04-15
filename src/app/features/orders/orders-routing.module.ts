import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { KitchenBoardComponent } from './components/kitchen-board/kitchen-board.component';
import { WaiterOrdersComponent } from './components/waiter-orders/waiter-orders.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      // Cocina — tablero en tiempo real
      {
        path: 'kitchen',
        component: KitchenBoardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['KITCHEN', 'ADMIN'] }
      },
      // Mesero — gestión completa de órdenes
      {
        path: 'waiter',
        component: WaiterOrdersComponent,
        canActivate: [RoleGuard],
        data: { roles: ['WAITER', 'ADMIN'] }
      },
      // Cliente — mis órdenes
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
