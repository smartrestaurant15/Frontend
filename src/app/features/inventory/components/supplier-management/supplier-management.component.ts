import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SuplierService } from '../../services/suplier.service';
import { SuplierResponse } from '../../models/suplier.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-supplier-management',
  templateUrl: './supplier-management.component.html',
  styleUrls: ['./supplier-management.component.scss']
})
export class SupplierManagementComponent implements OnInit {
  suppliers: SuplierResponse[] = [];
  loading = false;
  isModalOpen = false;
  selectedSupplierId: string | null = null;

  constructor(
    private suplierService: SuplierService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadSuppliers(): void {
    this.loading = true;
    this.suplierService.getAllSupliers().subscribe({
      next: (response) => {
        if (!response.error) {
          const data = response.message as any;
          this.suppliers = Array.isArray(data) ? data : [];
        } else {
          this.suppliers = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar los proveedores');
        } else {
          this.suppliers = [];
        }
      }
    });
  }

  openCreateModal(): void {
    this.selectedSupplierId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string): void {
    this.selectedSupplierId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSupplierId = null;
  }

  onSupplierSaved(): void {
    this.loadSuppliers();
  }

  deleteSupplier(id: string): void {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      this.suplierService.deleteSuplier(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Proveedor eliminado exitosamente');
            this.loadSuppliers();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar el proveedor');
        }
      });
    }
  }
}
