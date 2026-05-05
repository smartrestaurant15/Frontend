export type MenuStatus   = 'DRAFT' | 'PUBLISHED' | 'SOLD_OUT' | 'CLOSED';
export type MenuTimeSlot = 'LUNCH' | 'DINNER' | 'ALL_DAY';
export type MenuItemType = 'DISH' | 'DRINK' | 'ADDITION';

// ── Templates ─────────────────────────────────────────────────────────────────

export interface CreateTemplateSectionRequest {
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
  displayOrder: number;
}

export interface CreateMenuTemplateRequest {
  name: string;
  description: string;
  sections: CreateTemplateSectionRequest[];
}

export interface TemplateSectionDTO {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
  displayOrder: number;
}

export interface MenuTemplateDTO {
  id: string;
  name: string;
  description: string;
  sections: TemplateSectionDTO[];
}

// ── Publications ──────────────────────────────────────────────────────────────

export interface CreateMenuPublicationRequest {
  date: string;
  timeSlot: MenuTimeSlot;
  basePrice: number;
  totalPortions: number;
  templateId?: string;
  sections?: AddPublicationSectionRequest[];
}

export interface UpdateMenuPublicationRequest {
  date: string;
  timeSlot: MenuTimeSlot;
  basePrice: number;
  totalPortions: number;
}

export interface AddPublicationSectionRequest {
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
  includedInBasePrice: boolean;
  displayOrder: number;
}

export interface AddSectionOptionRequest {
  itemType: MenuItemType;
  itemId: string;
  maxPortions: number | null;
  additionalCost: number;
}

export interface AdjustPortionsRequest {
  totalPortions: number;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface SectionOptionDTO {
  id: string;
  itemType: MenuItemType;
  itemId: string;
  itemName: string;
  itemPhoto: string | null;
  additionalCost: number;
  maxPortions: number | null;
  availablePortions: number | null;
  active: boolean;
}

export interface PublicationSectionDTO {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
  includedInBasePrice: boolean;
  displayOrder: number;
  options: SectionOptionDTO[];
}

export interface MenuPublicationSummaryDTO {
  id: string;
  date: string;
  timeSlot: MenuTimeSlot;
  basePrice: number;
  totalPortions: number;
  availablePortions: number;
  status: MenuStatus;
  templateName: string | null;
}

export interface MenuPublicationDTO {
  id: string;
  date: string;
  timeSlot: MenuTimeSlot;
  basePrice: number;
  totalPortions: number;
  availablePortions: number;
  status: MenuStatus;
  templateId: string | null;
  templateName: string | null;
  createdAt: string;
  sections: PublicationSectionDTO[];
}

export interface ActiveMenuDTO {
  id: string;
  date: string;
  timeSlot: MenuTimeSlot;
  basePrice: number;
  availablePortions: number;
  sections: PublicationSectionDTO[];
}

// ── Catalog helper ────────────────────────────────────────────────────────────

export interface CatalogItem {
  id: string;
  name: string;
  photo: string | null;
  price: number;
  itemType: MenuItemType;
}
