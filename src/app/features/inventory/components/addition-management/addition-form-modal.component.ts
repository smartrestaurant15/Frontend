import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl
} from '@angular/forms';
import { AdditionService } from '../../services/addition.service';
import { ImageService } from '../../services/image.service';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { AdditionDetailResponse, AdditionType } from '../../models/addition.model';
import { ProductListResponse } from '../../models/product.model';

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
  products: ProductListResponse[] = [];
  uploadedPhotos: string[] = [];
  loading = false;
  uploadingImage = false;
  isEditMode = false;

  readonly UNITS_OPTIONS = ['g', 'ml', 'oz', 'kg', 'L', 'unidad'];

  constructor(
    private fb: FormBuilder,
    private additionService: AdditionService,
    private imageService: ImageService,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['additionId'] && changes['additionId'].currentValue) {
      this.isEditMode = true;
      this.loadAddition(changes['additionId'].currentValue);
    } else if (changes['additionId'] && !changes['additionId'].currentValue && changes['additionId'].previousValue) {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  get isPrepared(): boolean {
    return this.additionForm?.get('additionType')?.value === 'PREPARED';
  }

  get recipes(): FormArray {
    return this.additionForm.get('recipes') as FormArray;
  }

  initForm(): void {
    this.additionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      additionType: ['SIMPLE', [Validators.required]],
      purchasePrice: [0, [Validators.required, Validators.min(0.01)]],
      salePrice: [0, [Validators.required, Validators.min(0.01)]],
      units: [0, [Validators.required, Validators.min(1)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      recipes: this.fb.array([])
    });

    this.additionForm.get('additionType')?.valueChanges.subscribe((type: AdditionType) => {
      this.syncValidatorsByType(type);
    });
  }

  private syncValidatorsByType(type: AdditionType): void {
    const purchasePrice = this.additionForm.get('purchasePrice')!;
    const units = this.additionForm.get('units')!;
    const minimumStock = this.additionForm.get('minimumStock')!;

    if (type === 'SIMPLE') {
      purchasePrice.setValidators([Validators.required, Validators.min(0.01)]);
      units.setValidators([Validators.required, Validators.min(1)]);
      minimumStock.setValidators([Validators.required, Validators.min(0)]);
    } else {
      purchasePrice.clearValidators();
      units.clearValidators();
      minimumStock.clearValidators();
    }

    purchasePrice.updateValueAndValidity();
    units.updateValueAndValidity();
    minimumStock.updateValueAndValidity();
  }

  loadProducts(): void {
    this.productService.getProducts(0).subscribe({
      next: (response) => {
        if (!response.error) {
          this.products = (response.message as ProductListResponse[])
            .filter(p => p.state === 'ACTIVE');
        }
      },
      error: () => this.notificationService.showError('Error al cargar los ingredientes')
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
            additionType: addition.additionType,
            purchasePrice: addition.purchasePrice ?? 0,
            salePrice: addition.salePrice,
            units: addition.units,
            minimumStock: addition.minimumStock
          });

          this.uploadedPhotos = addition.photos || [];

          if (addition.additionType === 'PREPARED' && addition.recipes?.length) {
            addition.recipes.forEach(r => {
              this.recipes.push(this.createRecipeGroup(r.productId, r.weight, r.unit));
            });
          }

          this.syncValidatorsByType(addition.additionType);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la adición');
        this.close();
      }
    });
  }

  // ——— Gestión de recetas ———

  createRecipeGroup(productId = '', weight = 0, unit = 'g'): FormGroup {
    return this.fb.group({
      productId: [productId, Validators.required],
      weight: [weight, [Validators.required, Validators.min(0.01)]],
      unit: [unit, Validators.required]
    });
  }

  addRecipe(): void {
    this.recipes.push(this.createRecipeGroup());
  }

  removeRecipe(index: number): void {
    this.recipes.removeAt(index);
  }

  getRecipeControl(index: number, field: string): AbstractControl {
    return this.recipes.at(index).get(field)!;
  }

  // ——— Gestión de fotos ———

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (this.uploadedPhotos.length >= 5) {
        this.notificationService.showError('Máximo 5 fotos permitidas');
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

  // ——— Envío ———

  onSubmit(): void {
    if (this.isPrepared && this.recipes.length === 0) {
      this.notificationService.showError('Las adiciones preparadas requieren al menos un ingrediente');
      return;
    }

    if (this.additionForm.valid && this.uploadedPhotos.length > 0) {
      this.loading = true;
      this.save();
    } else {
      if (this.uploadedPhotos.length === 0) {
        this.notificationService.showError('Debe subir al menos una foto');
      }
      this.additionForm.markAllAsTouched();
    }
  }

  private save(): void {
    const formValue = this.additionForm.value;

    if (this.isEditMode && this.additionId) {
      const updateDTO = {
        name: formValue.name,
        description: formValue.description,
        salePrice: formValue.salePrice,
        photos: this.uploadedPhotos,
        ...(this.isPrepared
          ? { recipes: formValue.recipes }
          : {
              units: formValue.units,
              minimumStock: formValue.minimumStock
            })
      };

      this.additionService.updateAddition(this.additionId, updateDTO).subscribe({
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
      const createDTO = {
        name: formValue.name,
        description: formValue.description,
        additionType: formValue.additionType,
        salePrice: formValue.salePrice,
        photos: this.uploadedPhotos,
        ...(this.isPrepared
          ? { recipes: formValue.recipes }
          : {
              purchasePrice: formValue.purchasePrice,
              units: formValue.units,
              minimumStock: formValue.minimumStock
            })
      };

      this.additionService.createAddition(createDTO).subscribe({
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
  }

  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  private resetForm(): void {
    this.additionForm?.reset({ additionType: 'SIMPLE' });
    this.recipes?.clear();
    this.uploadedPhotos = [];
    this.isEditMode = false;
  }

  // ——— Getters para validación en template ———

  get name() { return this.additionForm.get('name'); }
  get description() { return this.additionForm.get('description'); }
  get salePrice() { return this.additionForm.get('salePrice'); }
  get purchasePrice() { return this.additionForm.get('purchasePrice'); }
  get units() { return this.additionForm.get('units'); }
  get minimumStock() { return this.additionForm.get('minimumStock'); }
}
