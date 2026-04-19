import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DishService } from '../../services/dish.service';
import { DishDetailResponse } from '../../models/dish.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-dish-detail',
  templateUrl: './dish-detail.component.html',
  styleUrls: ['./dish-detail.component.scss']
})
export class DishDetailComponent implements OnInit {
  dish: DishDetailResponse | null = null;
  loading = false;
  selectedPhotoIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dishService: DishService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDish(id);
    }
  }

  loadDish(id: string): void {
    this.loading = true;
    this.dishService.getDishById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          this.dish = response.message as DishDetailResponse;
        } else {
          this.notificationService.showError('Plato no encontrado');
          this.goBack();
        }
      },
      error: (err) => {
        console.error('❌ [DISH DETAIL] Error:', err);
        this.loading = false;
        this.notificationService.showError('Error al cargar el plato');
        this.goBack();
      }
    });
  }

  selectPhoto(index: number): void {
    this.selectedPhotoIndex = index;
  }

  editDish(): void {
    if (this.dish) {
      this.router.navigate(['/admin/inventory/dishes'], {
        queryParams: { edit: this.dish.id }
      });
    }
  }

  deleteDish(): void {
    if (this.dish && confirm('¿Está seguro de eliminar este plato?')) {
      this.dishService.deleteDish(this.dish.id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Plato eliminado exitosamente');
            this.goBack();
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

  goBack(): void {
    this.router.navigate(['/admin/inventory/dishes']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    }
  }

  // Helper methods para manejar la estructura real del backend (snake_case)
  getIngredientName(ingredient: any): string {
    return ingredient.product_name || 
           ingredient.productName || 
           ingredient.name || 
           `Producto ID: ${ingredient.product_id || ingredient.productId || 'desconocido'}`;
  }

  getIngredientQuantity(ingredient: any): number {
    return ingredient.weight || ingredient.quantity || 0;
  }

  getIngredientUnit(ingredient: any): string {
    return ingredient.unit || 'g';
  }
}
