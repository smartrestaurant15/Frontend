import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuplierService } from '../../services/suplier.service';
import { NotificationService } from '@core/services/notification.service';
import { SuplierResponse } from '../../models/suplier.model';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-supplier-form-modal',
  templateUrl: './supplier-form-modal.component.html',
  styleUrls: ['./supplier-form-modal.component.scss']
})
export class SupplierFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() supplierId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() supplierSaved = new EventEmitter<void>();

  supplierForm!: FormGroup;
  loading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private suplierService: SuplierService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supplierId'] && changes['supplierId'].currentValue) {
      this.isEditMode = true;
      this.loadSupplier(changes['supplierId'].currentValue);
    } else if (changes['supplierId'] && !changes['supplierId'].currentValue && changes['supplierId'].previousValue) {
      // Reset cuando se cambia de editar a crear
      this.isEditMode = false;
      this.supplierForm?.reset();
    }
  }

  initForm(): void {
    this.supplierForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50), CustomValidators.noWhitespace()]],
      address: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50), CustomValidators.noWhitespace()]],
      phone:   ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^\d{10}$/)]],
      email:   ['', [Validators.required, Validators.email, Validators.maxLength(50)]]
    });
  }

  loadSupplier(id: string): void {
    this.loading = true;
    this.suplierService.getSuplierById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const supplier = response.message as SuplierResponse;
          this.supplierForm.patchValue({
            name: supplier.name,
            address: supplier.address,
            phone: supplier.phone,
            email: supplier.email
          });
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar el proveedor');
        this.close();
      }
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      this.loading = true;
      const formData = this.supplierForm.value;

      if (this.isEditMode && this.supplierId) {
        // Actualizar proveedor
        this.suplierService.updateSuplier(this.supplierId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Proveedor actualizado exitosamente');
              this.supplierSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar el proveedor');
          }
        });
      } else {
        // Crear proveedor
        this.suplierService.createSuplier(formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Proveedor creado exitosamente');
              this.supplierSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear el proveedor');
          }
        });
      }
    } else {
      this.supplierForm.markAllAsTouched();
    }
  }

  close(): void {
    this.supplierForm.reset();
    this.closeModal.emit();
  }

  get name() {
    return this.supplierForm.get('name');
  }

  get address() {
    return this.supplierForm.get('address');
  }

  get phone() {
    return this.supplierForm.get('phone');
  }

  get email() {
    return this.supplierForm.get('email');
  }
}
