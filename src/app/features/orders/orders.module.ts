import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { OrdersRoutingModule } from './orders-routing.module';
import { SharedModule } from '@shared/shared.module';

import { KitchenBoardComponent } from './components/kitchen-board/kitchen-board.component';
import { WaiterOrdersComponent } from './components/waiter-orders/waiter-orders.component';
import { OrderCreateComponent } from './components/order-create/order-create.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';
import { CashierComponent } from './components/cashier/cashier.component';

@NgModule({
  declarations: [
    KitchenBoardComponent,
    WaiterOrdersComponent,
    OrderCreateComponent,
    CustomerOrdersComponent,
    CashierComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    OrdersRoutingModule,
    SharedModule
  ]
})
export class OrdersModule { }
