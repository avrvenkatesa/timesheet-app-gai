
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

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
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
  currency: Currency;
  status: ProjectStatus;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  description: string;
  hours: number;
  startTime?: string; // HH:MM format
  stopTime?: string; // HH:MM format
  isBillable: boolean;
  invoiceId: string | null;
}

export enum RecurringFrequency {
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly',
  BiWeekly = 'BiWeekly',
  Weekly = 'Weekly',
}

export enum PaymentStatus {
  Unpaid = 'Unpaid',
  PartiallyPaid = 'PartiallyPaid',
  Paid = 'Paid',
  Overdue = 'Overdue',
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: Currency;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export interface RecurringInvoiceTemplate {
  id: string;
  clientId: string;
  templateName: string;
  frequency: RecurringFrequency;
  nextGenerationDate: string;
  lastGeneratedDate?: string;
  isActive: boolean;
  hourlyRate: number;
  currency: Currency;
  estimatedHours: number;
  description: string;
  daysUntilDue: number;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  reminderDate: string;
  reminderType: 'FirstReminder' | 'SecondReminder' | 'FinalNotice';
  sent: boolean;
}

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  lastUpdated: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  timeEntryIds: string[];
  totalAmount: number;
  currency: Currency;
  paidAmount: number;
  isRecurring: boolean;
  recurringTemplateId?: string;
  notes?: string;
}

export interface BillerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export type View = 'dashboard' | 'clients-projects' | 'time-entries' | 'invoicing' | 'ai-assistant' | 'settings';