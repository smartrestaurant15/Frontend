import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KitchenBoardComponent } from './components/kitchen-board/kitchen-board.component';
import { WaiterOrdersComponent } from './components/waiter-orders/waiter-orders.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';

const routes: Routes = [
  { path: 'kitchen', component: KitchenBoardComponent },
  { path: 'waiter',  component: WaiterOrdersComponent },
  { path: 'my',      component: CustomerOrdersComponent },
  { path: '',        redirectTo: 'waiter', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule {}
