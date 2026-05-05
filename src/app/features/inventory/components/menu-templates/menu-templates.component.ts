import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuTemplateService } from '../../services/menu-template.service';
import { NotificationService } from '@core/services/notification.service';
import { CreateMenuTemplateRequest, MenuTemplateDTO } from '../../models/menu.model';

@Component({
  selector: 'app-menu-templates',
  templateUrl: './menu-templates.component.html',
  styleUrls: ['./menu-templates.component.scss']
})
export class MenuTemplatesComponent implements OnInit {
  templates: MenuTemplateDTO[] = [];
  loading = false;
  isCreateModalOpen = false;
  saving = false;
  templateForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private templateService: MenuTemplateService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void { this.loadTemplates(); }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getAll().subscribe({
      next: (res) => { this.templates = Array.isArray(res.message) ? res.message : []; this.loading = false; },
      error: () => { this.loading = false; this.notificationService.showError('Error al cargar plantillas'); }
    });
  }

  openCreateModal(): void {
    this.templateForm = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      sections:    this.fb.array([this.createSectionGroup(0)])
    });
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void { this.isCreateModalOpen = false; this.saving = false; }

  createSectionGroup(order: number): FormGroup {
    return this.fb.group({
      name:          ['', [Validators.required, Validators.maxLength(100)]],
      description:   ['', Validators.maxLength(300)],
      required:      [true],
      maxSelections: [1, [Validators.required, Validators.min(1)]],
      displayOrder:  [order]
    });
  }

  get sections(): FormArray { return this.templateForm.get('sections') as FormArray; }

  addSection(): void { this.sections.push(this.createSectionGroup(this.sections.length)); }

  removeSection(i: number): void { if (this.sections.length > 1) this.sections.removeAt(i); }

  submitCreate(): void {
    if (this.templateForm.invalid) { this.templateForm.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.templateForm.value;
    const request: CreateMenuTemplateRequest = { name: v.name, description: v.description, sections: v.sections };
    this.templateService.create(request).subscribe({
      next: (res) => {
        if (!res.error) {
          this.notificationService.showSuccess('Plantilla creada');
          this.closeCreateModal(); this.loadTemplates();
        } else { this.notificationService.showError(res.message as string); this.saving = false; }
      },
      error: () => { this.notificationService.showError('Error al crear plantilla'); this.saving = false; }
    });
  }

  deleteTemplate(id: string): void {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    this.templateService.delete(id).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Plantilla eliminada'); this.loadTemplates(); }
        else { this.notificationService.showError(res.message as string); }
      },
      error: () => this.notificationService.showError('Error al eliminar')
    });
  }

  goBack(): void { this.router.navigate(['../daily-menu'], { relativeTo: this.route }); }
}
