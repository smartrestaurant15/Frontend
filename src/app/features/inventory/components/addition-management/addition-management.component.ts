import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdditionService } from '../../services/addition.service';
import { AdditionResponse } from '../../models/addition.model';
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
  }

  deleteAddition(id: string): void {
    if (confirm('¿Está seguro de eliminar esta adición?')) {
      this.additionService.deleteAddition(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Adición eliminada exitosamente');
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
