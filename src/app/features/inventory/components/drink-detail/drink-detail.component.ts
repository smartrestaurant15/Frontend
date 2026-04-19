import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DrinkService } from '../../services/drink.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-drink-detail',
  templateUrl: './drink-detail.component.html',
  styleUrls: ['./drink-detail.component.scss']
})
export class DrinkDetailComponent implements OnInit {
  drink: any = null;
  loading = false;
  selectedPhotoIndex = 0;

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
          this.drink = response.message;
        } else {
          this.notificationService.showError('Bebida no encontrada');
          this.goBack();
        }
      },
      error: (err) => {
        console.error('❌ [DRINK DETAIL] Error:', err);
        this.loading = false;
        this.notificationService.showError('Error al cargar la bebida');
        this.goBack();
      }
    });
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
        error: () => { this.notificationService.showError('Error al eliminar la bebida'); }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/inventory/drinks']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    }
  }
}
