
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

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  estimatedHours: number;
  order: number;
  isArchived: boolean;
  createdDate: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  hourlyRate: number;
  currency: Currency;
  status: ProjectStatus;
  category?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  budget?: number;
  tasks?: ProjectTask[];
  milestones?: ProjectMilestone[];
  templateId?: string;
  phases?: ProjectPhase[];
}

export interface TimeEntry {
  id: string;
  projectId: string;
  phaseId?: string; // Optional phase assignment
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
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  defaultHourlyRate: number;
  defaultCurrency: Currency;
  category: string;
  tags: string[];
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  isCompleted: boolean;
  dueDate?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  completedDate?: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  subject: string;
  content: string;
  createdBy: string;
}

export interface PhaseAnalytics {
  phaseId: string;
  phaseName: string;
  estimatedHours: number;
  actualHours: number;
  billableHours: number;
  completionPercentage: number;
  revenue: number;
}

export interface ProjectAnalytics {
  projectId: string;
  totalHours: number;
  billableHours: number;
  totalRevenue: number;
  profitMargin: number;
  averageHourlyRate: number;
  completionPercentage: number;
  phaseAnalytics?: PhaseAnalytics[];
}

export interface TimeReport {
  period: string;
  totalHours: number;
  billableHours: number;
  byProject: { [projectId: string]: number };
  byClient: { [clientId: string]: number };
  byDate: { [date: string]: number };
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  byCurrency: { [currency: string]: number };
  byProject: { [projectId: string]: number };
  byClient: { [clientId: string]: number };
  trend: { date: string; amount: number }[];
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  isBusinessExpense: boolean;
  projectId?: string;
  phaseId?: string;
  status: ExpenseStatus;
  submittedDate?: string;
  approvedDate?: string;
  reimbursedDate?: string;
  rejectedDate?: string;
  rejectReason?: string;
  markupPercentage?: number;
  receipts: ExpenseReceipt[];
  tags: string[];
  notes?: string;
  vendor?: string;
  templateId?: string;
  aiSuggested?: boolean;
  statusHistory: ExpenseStatusChange[];
}

export interface ExpenseReceipt {
  id: string;
  expenseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  url?: string;
  ocrData?: ExpenseOCRData;
}

export interface ExpenseOCRData {
  extractedText: string;
  extractedAmount?: number;
  extractedVendor?: string;
  extractedDate?: string;
  confidence: number;
}

export interface ExpenseStatusChange {
  id: string;
  expenseId: string;
  fromStatus: ExpenseStatus;
  toStatus: ExpenseStatus;
  changeDate: string;
  changeReason?: string;
  changedBy: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  description: string;
  category: ExpenseCategory;
  defaultAmount?: number;
  currency: Currency;
  projectId?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  tags: string[];
}

export interface ExpenseReport {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  projectId?: string;
  clientId?: string;
  expenseIds: string[];
  totalAmount: number;
  currency: Currency;
  status: 'draft' | 'submitted' | 'approved' | 'reimbursed';
  submittedDate?: string;
  approvedDate?: string;
  notes?: string;
}

export enum ExpenseStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Reimbursed = 'Reimbursed',
  Rejected = 'Rejected'
}

export enum ExpenseCategory {
  Software = 'Software',
  Hardware = 'Hardware',
  Travel = 'Travel',
  Meals = 'Meals',
  Office = 'Office',
  Marketing = 'Marketing',
  Education = 'Education',
  Internet = 'Internet',
  Phone = 'Phone',
  Utilities = 'Utilities',
  Materials = 'Materials',
  Equipment = 'Equipment',
  Professional = 'Professional',
  Subscriptions = 'Subscriptions',
  Other = 'Other'
}

export interface Contract {
  id: string;
  clientId: string;
  projectId?: string;
  contractType: ContractType;
  title: string;
  content: string;
  status: ContractStatus;
  createdDate: string;
  signedDate?: string;
  expiryDate?: string;
  value?: number;
  currency?: Currency;
}

export enum ContractType {
  ServiceAgreement = 'Service Agreement',
  ProjectContract = 'Project Contract',
  RetainerAgreement = 'Retainer Agreement',
  NDA = 'Non-Disclosure Agreement',
  MaintenanceContract = 'Maintenance Contract'
}

export enum ContractStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Signed = 'Signed',
  Expired = 'Expired'
}

export interface BusinessInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  actionable: boolean;
  data: any;
  generatedDate: string;
}

export enum InsightType {
  Revenue = 'Revenue',
  Productivity = 'Productivity',
  ClientBehavior = 'Client Behavior',
  Pricing = 'Pricing',
  TimeManagement = 'Time Management'
}

export interface PricingSuggestion {
  projectType: string;
  suggestedHourlyRate: number;
  suggestedFixedPrice?: number;
  confidence: number;
  reasoning: string;
  basedOnProjects: string[];
}

export type View = 'dashboard' | 'clients-projects' | 'time-entries' | 'invoicing' | 'ai-assistant' | 'settings' | 'reports';