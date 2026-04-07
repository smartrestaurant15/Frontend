import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { CategoryResponse } from '../../models/category.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: CategoryResponse[] = [];
  loading = false;
  isModalOpen = false;
  selectedCategoryId: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (!response.error) {
          const data = response.message as any;
          this.categories = Array.isArray(data) ? data : [];
        } else {
          this.categories = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar las categorías');
        } else {
          this.categories = [];
        }
      }
    });
  }

  openCreateModal(): void {
    this.selectedCategoryId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string): void {
    this.selectedCategoryId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCategoryId = null;
  }

  onCategorySaved(): void {
    this.loadCategories();
  }

  deleteCategory(id: string): void {
    if (confirm('¿Está seguro de eliminar esta categoría?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Categoría eliminada exitosamente');
            this.loadCategories();
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: (error) => {
          this.notificationService.showError('Error al eliminar la categoría');
        }
      });
    }
  }
}
