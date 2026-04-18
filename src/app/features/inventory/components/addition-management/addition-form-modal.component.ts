import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdditionService } from '../../services/addition.service';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '@core/services/notification.service';
import { AdditionDetailResponse } from '../../models/addition.model';

@Component({
  selector: 'app-addition-form-modal',
  templateUrl: './addition-form-modal.component.html',
  styleUrls: ['./addition-form-modal.component.scss']
})
export class AdditionFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() additionId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() additionSaved = new EventEmitter<void>();

  additionForm!: FormGroup;
  uploadedPhotos: string[] = [];
  loading = false;
  uploadingImage = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private additionService: AdditionService,
    private imageService: ImageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['additionId'] && changes['additionId'].currentValue) {
      this.isEditMode = true;
      this.loadAddition(changes['additionId'].currentValue);
    } else if (changes['additionId'] && !changes['additionId'].currentValue && changes['additionId'].previousValue) {
      // Reset cuando se cambia de editar a crear
      this.isEditMode = false;
      this.additionForm?.reset();
      this.uploadedPhotos = [];
    }
  }

  initForm(): void {
    this.additionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      units: [0, [Validators.required, Validators.min(0)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadAddition(id: string): void {
    this.loading = true;
    this.additionService.getAdditionById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const addition = response.message as AdditionDetailResponse;
          this.additionForm.patchValue({
            name: addition.name,
            description: addition.description,
            price: addition.price,
            units: addition.units,
            minimumStock: addition.minimumStock
          });
          this.uploadedPhotos = addition.photos || [];
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la adición');
        this.close();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (this.uploadedPhotos.length >= 10) {
        this.notificationService.showError('Máximo 10 fotos permitidas');
        return;
      }
      this.uploadImage(input.files[0]);
    }
  }

  uploadImage(file: File): void {
    this.uploadingImage = true;
    this.imageService.uploadImage(file).subscribe({
      next: (response) => {
        this.uploadingImage = false;
        if (!response.error) {
          const imageData = response.message as { url: string };
          this.uploadedPhotos.push(imageData.url);
          this.notificationService.showSuccess('Imagen subida exitosamente');
        } else {
          this.notificationService.showError('Error al subir la imagen');
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.notificationService.showError('Error al subir la imagen');
      }
    });
  }

  removePhoto(index: number): void {
    this.uploadedPhotos.splice(index, 1);
  }

  onSubmit(): void {
    if (this.additionForm.valid) {
      this.loading = true;
      const formData = this.additionForm.value;

      if (this.isEditMode && this.additionId) {
        // Actualizar adición
        this.additionService.updateAddition(this.additionId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Adición actualizada exitosamente');
              this.additionSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar la adición');
          }
        });
      } else {
        // Crear adición
        this.additionService.createAddition(formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Adición creada exitosamente');
              this.additionSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear la adición');
          }
        });
      }
    } else {
      this.additionForm.markAllAsTouched();
    }
  }

  close(): void {
    this.additionForm.reset();
    this.uploadedPhotos = [];
    this.closeModal.emit();
  }

  get name() {
    return this.additionForm.get('name');
  }

  get description() {
    return this.additionForm.get('description');
  }

  get price() {
    return this.additionForm.get('price');
  }

  get units() {
    return this.additionForm.get('units');
  }

  get minimumStock() {
    return this.additionForm.get('minimumStock');
  }
}
