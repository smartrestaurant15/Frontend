import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DailyMenuService } from '../../services/daily-menu.service';
import { DishService } from '../../services/dish.service';
import { DailyMenuDish } from '../../models/daily-menu.model';
import { DishResponse } from '../../models/dish.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-daily-menu',
  templateUrl: './daily-menu.component.html',
  styleUrls: ['./daily-menu.component.scss']
})
export class DailyMenuComponent implements OnInit {
  dailyMenuDishes: DailyMenuDish[] = [];
  availableDishes: DishResponse[] = [];
  loading = false;
  loadingAvailable = false;
  currentPage = 1;
  hasMorePages = true;
  pageSize = 10;
  isAddModalOpen = false;

  constructor(
    private dailyMenuService: DailyMenuService,
    private dishService: DishService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDailyMenu();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadDailyMenu(): void {
    this.loading = true;
    this.dailyMenuService.getDailyMenuDishes(this.currentPage - 1).subscribe({
      next: (response: any) => {
        const dishes = response.data || response.message;
        if (!response.error && Array.isArray(dishes)) {
          this.dailyMenuDishes = dishes;
          this.hasMorePages = dishes.length >= this.pageSize;
        } else {
          this.dailyMenuDishes = [];
          this.hasMorePages = false;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.dailyMenuDishes = [];
        this.hasMorePages = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar el menú del día');
        }
      }
    });
  }

  loadAvailableDishes(): void {
    this.loadingAvailable = true;
    this.dishService.getDishes(0).subscribe({
      next: (response) => {
        if (!response.error) {
          const data = response.message as any;
          this.availableDishes = Array.isArray(data) ? data : [];
        } else {
          this.availableDishes = [];
        }
        this.loadingAvailable = false;
      },
      error: (err) => {
        this.loadingAvailable = false;
        this.availableDishes = [];
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar los platos disponibles');
        }
      }
    });
  }

  openAddModal(): void {
    this.loadAvailableDishes();
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  addDishToMenu(dishId: string): void {
    this.dailyMenuService.addDishToMenu(dishId).subscribe({
      next: (response) => {
        if (!response.error) {
          this.notificationService.showSuccess('Plato agregado al menú diario');
          this.loadDailyMenu();
          this.closeAddModal();
        } else {
          this.notificationService.showError(response.data as string);
        }
      },
      error: () => {
        this.notificationService.showError('Error al agregar plato al menú');
      }
    });
  }

  removeDishFromMenu(dishId: string): void {
    if (confirm('¿Está seguro de eliminar este plato del menú diario?')) {
      this.dailyMenuService.removeDishFromMenu(dishId).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Plato eliminado del menú diario');
            this.loadDailyMenu();
          } else {
            this.notificationService.showError(response.data as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar plato del menú');
        }
      });
    }
  }

  nextPage(): void {
    this.currentPage++;
    this.loadDailyMenu();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDailyMenu();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    }
  }

  viewDishDetail(dishId: string): void {
    this.router.navigate(['/inventory/dishes', dishId]);
  }
}
