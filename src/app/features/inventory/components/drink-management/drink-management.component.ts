import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DrinkService } from '../../services/drink.service';
import { DrinkResponse } from '../../models/drink.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-drink-management',
  templateUrl: './drink-management.component.html',
  styleUrls: ['./drink-management.component.scss']
})
export class DrinkManagementComponent implements OnInit {
  drinks: DrinkResponse[] = [];
  loading = false;
  currentPage = 1;
  hasMorePages = true;
  pageSize = 10;
  isModalOpen = false;
  selectedDrinkId: string | null = null;
  searchTerm = '';

  get filteredDrinks(): DrinkResponse[] {
    if (!this.searchTerm.trim()) return this.drinks;
    const term = this.searchTerm.toLowerCase();
    return this.drinks.filter(d => d.name.toLowerCase().includes(term));
  }

  get alcoholCount(): number {
    return this.drinks.filter((d: any) => d.alcohol).length;
  }

  constructor(
    private drinkService: DrinkService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadDrinks();
    
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

  viewDrinkDetail(id: string): void {
    this.router.navigate(['/admin/inventory/drinks', id]);
  }

  loadDrinks(): void {
    this.loading = true;
    this.drinkService.getDrinks(this.currentPage - 1).subscribe({
      next: (response) => {
        if (!response.error) {
          const message = response.message as any;
          if (Array.isArray(message)) {
            this.drinks = message;
            this.hasMorePages = message.length >= this.pageSize;
          } else {
            this.drinks = [];
            this.hasMorePages = false;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        // Solo mostrar error si no es un 404 por lista vacía
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar las bebidas');
        } else {
          this.drinks = [];
          this.hasMorePages = false;
        }
      }
    });
  }

  nextPage(): void {
    this.currentPage++;
    this.loadDrinks();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDrinks();
    }
  }

  openCreateModal(): void {
    this.selectedDrinkId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string): void {
    this.selectedDrinkId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedDrinkId = null;
  }

  onDrinkSaved(): void {
    this.loadDrinks();
  }

  deleteDrink(id: string): void {
    if (confirm('¿Está seguro de eliminar esta bebida?')) {
      this.drinkService.deleteDrink(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Bebida eliminada exitosamente');
            this.loadDrinks();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar la bebida');
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
