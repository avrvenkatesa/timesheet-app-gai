
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../App';
import type { Invoice, Client, TimeEntry, Project } from '../types';
import { InvoiceStatus } from '../types';
import { Button, Modal, Select, Label, Card, CardHeader, CardTitle, CardContent, Input } from './ui/index';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /></svg>;

const formatCurrency = (amount: number, currency: string) => {
    try {
        if (!currency) return amount.toFixed(2);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch (e) {
        return `${amount.toFixed(2)} ${currency}`;
    }
};

const formatDate = (dateString: string) => {
    try {
        // Format to DD/MM/YYYY to match the image
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
};

// --- Invoice Detail Modal ---
const InvoiceDetailModal = ({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) => {
    const { billerInfo, clients, projects, timeEntries, updateInvoice } = useAppContext();
    const client = clients.find(c => c.id === invoice.clientId);
    const invoiceEntries = timeEntries.filter(t => invoice.timeEntryIds.includes(t.id));
    const [isSaving, setIsSaving] = useState(false);
    
    const total = useMemo(() => {
        const totals: { [key: string]: number } = {};
        invoiceEntries.forEach(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            if(project) {
                const amount = entry.hours * project.hourlyRate;
                totals[project.currency] = (totals[project.currency] || 0) + amount;
            }
        });
        return Object.entries(totals).map(([curr, amt]) => formatCurrency(amt, curr)).join(' + ');
    }, [invoiceEntries, projects]);

    const handleSaveAsPdf = async () => {
        const invoiceContent = document.getElementById('invoice-content-for-print');
        if (!invoiceContent) {
            console.error('Invoice content element not found');
            return;
        }

        setIsSaving(true);
        try {
            const canvas = await html2canvas(invoiceContent, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const margin = 15;
            
            const contentWidth = pageWidth - margin * 2;
            const contentHeight = pageHeight - margin * 2;

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const aspectRatio = imgWidth / imgHeight;

            let finalImgWidth = contentWidth;
            let finalImgHeight = finalImgWidth / aspectRatio;

            if (finalImgHeight > contentHeight) {
                finalImgHeight = contentHeight;
                finalImgWidth = finalImgHeight * aspectRatio;
            }

            const x = margin + (contentWidth - finalImgWidth) / 2;
            const y = margin;

            pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
            pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = (status: InvoiceStatus) => {
        updateInvoice({ ...invoice, status });
    };

    const modalFooter = (
        <>
            <Button type="button" variant="secondary" onClick={handleSaveAsPdf} disabled={isSaving}>
                 {isSaving ? 'Saving...' : <><SaveIcon /> Save as PDF</>}
            </Button>
            {invoice.status === InvoiceStatus.Draft && <Button type="button" onClick={() => handleUpdateStatus(InvoiceStatus.Sent)}>Mark as Sent</Button>}
            {invoice.status !== InvoiceStatus.Paid && <Button type="button" onClick={() => handleUpdateStatus(InvoiceStatus.Paid)}>Mark as Paid</Button>}
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title={`Invoice ${invoice.invoiceNumber}`} footer={modalFooter}>
            <div id="invoice-content-for-print" className="bg-white">
                 <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">{billerInfo.name}</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{billerInfo.address}</p>
                            <p className="text-sm text-slate-600">{billerInfo.email}</p>
                            <p className="text-sm text-slate-600">{billerInfo.phone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Bill To</p>
                            <h4 className="font-bold text-slate-800 mb-1">{client?.name}</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{client?.billingAddress}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">INVOICE</h2>
                        <p className="text-slate-500 mb-6">{invoice.invoiceNumber}</p>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-slate-500">Issue Date</p>
                                <p className="font-medium text-slate-700">{formatDate(invoice.issueDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Due Date</p>
                                <p className="font-medium text-slate-700">{formatDate(invoice.dueDate)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-slate-600 font-medium rounded-l-md">Description</th>
                            <th className="px-4 py-2 text-right text-slate-600 font-medium">Hours</th>
                            <th className="px-4 py-2 text-right text-slate-600 font-medium">Rate</th>
                            <th className="px-4 py-2 text-right text-slate-600 font-medium rounded-r-md">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceEntries.map(entry => {
                            const project = projects.find(p => p.id === entry.projectId);
                            if (!project) return null;
                            return (
                                <tr key={entry.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-800">{project.name}</p>
                                        <p className="text-slate-500 mt-1">{entry.description}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">{entry.hours.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(project.hourlyRate, project.currency)}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(entry.hours * project.hourlyRate, project.currency)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="flex justify-end mt-8">
                     <div className="w-full max-w-sm">
                         <div className="border-t-2 border-slate-200 mt-4 pt-4">
                             <div className="flex justify-between font-bold text-lg">
                                <span className="text-slate-800">Total</span>
                                <span className="text-primary-600">{total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


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
    const { invoices, clients, projects, timeEntries, createInvoice } = useAppContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    
    useEffect(() => {
        if (viewingInvoice) {
            const updatedInvoice = invoices.find(inv => inv.id === viewingInvoice.id);
            if (updatedInvoice && updatedInvoice !== viewingInvoice) {
                setViewingInvoice(updatedInvoice);
            } else if (!updatedInvoice) {
                setViewingInvoice(null);
            }
        }
    }, [invoices, viewingInvoice]);

    const handleSave = (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
        createInvoice(data);
        setIsCreateModalOpen(false);
    };
    
    const getInvoiceTotal = (invoice: Invoice) => {
        const totals: { [key: string]: number } = {};
        invoice.timeEntryIds.forEach(id => {
            const entry = timeEntries.find(t => t.id === id);
            const project = entry ? projects.find(p => p.id === entry.projectId) : null;
            if(entry && project) {
                const amount = entry.hours * project.hourlyRate;
                totals[project.currency] = (totals[project.currency] || 0) + amount;
            }
        });
        return Object.entries(totals).map(([curr, amt]) => formatCurrency(amt, curr)).join(' + ');
    };

    const statusClasses: { [key in InvoiceStatus]: string } = {
        [InvoiceStatus.Draft]: 'bg-slate-100 text-slate-800',
        [InvoiceStatus.Sent]: 'bg-blue-100 text-blue-800',
        [InvoiceStatus.Paid]: 'bg-green-100 text-green-800',
        [InvoiceStatus.Overdue]: 'bg-red-100 text-red-800',
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
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
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    return (
                                        <tr key={invoice.id} className="bg-white border-b hover:bg-slate-50 cursor-pointer" onClick={() => setViewingInvoice(invoice)}>
                                            <td className="px-6 py-4 font-medium text-primary-600">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{client?.name}</td>
                                            <td className="px-6 py-4">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">{getInvoiceTotal(invoice)}</td>
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

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Invoice">
                <InvoiceCreator onSave={handleSave} onCancel={() => setIsCreateModalOpen(false)} />
            </Modal>
            {viewingInvoice && (
                <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
            )}
        </div>
    );
}
