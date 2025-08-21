
import React, { useState, createContext, useContext, ReactNode } from 'react';
import type { View, Client, Project, TimeEntry, Invoice } from './types';
import { ProjectStatus, InvoiceStatus } from './types';
import Dashboard from './components/Dashboard';
import ClientsProjects from './components/ClientsProjects';
import TimeEntries from './components/TimeEntries';
import Invoicing from './components/Invoicing';

// --- HELPERS ---
const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;

// --- MOCK DATA ---
const getInitialData = () => {
    const client1Id = generateId();
    const client2Id = generateId();
    const project1Id = generateId();
    const project2Id = generateId();
    const project3Id = generateId();

    const initialClients: Client[] = [
        { id: client1Id, name: 'Innovate Corp', contactName: 'Jane Doe', contactEmail: 'jane.doe@innovate.com', billingAddress: '123 Tech Ave, Silicon Valley, CA' },
        { id: client2Id, name: 'Creative Solutions', contactName: 'John Smith', contactEmail: 'john.smith@creative.com', billingAddress: '456 Design Rd, Arts District, NY' },
    ];
    const initialProjects: Project[] = [
        { id: project1Id, clientId: client1Id, name: 'Q3 Marketing Campaign', description: 'Digital marketing strategy and execution.', hourlyRate: 120, currency: 'USD', status: ProjectStatus.Active },
        { id: project2Id, clientId: client1Id, name: 'Website Redesign', description: 'Complete overhaul of the corporate website.', hourlyRate: 150, currency: 'USD', status: ProjectStatus.Active },
        { id: project3Id, clientId: client2Id, name: 'Brand Identity Package', description: 'Logo, style guide, and brand assets.', hourlyRate: 100, currency: 'EUR', status: ProjectStatus.Archived },
    ];
    const initialTimeEntries: TimeEntry[] = [
        { id: generateId(), projectId: project1Id, date: '2023-10-26', description: 'Initial client kickoff meeting and requirement gathering.', hours: 2.5, isBillable: true, invoiceId: null },
        { id: generateId(), projectId: project2Id, date: '2023-10-27', description: 'Wireframing for the new homepage.', hours: 6, isBillable: true, invoiceId: null },
        { id: generateId(), projectId: project2Id, date: '2023-10-27', description: 'Internal project management.', hours: 1, isBillable: false, invoiceId: null },
    ];
    const initialInvoices: Invoice[] = [];

    return { initialClients, initialProjects, initialTimeEntries, initialInvoices };
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
    addClient: (client: Omit<Client, 'id'>) => void;
    updateClient: (client: Client) => void;
    deleteClient: (clientId: string) => void;
    addProject: (project: Omit<Project, 'id'>) => void;
    updateProject: (project: Project) => void;
    addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
    updateTimeEntry: (entry: TimeEntry) => void;
    deleteTimeEntry: (entryId: string) => void;
    createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
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
    const { initialClients, initialProjects, initialTimeEntries, initialInvoices } = getInitialData();
    const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClients);
    const [projects, setProjects] = useLocalStorage<Project[]>('projects', initialProjects);
    const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', initialTimeEntries);
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);

    const addClient = (client: Omit<Client, 'id'>) => setClients(prev => [...prev, { ...client, id: generateId() }]);
    const updateClient = (updatedClient: Client) => setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    const deleteClient = (clientId: string) => setClients(prev => prev.filter(c => c.id !== clientId));

    const addProject = (project: Omit<Project, 'id'>) => setProjects(prev => [...prev, { ...project, id: generateId() }]);
    const updateProject = (updatedProject: Project) => setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
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

    const value = {
        clients, projects, timeEntries, invoices,
        addClient, updateClient, deleteClient,
        addProject, updateProject,
        addTimeEntry, updateTimeEntry, deleteTimeEntry,
        createInvoice,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- ICON COMPONENTS ---
const TimeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const InvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

// --- NAVLINK COMPONENT ---
const NavLink = ({ activeView, targetView, setView, children, icon }: { activeView: View, targetView: View, setView: React.Dispatch<React.SetStateAction<View>>, children: ReactNode, icon: ReactNode }) => {
    const isActive = activeView === targetView;
    return (
        <button
            onClick={() => setView(targetView)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left ${
                isActive ? 'bg-primary-500 text-white' : 'text-slate-700 hover:bg-primary-100 hover:text-primary-700'
            }`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
};

// --- MAIN APP ---
export default function App() {
    const [view, setView] = useState<View>('dashboard');

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
            default:
                return <Dashboard setView={setView} />;
        }
    };

    return (
        <AppProvider>
            <div className="flex h-screen bg-slate-100">
                <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-8">
                         <div className="p-2 bg-primary-500 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                        <h1 className="text-xl font-bold text-slate-800">ProTracker</h1>
                    </div>
                    <nav className="flex flex-col space-y-2">
                       <NavLink activeView={view} targetView="dashboard" setView={setView} icon={<DashboardIcon />}>Dashboard</NavLink>
                       <NavLink activeView={view} targetView="clients-projects" setView={setView} icon={<FolderIcon />}>Clients & Projects</NavLink>
                       <NavLink activeView={view} targetView="time-entries" setView={setView} icon={<TimeIcon />}>Time Entries</NavLink>
                       <NavLink activeView={view} targetView="invoicing" setView={setView} icon={<InvoiceIcon />}>Invoicing</NavLink>
                    </nav>
                </aside>
                <main className="flex-1 overflow-y-auto p-8">
                    {renderView()}
                </main>
            </div>
        </AppProvider>
    );
}
