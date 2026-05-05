import { Component, OnInit } from '@angular/core';
import { AccountingService } from '../../services/accounting.service';
import { AccountingSummary, AdditionCost, DishCost, DrinkCost } from '../../models/accounting.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss']
})
export class AccountingComponent implements OnInit {
  summary: AccountingSummary | null = null;
  loading = false;
  Math = Math;

  fromDate: string = '';
  toDate: string = '';

  constructor(
    private accountingService: AccountingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fromDate = this.toIsoDate(firstOfMonth);
    this.toDate = this.toIsoDate(today);
    this.loadSummary();
  }

  loadSummary(): void {
    if (!this.fromDate || !this.toDate) return;
    this.loading = true;
    this.accountingService.getSummary(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: () => {
        this.notificationService.showError('Error al cargar el resumen contable');
        this.loading = false;
      }
    });
  }

  onApply(): void {
    this.loadSummary();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(value);
  }

  marginPercent(dish: DishCost): number {
    if (!dish.dishPrice || dish.dishPrice === 0) return 0;
    return Math.round((dish.margin / dish.dishPrice) * 100);
  }

  additionMarginPercent(addition: AdditionCost): number {
    if (!addition.salePrice || addition.salePrice === 0) return 0;
    return Math.round((addition.margin / addition.salePrice) * 100);
  }

  sortedDishes(): DishCost[] {
    if (!this.summary?.dishCosts) return [];
    return [...this.summary.dishCosts].sort((a, b) => b.margin - a.margin);
  }

  sortedAdditions(): AdditionCost[] {
    if (!this.summary?.additionCosts) return [];
    return [...this.summary.additionCosts].sort((a, b) => b.margin - a.margin);
  }

  drinkMarginPercent(drink: DrinkCost): number {
    if (!drink.salePrice || drink.salePrice === 0) return 0;
    return Math.round((drink.margin / drink.salePrice) * 100);
  }

  sortedDrinks(): DrinkCost[] {
    if (!this.summary?.drinkCosts) return [];
    return [...this.summary.drinkCosts].sort((a, b) => b.margin - a.margin);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
