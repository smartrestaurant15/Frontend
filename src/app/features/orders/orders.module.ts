import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { OrdersRoutingModule } from './orders-routing.module';
import { SharedModule } from '@shared/shared.module';

import { KitchenBoardComponent } from './components/kitchen-board/kitchen-board.component';
import { WaiterOrdersComponent } from './components/waiter-orders/waiter-orders.component';
import { OrderCreateComponent } from './components/order-create/order-create.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';

@NgModule({
  declarations: [
    KitchenBoardComponent,
    WaiterOrdersComponent,
    OrderCreateComponent,
    CustomerOrdersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    OrdersRoutingModule,
    SharedModule
  ]
})
export class OrdersModule { }
