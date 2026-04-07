import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DishService } from '../../services/dish.service';
import { DishResponse } from '../../models/dish.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-dish-management',
  templateUrl: './dish-management.component.html',
  styleUrls: ['./dish-management.component.scss']
})
export class DishManagementComponent implements OnInit {
  dishes: DishResponse[] = [];
  loading = false;
  currentPage = 1;
  hasMorePages = true;
  pageSize = 10;
  isModalOpen = false;
  selectedDishId: string | null = null;

  constructor(
    private dishService: DishService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadDishes();
    
    // Detectar si viene un query param para editar
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.openEditModal(params['edit']);
        // Limpiar el query param después de abrir el modal
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  openCreateModal(): void {
    this.selectedDishId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string): void {
    this.selectedDishId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedDishId = null;
  }

  onDishSaved(): void {
    this.loadDishes();
  }

  viewDishDetail(id: string): void {
    this.router.navigate(['/inventory/dishes', id]);
  }

  loadDishes(): void {
    this.loading = true;
    this.dishService.getDishes(this.currentPage - 1).subscribe({
      next: (response) => {
        if (!response.error) {
          const message = response.message as any;
          if (Array.isArray(message)) {
            this.dishes = message;
            this.hasMorePages = message.length >= this.pageSize;
          } else {
            this.dishes = [];
            this.hasMorePages = false;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar los platos');
        } else {
          this.dishes = [];
          this.hasMorePages = false;
        }
      }
    });
  }

  nextPage(): void {
    this.currentPage++;
    this.loadDishes();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDishes();
    }
  }

  deleteDish(id: string): void {
    if (confirm('¿Está seguro de eliminar este plato?')) {
      this.dishService.deleteDish(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Plato eliminado exitosamente');
            this.loadDishes();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar el plato');
        }
      });
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    }
  }
}
