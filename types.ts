
export enum ProjectStatus {
  Active = 'Active',
  Archived = 'Archived',
}

export enum InvoiceStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Paid = 'Paid',
  Overdue = 'Overdue',
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  billingAddress: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  hourlyRate: number;
  currency: string;
  status: ProjectStatus;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  description: string;
  hours: number;
  isBillable: boolean;
  invoiceId: string | null;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  timeEntryIds: string[];
}

export interface BillerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export type View = 'dashboard' | 'clients-projects' | 'time-entries' | 'invoicing' | 'ai-assistant' | 'settings';