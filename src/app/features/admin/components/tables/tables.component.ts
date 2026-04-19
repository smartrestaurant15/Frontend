import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableService } from '../../services/table.service';
import { RestaurantTable, TableStatus } from '../../models/table.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  tables: RestaurantTable[] = [];
  loading = false;
  filterStatus: TableStatus | '' = '';

  // Modal state
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedTable: RestaurantTable | null = null;
  submitting = false;

  form!: FormGroup;

  readonly statuses: { value: TableStatus; label: string; color: string }[] = [
    { value: 'FREE',     label: 'Libre',    color: 'text-green-400'  },
    { value: 'OCCUPIED', label: 'Ocupada',  color: 'text-red-400'    },
    { value: 'RESERVED', label: 'Reservada',color: 'text-amber-400'  },
  ];

  constructor(
    private tableService: TableService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTables();
  }

  initForm(): void {
    this.form = this.fb.group({
      number:   [null, [Validators.required, Validators.min(1)]],
      capacity: [null, [Validators.required, Validators.min(1)]],
      location: ['']
    });
  }

  loadTables(): void {
    this.loading = true;
    const status = this.filterStatus || undefined;
    this.tableService.getAll(status as TableStatus).subscribe({
      next: (tables) => { this.tables = tables; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filteredTables(): RestaurantTable[] {
    return this.tables;
  }

  get statusCounts() {
    return {
      free:     this.tables.filter(t => t.status === 'FREE').length,
      occupied: this.tables.filter(t => t.status === 'OCCUPIED').length,
      reserved: this.tables.filter(t => t.status === 'RESERVED').length,
    };
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.selectedTable = null;
    this.form.reset();
    this.form.get('number')?.enable();
    this.modalOpen = true;
  }

  openEdit(table: RestaurantTable): void {
    this.modalMode = 'edit';
    this.selectedTable = table;
    this.form.patchValue({
      number:   table.number,
      capacity: table.capacity,
      location: table.location ?? ''
    });
    this.form.get('number')?.disable();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedTable = null;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const val = this.form.getRawValue();

    if (this.modalMode === 'create') {
      this.tableService.create({ number: val.number, capacity: val.capacity, location: val.location || undefined })
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Mesa creada exitosamente');
            this.closeModal();
            this.loadTables();
            this.submitting = false;
          },
          error: () => { this.submitting = false; }
        });
    } else if (this.selectedTable) {
      this.tableService.update(this.selectedTable.id, { capacity: val.capacity, location: val.location || undefined })
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Mesa actualizada exitosamente');
            this.closeModal();
            this.loadTables();
            this.submitting = false;
          },
          error: () => { this.submitting = false; }
        });
    }
  }

  changeStatus(table: RestaurantTable, status: TableStatus): void {
    if (table.status === status) return;
    this.tableService.changeStatus(table.id, status).subscribe({
      next: (updated) => {
        // Actualizar localmente el objeto en el array para que el select se refresque
        const idx = this.tables.findIndex(t => t.id === table.id);
        if (idx !== -1) this.tables[idx] = { ...this.tables[idx], status: updated.status };
        this.notificationService.showSuccess(`Mesa ${table.number} → ${this.statusLabel(status)}`);
      }
    });
  }

  deactivate(table: RestaurantTable): void {
    if (!confirm(`¿Desactivar la mesa ${table.number}? No se puede desactivar si está ocupada.`)) return;
    this.tableService.deactivate(table.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(`Mesa ${table.number} desactivada`);
        this.loadTables();
      }
    });
  }

  statusLabel(s: TableStatus): string {
    return this.statuses.find(x => x.value === s)?.label ?? s;
  }

  statusColor(s: TableStatus): string {
    return this.statuses.find(x => x.value === s)?.color ?? '';
  }

  statusBg(s: TableStatus): string {
    const map: Record<TableStatus, string> = {
      FREE:     'border-green-500/40 bg-green-950/20',
      OCCUPIED: 'border-red-500/40 bg-red-950/20',
      RESERVED: 'border-amber-500/40 bg-amber-950/20',
    };
    return map[s] ?? '';
  }
}
