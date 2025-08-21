
import React, { useState } from 'react';
import { useAppContext } from '../App';
import type { TimeEntry } from '../types';
import { ProjectStatus } from '../types';
import { Button, Modal, Input, Textarea, Label, Select, Card, CardHeader, CardTitle, CardContent } from './ui/index';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// --- Time Entry Form ---
const TimeEntryForm = ({ onSave, onCancel }: { onSave: (data: Omit<TimeEntry, 'id'>) => void; onCancel: () => void; }) => {
    const { projects, clients } = useAppContext();
    const [formData, setFormData] = useState<Omit<TimeEntry, 'id' | 'invoiceId'>>({
        date: new Date().toISOString().split('T')[0],
        projectId: '',
        description: '',
        hours: 0,
        isBillable: true,
    });
    
    const activeProjects = projects.filter(p => p.status === ProjectStatus.Active);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: name === 'hours' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId) {
            alert("Please select a project.");
            return;
        }
        onSave({ ...formData, invoiceId: null });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                 <div>
                    <Label htmlFor="hours">Hours</Label>
                    <Input id="hours" name="hours" type="number" step="0.01" min="0" value={formData.hours} onChange={handleChange} required />
                </div>
            </div>
            <div>
                <Label htmlFor="projectId">Project</Label>
                <Select id="projectId" name="projectId" value={formData.projectId} onChange={handleChange} required>
                    <option value="" disabled>Select a project</option>
                    {clients.map(client => (
                        <optgroup label={client.name} key={client.id}>
                            {activeProjects.filter(p => p.clientId === client.id).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </Select>
            </div>
            <div>
                <Label htmlFor="description">Task Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={3}/>
            </div>
             <div className="flex items-center space-x-2">
                <input type="checkbox" id="isBillable" name="isBillable" checked={formData.isBillable} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"/>
                <Label htmlFor="isBillable">This entry is billable</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Log Time</Button>
            </div>
        </form>
    );
};

// --- Main Component ---
export default function TimeEntries() {
    const { timeEntries, projects, clients, addTimeEntry, deleteTimeEntry } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleSave = (data: Omit<TimeEntry, 'id'>) => {
        addTimeEntry(data);
        setIsModalOpen(false);
    };

    const formatCurrency = (amount: number, currency: string) => {
        try {
            if (!currency) return amount.toFixed(2);
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
        } catch (e) {
            return `${amount.toFixed(2)} ${currency}`;
        }
    };
    
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Time Entries</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon/> Log Time
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                             <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Client / Project</th>
                                    <th scope="col" className="px-6 py-3">Description</th>
                                    <th scope="col" className="px-6 py-3 text-right">Hours</th>
                                    <th scope="col" className="px-6 py-3 text-right">Billable Amount</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                               {timeEntries.map(entry => {
                                   const project = projects.find(p => p.id === entry.projectId);
                                   const client = project ? clients.find(c => c.id === project.clientId) : null;
                                   const billableAmount = (entry.isBillable && project) ? entry.hours * project.hourlyRate : 0;
                                   
                                   return (
                                     <tr key={entry.id} className="bg-white border-b hover:bg-slate-50">
                                       <td className="px-6 py-4">{new Date(entry.date).toLocaleDateString()}</td>
                                       <td className="px-6 py-4">
                                           <div className="font-medium text-slate-900">{client?.name}</div>
                                           <div className="text-slate-500">{project?.name}</div>
                                       </td>
                                       <td className="px-6 py-4 max-w-sm truncate">{entry.description}</td>
                                       <td className="px-6 py-4 text-right font-medium text-slate-900">{entry.hours.toFixed(2)}</td>
                                       <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {billableAmount > 0 && project ? formatCurrency(billableAmount, project.currency) : '—'}
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${entry.invoiceId ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {entry.invoiceId ? 'Invoiced' : 'Uninvoiced'}
                                            </span>
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                          {!entry.invoiceId && (
                                            <button onClick={() => window.confirm('Are you sure?') && deleteTimeEntry(entry.id)} className="text-red-500 hover:text-red-700">
                                                <TrashIcon/>
                                            </button>
                                          )}
                                       </td>
                                    </tr>
                                   );
                               })}
                            </tbody>
                        </table>
                         {timeEntries.length === 0 && (
                            <p className="text-center text-slate-500 py-10">No time entries logged yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Time Entry">
                <TimeEntryForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    )
}