import { Component, OnInit } from '@angular/core';
import { InventoryMovementService } from '../../services/inventory-movement.service';
import { InventoryMovementResponse } from '../../models/inventory-movement.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-inventory-movements',
  templateUrl: './inventory-movements.component.html',
  styleUrls: ['./inventory-movements.component.scss']
})
export class InventoryMovementsComponent implements OnInit {
  movements: InventoryMovementResponse[] = [];
  filteredMovements: InventoryMovementResponse[] = [];
  loading = false;
  searchTerm = '';
  filterType: 'ALL' | 'ENTRY' | 'EXIT' = 'ALL';

  constructor(
    private movementService: InventoryMovementService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.movementService.getAllMovements().subscribe({
      next: (response) => {
        if (!response.error && Array.isArray(response.message)) {
          this.movements = response.message;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        this.notificationService.showError('Error al cargar movimientos de inventario');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredMovements = this.movements.filter(movement => {
      const matchesSearch = !this.searchTerm ||
        movement.productId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (movement.productName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        movement.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        movement.reason.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = this.filterType === 'ALL' || movement.type === this.filterType;
      
      return matchesSearch && matchesType;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterTypeChange(type: 'ALL' | 'ENTRY' | 'EXIT'): void {
    this.filterType = type;
    this.applyFilters();
  }

  getTypeLabel(type: string): string {
    return type === 'ENTRY' ? 'Entrada' : 'Salida';
  }

  getTypeClass(type: string): string {
    return type === 'ENTRY' ? 'badge-entry' : 'badge-exit';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
