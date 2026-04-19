import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRoutingModule } from './customer-routing.module';
import { SharedModule } from '@shared/shared.module';

import { CustomerHomeComponent } from './components/customer-home/customer-home.component';
import { CustomerMenuComponent } from './components/customer-menu/customer-menu.component';
import { CustomerMyOrdersComponent } from './components/customer-my-orders/customer-my-orders.component';
import { PaymentResultComponent } from './components/payment-result/payment-result.component';

@NgModule({
  declarations: [
    CustomerHomeComponent,
    CustomerMenuComponent,
    CustomerMyOrdersComponent,
    PaymentResultComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CustomerRoutingModule,
    SharedModule
  ]
})
export class CustomerModule { }
