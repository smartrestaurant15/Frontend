import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdditionService } from '../../services/addition.service';
import { AdditionResponse, AdditionDetailResponse } from '../../models/addition.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-addition-management',
  templateUrl: './addition-management.component.html',
  styleUrls: ['./addition-management.component.scss']
})
export class AdditionManagementComponent implements OnInit {
  additions: AdditionResponse[] = [];
  loading = false;
  currentPage = 1;
  hasMorePages = true;
  pageSize = 10;
  isModalOpen = false;
  selectedAdditionId: string | null = null;
  searchTerm = '';

  selectedDetail: AdditionDetailResponse | null = null;
  loadingDetail = false;

  // Restock state (SIMPLE only)
  restockUnits = 1;
  restockPrice = 0;
  restocking = false;

  get filteredAdditions(): AdditionResponse[] {
    if (!this.searchTerm.trim()) return this.additions;
    const term = this.searchTerm.toLowerCase();
    return this.additions.filter(a => a.name.toLowerCase().includes(term));
  }

  get simpleCount(): number {
    return this.additions.filter(a => a.additionType === 'SIMPLE').length;
  }

  get preparedCount(): number {
    return this.additions.filter(a => a.additionType === 'PREPARED').length;
  }

  get isSelectedPrepared(): boolean {
    return this.selectedDetail?.additionType === 'PREPARED';
  }

  constructor(
    private additionService: AdditionService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAdditions();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadAdditions(): void {
    this.loading = true;
    this.additionService.getAdditions(this.currentPage - 1).subscribe({
      next: (response) => {
        if (!response.error) {
          const message = response.message as any;
          if (Array.isArray(message)) {
            this.additions = message;
            this.hasMorePages = message.length >= this.pageSize;
          } else {
            this.additions = [];
            this.hasMorePages = false;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar las adiciones');
        } else {
          this.additions = [];
          this.hasMorePages = false;
        }
      }
    });
  }

  nextPage(): void {
    this.currentPage++;
    this.loadAdditions();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAdditions();
    }
  }

  openCreateModal(): void {
    this.selectedAdditionId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string): void {
    this.selectedAdditionId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedAdditionId = null;
  }

  onAdditionSaved(): void {
    this.loadAdditions();
    if (this.selectedDetail) this.viewDetail(this.selectedDetail.id);
  }

  viewDetail(id: string): void {
    this.loadingDetail = true;
    this.additionService.getAdditionById(id).subscribe({
      next: (res) => {
        this.selectedDetail = res.message as unknown as AdditionDetailResponse;
        this.restockUnits = 1;
        this.restockPrice = this.selectedDetail?.purchasePrice ?? 0;
        this.loadingDetail = false;
      },
      error: () => { this.loadingDetail = false; }
    });
  }

  clearDetail(): void {
    this.selectedDetail = null;
  }

  restock(): void {
    if (!this.selectedDetail || this.restocking) return;
    if (this.restockUnits < 1) {
      this.notificationService.showError('Las unidades deben ser mayor a 0');
      return;
    }
    if (this.restockPrice <= 0) {
      this.notificationService.showError('El precio de compra debe ser mayor a 0');
      return;
    }

    this.restocking = true;
    this.additionService.addStock(this.selectedDetail.id, {
      unit: this.restockUnits,
      purchasePrice: this.restockPrice
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess(`+${this.restockUnits} unidades añadidas`);
        this.restocking = false;
        this.loadAdditions();
        this.viewDetail(this.selectedDetail!.id);
      },
      error: () => { this.restocking = false; }
    });
  }

  deleteAddition(id: string): void {
    if (confirm('¿Está seguro de eliminar esta adición?')) {
      this.additionService.deleteAddition(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Adición eliminada exitosamente');
            if (this.selectedDetail?.id === id) this.selectedDetail = null;
            this.loadAdditions();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar la adición');
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
