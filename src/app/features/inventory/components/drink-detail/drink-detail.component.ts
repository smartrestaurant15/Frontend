import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DrinkService } from '../../services/drink.service';
import { NotificationService } from '@core/services/notification.service';
import { DrinkDetailResponse } from '../../models/drink.model';

@Component({
  selector: 'app-drink-detail',
  templateUrl: './drink-detail.component.html',
  styleUrls: ['./drink-detail.component.scss']
})
export class DrinkDetailComponent implements OnInit {
  drink: DrinkDetailResponse | null = null;
  loading = false;
  selectedPhotoIndex = 0;
  restockUnits = 1;
  restockPrice = 0;
  restocking = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private drinkService: DrinkService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDrink(id);
    }
  }

  loadDrink(id: string): void {
    this.loading = true;
    this.drinkService.getDrinkById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          this.drink = response.message as DrinkDetailResponse;
          this.restockPrice = this.drink.purchasePrice ?? 0;
        } else {
          this.notificationService.showError('Bebida no encontrada');
          this.goBack();
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la bebida');
        this.goBack();
      }
    });
  }

  restock(): void {
    if (!this.drink || this.restocking) return;
    if (this.restockUnits < 1) {
      this.notificationService.showError('La cantidad debe ser al menos 1');
      return;
    }
    if (this.restockPrice <= 0) {
      this.notificationService.showError('El precio de compra debe ser mayor a 0');
      return;
    }
    this.restocking = true;
    this.drinkService.addStock(this.drink.id, {
      unit: this.restockUnits,
      purchasePrice: this.restockPrice
    }).subscribe({
      next: (response) => {
        this.restocking = false;
        if (!response.error) {
          this.notificationService.showSuccess(`+${this.restockUnits} unidades añadidas`);
          this.loadDrink(this.drink!.id);
        } else {
          this.notificationService.showError(response.message as string);
        }
      },
      error: () => {
        this.restocking = false;
        this.notificationService.showError('Error al reabastecer la bebida');
      }
    });
  }

  get isPrepared(): boolean {
    return this.drink?.drinkType === 'PREPARED';
  }

  get currentPhoto(): string | null {
    if (!this.drink?.photo) return null;
    return this.drink.photo;
  }

  selectPhoto(index: number): void {
    this.selectedPhotoIndex = index;
  }

  editDrink(): void {
    if (this.drink) {
      this.router.navigate(['/admin/inventory/drinks'], { queryParams: { edit: this.drink.id } });
    }
  }

  deleteDrink(): void {
    if (this.drink && confirm('¿Está seguro de eliminar esta bebida?')) {
      this.drinkService.deleteDrink(this.drink.id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Bebida eliminada exitosamente');
            this.goBack();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => this.notificationService.showError('Error al eliminar la bebida')
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/inventory/drinks']);
  }

  getStockBarWidth(units: number, minimumStock: number): number {
    if (minimumStock === 0) return 100;
    return Math.min(100, (units / (minimumStock * 3)) * 100);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    }
  }
}
