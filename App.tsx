import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import type { Client, Project, TimeEntry, Invoice, BillerInfo, View, Payment, RecurringInvoiceTemplate, InvoiceReminder, ExchangeRate, ProjectTemplate, ClientNote, ProjectMilestone } from './types';
import { ProjectStatus, InvoiceStatus, Currency } from './types';
import { dataManager, type AppData } from './utils/dataManager';
import Dashboard from './components/Dashboard';
import ClientsProjects from './components/ClientsProjects';
import TimeEntries from './components/TimeEntries';
import Invoicing from './components/Invoicing';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import Reports from './components/Reports';
import SyncNotification from './components/SyncNotification';
import { ToastProvider } from './components/ui/Toast';

// --- HELPERS ---
const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;

// --- PRODUCTION DATA ---
const getInitialData = () => {
    const initialClients: Client[] = [];
    const initialProjects: Project[] = [];
    const initialTimeEntries: TimeEntry[] = [];
    const initialInvoices: Invoice[] = [];

    const initialBillerInfo: BillerInfo = {
        name: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        bankName: '',
        branchName: '',
        accountName: '',
        accountNumber: '',
        accountType: '',
        ifscCode: ''
    };

    return { initialClients, initialProjects, initialTimeEntries, initialInvoices, initialBillerInfo };
};


// --- LOCAL STORAGE HOOK ---
function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


// --- APP CONTEXT ---
interface AppContextType {
    clients: Client[];
    projects: Project[];
    timeEntries: TimeEntry[];
    invoices: Invoice[];
    payments: Payment[];
    recurringTemplates: RecurringInvoiceTemplate[];
    invoiceReminders: InvoiceReminder[];
    exchangeRates: ExchangeRate[];
    billerInfo: BillerInfo;
    syncStatus: 'idle' | 'syncing' | 'error' | 'success';
    lastSyncTime: number | null;
    addClient: (client: Omit<Client, 'id'>) => void;
    updateClient: (client: Client) => void;
    deleteClient: (clientId: string) => void;
    addProject: (project: Omit<Project, 'id'>) => void;
    updateProject: (project: Project) => void;
    deleteProject: (projectId: string) => void;
    addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
    updateTimeEntry: (entry: TimeEntry) => void;
    deleteTimeEntry: (entryId: string) => void;
    createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
    updateInvoice: (invoice: Invoice) => void;
    addPayment: (payment: Omit<Payment, 'id'>) => void;
    removePayment: (paymentId: string) => void;
    addRecurringTemplate: (template: Omit<RecurringInvoiceTemplate, 'id'>) => void;
    updateRecurringTemplate: (template: RecurringInvoiceTemplate) => void;
    deleteRecurringTemplate: (templateId: string) => void;
    generateRecurringInvoices: () => void;
    updateExchangeRate: (rate: ExchangeRate) => void;
    convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
    updateBillerInfo: (info: BillerInfo) => void;
    exportData: () => Promise<string>;
    importData: (jsonString: string, mergeMode?: 'replace' | 'merge') => Promise<{success: boolean; errors: string[]; warnings: string[]}>;
    recoverData: () => Promise<boolean>;
    triggerSync: () => Promise<void>;
    syncData: (snapshot: AppData) => Promise<AppData>;

    // Enhanced Project and Client Management
    projectTemplates: ProjectTemplate[];
    addProjectTemplate: (template: Omit<ProjectTemplate, 'id'>) => void;
    updateProjectTemplate: (template: ProjectTemplate) => void;
    deleteProjectTemplate: (templateId: string) => void;
    clientNotes: ClientNote[];
    addClientNote: (note: Omit<ClientNote, 'id'>) => void;
    updateClientNote: (note: ClientNote) => void;
    deleteClientNote: (noteId: string) => void;
    projectMilestones: ProjectMilestone[];
    addProjectMilestone: (milestone: Omit<ProjectMilestone, 'id'>) => void;
    updateProjectMilestone: (milestone: ProjectMilestone) => void;
    deleteProjectMilestone: (milestoneId: string) => void;

    // Advanced Reporting and Analytics
    getProjectAnalytics: (projectId: string) => any; // Placeholder for analytics data
    generateTimeReport: (projectId?: string) => TimeEntry[]; // Placeholder for report generation
    generateRevenueReport: (clientId?: string) => Invoice[]; // Placeholder for report generation

    // Enhanced AI Assistant Methods
    addContract?: (contract: Omit<Contract, 'id'>) => void;
    addExpense?: (expense: Omit<Expense, 'id'>) => void;
    generateBusinessInsights?: (insights: BusinessInsight[]) => void;
    generatePricingSuggestion?: (suggestion: PricingSuggestion) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

// --- APP PROVIDER ---
const AppProvider = ({ children }: { children: ReactNode }) => {
    const { initialClients, initialProjects, initialTimeEntries, initialInvoices, initialBillerInfo } = getInitialData();
    const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClients);
    const [projects, setProjects] = useLocalStorage<Project[]>('projects', initialProjects);
    const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', initialTimeEntries);
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
    const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);
    const [recurringTemplates, setRecurringTemplates] = useLocalStorage<RecurringInvoiceTemplate[]>('recurringTemplates', []);
    const [invoiceReminders, setInvoiceReminders] = useLocalStorage<InvoiceReminder[]>('invoiceReminders', []);
    const [exchangeRates, setExchangeRates] = useLocalStorage<ExchangeRate[]>('exchangeRates', []);
    const [billerInfo, setBillerInfo] = useLocalStorage<BillerInfo>('billerInfo', initialBillerInfo);

    // New state for enhanced features
    const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
    const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
    const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([]);

    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

    const addClient = (client: Omit<Client, 'id'>) => setClients(prev => [...prev, { ...client, id: generateId() }]);
    const updateClient = (updatedClient: Client) => setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    const deleteClient = (clientId: string) => setClients(prev => prev.filter(c => c.id !== clientId));

    const addProject = (project: Omit<Project, 'id'>) => setProjects(prev => [...prev, { ...project, id: generateId() }]);
    const updateProject = (updatedProject: Project) => setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    const deleteProject = (projectId: string) => setProjects(prev => prev.filter(p => p.id !== projectId));

    const addTimeEntry = (entry: Omit<TimeEntry, 'id'>) => setTimeEntries(prev => [...prev, { ...entry, id: generateId() }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const updateTimeEntry = (updatedEntry: TimeEntry) => setTimeEntries(prev => prev.map(t => t.id === updatedEntry.id ? updatedEntry : t));
    const deleteTimeEntry = (entryId: string) => setTimeEntries(prev => prev.filter(t => t.id !== entryId));

    const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
        const newInvoiceNumber = `INV-${(invoices.length + 1).toString().padStart(4, '0')}`;
        const newInvoice: Invoice = {
            ...invoiceData,
            id: generateId(),
            invoiceNumber: newInvoiceNumber,
        };
        setInvoices(prev => [...prev, newInvoice]);
        setTimeEntries(prev => prev.map(entry => 
            invoiceData.timeEntryIds.includes(entry.id) ? { ...entry, invoiceId: newInvoice.id } : entry
        ));
    };

    const updateInvoice = (updatedInvoice: Invoice) => setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));

    const addPayment = (payment: Omit<Payment, 'id'>) => {
        const newPayment: Payment = { ...payment, id: generateId() };
        setPayments(prev => [...prev, newPayment]);
        setInvoices(prev => prev.map(invoice => 
            invoice.id === newPayment.invoiceId ? { ...invoice, status: InvoiceStatus.Paid } : invoice
        ));
    };
    const removePayment = (paymentId: string) => setPayments(prev => prev.filter(p => p.id !== paymentId));

    const addRecurringTemplate = (template: Omit<RecurringInvoiceTemplate, 'id'>) => {
        const newTemplate: RecurringInvoiceTemplate = { ...template, id: generateId() };
        setRecurringTemplates(prev => [...prev, newTemplate]);
    };
    const updateRecurringTemplate = (template: RecurringInvoiceTemplate) => setRecurringTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    const deleteRecurringTemplate = (templateId: string) => setRecurringTemplates(prev => prev.filter(t => t.id !== templateId));

    const generateRecurringInvoices = () => {
        recurringTemplates.forEach(template => {
            // Logic to check if a new invoice should be generated based on the template's schedule
            // This would involve checking the last generated invoice date and the recurrence pattern
            // For now, a placeholder
            console.log(`Checking recurring template: ${template.name}`);
        });
    };

    const updateExchangeRate = (rate: ExchangeRate) => {
        setExchangeRates(prev => {
            const existingIndex = prev.findIndex(r => r.fromCurrency === rate.fromCurrency && r.toCurrency === rate.toCurrency);
            if (existingIndex > -1) {
                prev[existingIndex] = rate;
                return [...prev];
            } else {
                return [...prev, rate];
            }
        });
    };

    const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
        if (fromCurrency === toCurrency) {
            return amount;
        }
        const rate = exchangeRates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
        if (rate) {
            return amount * rate.rate;
        }
        // Fallback or error handling if rate is not found
        console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
        return amount; // Or throw an error, or use a default rate
    };

    const updateBillerInfo = (info: BillerInfo) => setBillerInfo(info);

    // Enhanced Project and Client Management Methods
    const addProjectTemplate = (template: Omit<ProjectTemplate, 'id'>) => setProjectTemplates(prev => [...prev, { ...template, id: generateId() }]);
    const updateProjectTemplate = (updatedTemplate: ProjectTemplate) => setProjectTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    const deleteProjectTemplate = (templateId: string) => setProjectTemplates(prev => prev.filter(t => t.id !== templateId));

    const addClientNote = (note: Omit<ClientNote, 'id'>) => setClientNotes(prev => [...prev, { ...note, id: generateId() }]);
    const updateClientNote = (updatedNote: ClientNote) => setClientNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    const deleteClientNote = (noteId: string) => setClientNotes(prev => prev.filter(n => n.id !== noteId));

    const addProjectMilestone = (milestone: Omit<ProjectMilestone, 'id'>) => setProjectMilestones(prev => [...prev, { ...milestone, id: generateId() }]);
    const updateProjectMilestone = (updatedMilestone: ProjectMilestone) => setProjectMilestones(prev => prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m));
    const deleteProjectMilestone = (milestoneId: string) => setProjectMilestones(prev => prev.filter(m => m.id !== milestoneId));

    // Advanced Reporting and Analytics Methods
    const getProjectAnalytics = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;
        const projectTimeEntries = timeEntries.filter(entry => entry.projectId === projectId && entry.isBillable);
        const totalHours = projectTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const totalRevenue = projectTimeEntries.reduce((sum, entry) => sum + (entry.hours * project.hourlyRate), 0);
        return {
            ...project,
            totalHours,
            totalRevenue: convertCurrency(totalRevenue, project.currency, Currency.USD), // Example conversion
            numberOfTimeEntries: projectTimeEntries.length,
        };
    };

    const generateTimeReport = (projectId?: string): TimeEntry[] => {
        if (projectId) {
            return timeEntries.filter(entry => entry.projectId === projectId);
        }
        return timeEntries; // Return all time entries if no project is specified
    };

    const generateRevenueReport = (clientId?: string): Invoice[] => {
        if (clientId) {
            const clientProjects = projects.filter(p => p.clientId === clientId);
            const invoiceIdsForClient = timeEntries
                .filter(entry => clientProjects.some(p => p.id === entry.projectId) && entry.invoiceId)
                .map(entry => entry.invoiceId!)
                .filter((value, index, self) => self.indexOf(value) === index); // Unique invoice IDs
            return invoices.filter(invoice => invoiceIdsForClient.includes(invoice.id));
        }
        return invoices; // Return all invoices if no client is specified
    };

    // Enhanced AI Assistant Methods
    const addContract = (contract: Omit<Contract, 'id'>) => {
        // This would be implemented to save contracts to state/storage
        console.log('Contract saved:', contract);
    };

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        // This would be implemented to save expenses to state/storage
        console.log('Expense saved:', expense);
    };

    const generateBusinessInsights = (insights: BusinessInsight[]) => {
        // This would be implemented to save insights to state/storage
        console.log('Business insights generated:', insights);
    };

    const generatePricingSuggestion = (suggestion: PricingSuggestion) => {
        // This would be implemented to save pricing suggestions
        console.log('Pricing suggestion generated:', suggestion);
    };


    // Enhanced data management methods
    const exportData = async (): Promise<string> => {
        const snapshot = await dataManager.createSnapshot(clients, projects, timeEntries, invoices, billerInfo, payments, recurringTemplates, invoiceReminders, exchangeRates);
        return await dataManager.exportData(snapshot);
    };

    const importData = async (jsonString: string, mergeMode: 'replace' | 'merge' = 'merge') => {
        const result = await dataManager.importData(jsonString, mergeMode);

        if (result.success && result.data) {
            if (mergeMode === 'replace') {
                setClients(result.data.clients);
                setProjects(result.data.projects);
                setTimeEntries(result.data.timeEntries);
                setInvoices(result.data.invoices);
                setBillerInfo(result.data.billerInfo);
                setPayments(result.data.payments || []);
                setRecurringTemplates(result.data.recurringTemplates || []);
                setInvoiceReminders(result.data.invoiceReminders || []);
                setExchangeRates(result.data.exchangeRates || []);
                // Handle new data types
                setProjectTemplates(result.data.projectTemplates || []);
                setClientNotes(result.data.clientNotes || []);
                setProjectMilestones(result.data.projectMilestones || []);
            } else {
                // Merge mode - combine data intelligently
                setClients(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const newClients = result.data!.clients.filter(c => !existingIds.has(c.id));
                    return [...prev, ...newClients];
                });

                setProjects(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newProjects = result.data!.projects.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newProjects];
                });

                setTimeEntries(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newEntries = result.data!.timeEntries.filter(t => !existingIds.has(t.id));
                    return [...prev, ...newEntries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });

                setInvoices(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    const newInvoices = result.data!.invoices.filter(i => !existingIds.has(i.id));
                    return [...prev, ...newInvoices];
                });

                setPayments(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPayments = result.data!.payments.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPayments];
                });

                setRecurringTemplates(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newTemplates = result.data!.recurringTemplates.filter(t => !existingIds.has(t.id));
                    return [...prev, ...newTemplates];
                });
                // Invoice reminders and exchange rates could also be merged similarly

                // Merge new data types
                setProjectTemplates(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newTemplates = result.data!.projectTemplates.filter(t => !existingIds.has(t.id));
                    return [...prev, ...newTemplates];
                });
                setClientNotes(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newNotes = result.data!.clientNotes.filter(n => !existingIds.has(n.id));
                    return [...prev, ...newNotes];
                });
                setProjectMilestones(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMilestones = result.data!.projectMilestones.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newMilestones];
                });
            }
        }

        return result;
    };

    const recoverData = async (): Promise<boolean> => {
        setSyncStatus('syncing');
        try {
            const recoveredData = await dataManager.recoverData();
            if (recoveredData) {
                setClients(recoveredData.clients);
                setProjects(recoveredData.projects);
                setTimeEntries(recoveredData.timeEntries);
                setInvoices(recoveredData.invoices);
                setBillerInfo(recoveredData.billerInfo);
                setPayments(recoveredData.payments || []);
                setRecurringTemplates(recoveredData.recurringTemplates || []);
                setInvoiceReminders(recoveredData.invoiceReminders || []);
                setExchangeRates(recoveredData.exchangeRates || []);
                // Recover new data types
                setProjectTemplates(recoveredData.projectTemplates || []);
                setClientNotes(recoveredData.clientNotes || []);
                setProjectMilestones(recoveredData.projectMilestones || []);
                setSyncStatus('success');
                setLastSyncTime(Date.now());
                return true;
            }
            setSyncStatus('error');
            return false;
        } catch (error) {
            console.error('Data recovery failed:', error);
            setSyncStatus('error');
            return false;
        }
    };

    const triggerSync = async (): Promise<void> => {
        setSyncStatus('syncing');
        try {
            const snapshot = await dataManager.createSnapshot(clients, projects, timeEntries, invoices, billerInfo, payments, recurringTemplates, invoiceReminders, exchangeRates);
            const syncedData = await dataManager.syncData(snapshot);

            // Update state if synced data is different
            if (syncedData.lastModified !== snapshot.lastModified) {
                setClients(syncedData.clients);
                setProjects(syncedData.projects);
                setTimeEntries(syncedData.timeEntries);
                setInvoices(syncedData.invoices);
                setBillerInfo(syncedData.billerInfo);
                setPayments(syncedData.payments || []);
                setRecurringTemplates(syncedData.recurringTemplates || []);
                setInvoiceReminders(syncedData.invoiceReminders || []);
                setExchangeRates(syncedData.exchangeRates || []);
                // Update state for new data types
                setProjectTemplates(syncedData.projectTemplates || []);
                setClientNotes(syncedData.clientNotes || []);
                setProjectMilestones(syncedData.projectMilestones || []);
            }

            setSyncStatus('success');
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error('Sync failed:', error);
            setSyncStatus('error');
        }
    };

    // Placeholder for syncData implementation if it's different from triggerSync logic
    const syncData = async (snapshot: AppData): Promise<AppData> => {
        // This might involve more complex logic, e.g., merging strategies, conflict resolution
        // For now, assume it's similar to triggerSync's data fetching
        console.log("Simulating syncData with snapshot:", snapshot);
        // In a real app, this would fetch remote data and return it
        return snapshot; // Returning the same snapshot as a mock
    };

    // Auto-sync on data changes
    useEffect(() => {
        const autoSync = async () => {
            if (syncStatus !== 'syncing') {
                await triggerSync();
            }
        };

        const debounceTimer = setTimeout(autoSync, 2000); // Debounce for 2 seconds
        return () => clearTimeout(debounceTimer);
    }, [clients, projects, timeEntries, invoices, billerInfo, payments, recurringTemplates, invoiceReminders, exchangeRates]);

    // Initial sync on app load
    useEffect(() => {
        triggerSync();
    }, []);

    const value = {
        clients, projects, timeEntries, invoices, billerInfo, payments, 
        recurringTemplates, invoiceReminders, exchangeRates,
        addClient, updateClient, deleteClient,
        addProject, updateProject, deleteProject,
        addTimeEntry, updateTimeEntry, deleteTimeEntry,
        createInvoice, updateInvoice,
        addPayment, removePayment,
        addRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate,
        generateRecurringInvoices, updateExchangeRate, convertCurrency,
        updateBillerInfo,
        exportData, importData, recoverData, triggerSync, syncData,
        projectTemplates,
        addProjectTemplate,
        updateProjectTemplate,
        deleteProjectTemplate,
        clientNotes,
        addClientNote,
        updateClientNote,
        deleteClientNote,
        projectMilestones,
        addProjectMilestone,
        updateProjectMilestone,
        deleteProjectMilestone,
        getProjectAnalytics,
        generateTimeReport,
        generateRevenueReport,
        // Enhanced AI Assistant methods
        addContract,
        addExpense,
        generateBusinessInsights,
        generatePricingSuggestion,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- ICON COMPONENTS ---
const TimeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const InvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a9 9 0 110 18 9 9 0 010-18zm10 3a1 1 0 011.447.894l.276 1.106A1 1 0 0118.49 9.51l1.106.276a1 1 0 01.894 1.447l.276 1.106a1 1 0 010 1.788l-1.106.276a1 1 0 01-.49 1.491l1.106.276a1 1 0 01-1.447.894l-1.106-.276a1 1 0 00-1.49.49l-.276 1.106a1 1 0 01-1.447.894l-1.106-.276a1 1 0 00-1.49-.49l-.276-1.106a1 1 0 01-1.788 0l-.276-1.106a1 1 0 00-1.49-.49l-1.106.276a1 1 0 01-1.447-.894l.276-1.106A1 1 0 005.51 14.49l-1.106-.276a1 1 0 01-.894-1.447l.276-1.106a1 1 0 00-.49-1.49l-1.106-.276a1 1 0 010-1.788l1.106-.276a1 1 0 00.49-1.49L3.1 6.347a1 1 0 01.894-1.447l1.106.276a1 1 0 001.49-.49l.276-1.106A1 1 0 018 3.01z" /></svg>
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


// --- NAVLINK COMPONENT ---
const NavLink = ({ activeView, targetView, setView, children, icon }: { activeView: View, targetView: View, setView: React.Dispatch<React.SetStateAction<View>>, children: ReactNode, icon: ReactNode }) => {
    const isActive = activeView === targetView;
    const { darkMode } = useTheme();

    return (
        <button
            onClick={() => setView(targetView)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left ${
                isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : darkMode 
                        ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'text-slate-700 hover:bg-primary-100 hover:text-primary-700'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
};

// --- MAIN APP ---
const ThemeContext = createContext<{
    darkMode: boolean;
    toggleDarkMode: () => void;
} | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default function App() {
    const [view, setView] = useState<View>('dashboard');
    const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard setView={setView} />;
            case 'clients-projects':
                return <ClientsProjects />;
            case 'time-entries':
                return <TimeEntries />;
            case 'invoicing':
                return <Invoicing />;
            case 'ai-assistant':
                return <AIAssistant />;
            case 'reports':
                return <Reports />;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard setView={setView} />;
        }
    };

    return (
        <AppProvider>
            <ToastProvider>
                <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
                <div className={`flex h-screen transition-colors duration-200 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-100'}`}>
                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    {/* Sidebar */}
                    <aside className={`
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        fixed lg:static inset-y-0 left-0 z-50 w-64 
                        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} 
                        border-r p-4 flex flex-col transition-transform duration-300 ease-in-out
                    `}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2">
                                <div className="p-2 bg-primary-500 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>ProTracker</h1>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`lg:hidden p-2 rounded-md ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                aria-label="Close sidebar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <nav className="flex flex-col space-y-2 flex-grow">
                            <NavLink activeView={view} targetView="dashboard" setView={setView} icon={<DashboardIcon />}>Dashboard</NavLink>
                            <NavLink activeView={view} targetView="clients-projects" setView={setView} icon={<FolderIcon />}>Clients & Projects</NavLink>
                            <NavLink activeView={view} targetView="time-entries" setView={setView} icon={<TimeIcon />}>Time Entries</NavLink>
                            <NavLink activeView={view} targetView="invoicing" setView={setView} icon={<InvoiceIcon />}>Invoicing</NavLink>
                            <NavLink activeView={view} targetView="ai-assistant" setView={setView} icon={<SparklesIcon />}>AI Assistant</NavLink>

                            <div className={`!mt-auto pt-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'} border-t`}>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left mb-2 ${
                                        darkMode 
                                            ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                                            : 'text-slate-700 hover:bg-primary-100 hover:text-primary-700'
                                    }`}
                                    aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                                >
                                    {darkMode ? (
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                                <NavLink activeView={view} targetView="reports" setView={setView} icon={<DashboardIcon />}>Reports</NavLink> {/* Placeholder Icon */}
                                <NavLink activeView={view} targetView="settings" setView={setView} icon={<SettingsIcon />}>Settings</NavLink>
                            </div>
                        </nav>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Mobile header */}
                        <header className={`lg:hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b px-4 py-3 flex items-center justify-between`}>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className={`p-2 rounded-md ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                aria-label="Open sidebar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>ProTracker</h1>
                            <div className="w-10" /> {/* Spacer for centering */}
                        </header>

                        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                            {renderView()}
                        </main>
                    </div>

                    <SyncNotification />
                </div>
            </ThemeContext.Provider>
            </ToastProvider>
        </AppProvider>
    );
}