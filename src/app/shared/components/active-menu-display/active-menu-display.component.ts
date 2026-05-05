import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActiveMenuDTO, PublicationSectionDTO, SectionOptionDTO, MenuTimeSlot } from '@features/inventory/models/menu.model';

@Component({
  selector: 'app-active-menu-display',
  templateUrl: './active-menu-display.component.html',
  styleUrls: ['./active-menu-display.component.scss']
})
export class ActiveMenuDisplayComponent {
  @Input() menu: ActiveMenuDTO | null = null;
  @Input() loading = false;
  @Input() showAddToCart = false;
  @Output() addToCart = new EventEmitter<SectionOptionDTO>();

  getTimeSlotLabel(slot: MenuTimeSlot): string {
    return { LUNCH: 'Almuerzo', DINNER: 'Cena', ALL_DAY: 'Todo el día' }[slot];
  }

  getTimeSlotIcon(slot: MenuTimeSlot): string {
    return { LUNCH: 'wb_sunny', DINNER: 'nights_stay', ALL_DAY: 'schedule' }[slot];
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  onAddToCart(option: SectionOptionDTO): void {
    this.addToCart.emit(option);
  }
}
