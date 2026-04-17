import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '@core/services/notification.service';
import { CategoryResponse } from '../../models/category.model';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-category-form-modal',
  templateUrl: './category-form-modal.component.html',
  styleUrls: ['./category-form-modal.component.scss']
})
export class CategoryFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() categoryId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() categorySaved = new EventEmitter<void>();

  categoryForm!: FormGroup;
  loading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId'] && changes['categoryId'].currentValue) {
      this.isEditMode = true;
      this.loadCategory(changes['categoryId'].currentValue);
    } else if (changes['categoryId'] && !changes['categoryId'].currentValue && changes['categoryId'].previousValue) {
      // Reset cuando se cambia de editar a crear
      this.isEditMode = false;
      this.categoryForm?.reset();
    }
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100), CustomValidators.noWhitespace()]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500), CustomValidators.noWhitespace()]]
    });
  }

  loadCategory(id: string): void {
    this.loading = true;
    this.categoryService.getCategoryById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const category = response.message as CategoryResponse;
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description
          });
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la categoría');
        this.close();
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.loading = true;
      const formData = this.categoryForm.value;

      if (this.isEditMode && this.categoryId) {
        // Actualizar categoría
        this.categoryService.updateCategory(this.categoryId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Categoría actualizada exitosamente');
              this.categorySaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar la categoría');
          }
        });
      } else {
        // Crear categoría
        this.categoryService.createCategory(formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Categoría creada exitosamente');
              this.categorySaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear la categoría');
          }
        });
      }
    } else {
      this.categoryForm.markAllAsTouched();
    }
  }

  close(): void {
    this.categoryForm.reset();
    this.closeModal.emit();
  }

  get name() {
    return this.categoryForm.get('name');
  }

  get description() {
    return this.categoryForm.get('description');
  }
}
