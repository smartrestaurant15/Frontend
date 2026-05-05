import { Pipe, PipeTransform } from '@angular/core';
import { MenuPublicationSummaryDTO, MenuStatus } from '../models/menu.model';

@Pipe({ name: 'countByStatus' })
export class CountByStatusPipe implements PipeTransform {
  transform(publications: MenuPublicationSummaryDTO[], status: MenuStatus | 'ALL'): number {
    if (!publications || status === 'ALL') return publications?.length || 0;
    return publications.filter(p => p.status === status).length;
  }
}
