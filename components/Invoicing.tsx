
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import type { Invoice, Client, TimeEntry } from '../types';
import { InvoiceStatus } from '../types';
import { Button, Modal, Select, Label, Card, CardHeader, CardTitle, CardContent, Input } from './ui/index';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;


// --- Invoice Creator ---
const InvoiceCreator = ({ onSave, onCancel }: { onSave: (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => void; onCancel: () => void; }) => {
    const { clients, projects, timeEntries } = useAppContext();
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    });

    const unbilledEntries = useMemo(() => {
        if (!selectedClientId) return [];
        const clientProjectIds = projects.filter(p => p.clientId === selectedClientId).map(p => p.id);
        return timeEntries.filter(t => clientProjectIds.includes(t.projectId) && t.isBillable && !t.invoiceId);
    }, [selectedClientId, projects, timeEntries]);

    const handleToggleEntry = (entryId: string) => {
        setSelectedEntryIds(prev => prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]);
    };

    const handleSelectAll = () => {
        setSelectedEntryIds(unbilledEntries.map(e => e.id));
    };

    const handleDeselectAll = () => {
        setSelectedEntryIds([]);
    };

    const handleSubmit = () => {
        if (selectedEntryIds.length === 0) {
            alert('Please select at least one time entry to include in the invoice.');
            return;
        }
        onSave({
            clientId: selectedClientId,
            issueDate,
            dueDate,
            status: InvoiceStatus.Draft,
            timeEntryIds: selectedEntryIds
        });
    };
    
    const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

    const invoiceTotal = useMemo(() => {
        const totals: {[key: string]: number} = {};
        selectedEntryIds.forEach(id => {
            const entry = unbilledEntries.find(e => e.id === id);
            const project = entry ? projects.find(p => p.id === entry.projectId) : null;
            if(entry && project) {
                const amount = entry.hours * project.hourlyRate;
                totals[project.currency] = (totals[project.currency] || 0) + amount;
            }
        });
        return Object.entries(totals).map(([curr, amt]) => formatCurrency(amt, curr)).join(' + ');
    }, [selectedEntryIds, unbilledEntries, projects]);

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="client-select">1. Select Client</Label>
                <Select id="client-select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                    <option value="" disabled>Choose a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>

            {selectedClientId && (
                <div>
                    <h4 className="font-medium text-slate-800 mb-2">2. Select Unbilled Time Entries</h4>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {unbilledEntries.length > 0 ? (
                            unbilledEntries.map(entry => {
                                const project = projects.find(p => p.id === entry.projectId);
                                return (
                                <div key={entry.id} className="flex items-center p-3 border-b last:border-0">
                                    <input type="checkbox" checked={selectedEntryIds.includes(entry.id)} onChange={() => handleToggleEntry(entry.id)} className="h-4 w-4 mr-3 rounded" />
                                    <div className="flex-1">
                                        <p>{new Date(entry.date).toLocaleDateString()} - {project?.name}</p>
                                        <p className="text-sm text-slate-500">{entry.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{entry.hours.toFixed(2)} hrs</p>
                                        {project && <p className="text-sm">{formatCurrency(entry.hours * project.hourlyRate, project.currency)}</p>}
                                    </div>
                                </div>
                            )})
                        ) : <p className="p-4 text-center text-slate-500">No unbilled entries for this client.</p>}
                    </div>
                    {unbilledEntries.length > 0 && <div className="flex space-x-2 mt-2">
                        <Button type="button" variant="secondary" size="sm" onClick={handleSelectAll}>Select All</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={handleDeselectAll}>Deselect All</Button>
                    </div>}
                </div>
            )}
             <div>
                <h4 className="font-medium text-slate-800 mb-2">3. Set Invoice Dates</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="issueDate">Issue Date</Label>
                        <Input type="date" id="issueDate" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                 <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Invoice Total:</span>
                    <span className="text-lg font-bold text-primary-600">{invoiceTotal || '$0.00'}</span>
                </div>
            </div>
            
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={handleSubmit} disabled={!selectedClientId || selectedEntryIds.length === 0}>Create Invoice</Button>
            </div>
        </div>
    );
};


// --- Main Component ---
export default function Invoicing() {
    const { invoices, clients, createInvoice } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
        createInvoice(data);
        setIsModalOpen(false);
    };
    
    const statusClasses: { [key in InvoiceStatus]: string } = {
        [InvoiceStatus.Draft]: 'bg-slate-100 text-slate-800',
        [InvoiceStatus.Sent]: 'bg-blue-100 text-blue-800',
        [InvoiceStatus.Paid]: 'bg-green-100 text-green-800',
        [InvoiceStatus.Overdue]: 'bg-red-100 text-red-800',
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon /> Create Invoice
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Number</th>
                                    <th scope="col" className="px-6 py-3">Client</th>
                                    <th scope="col" className="px-6 py-3">Issue Date</th>
                                    <th scope="col" className="px-6 py-3">Due Date</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    return (
                                        <tr key={invoice.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-primary-600">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{client?.name}</td>
                                            <td className="px-6 py-4">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[invoice.status]}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                         {invoices.length === 0 && (
                            <p className="text-center text-slate-500 py-10">No invoices created yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Invoice">
                <InvoiceCreator onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
}
