
import React, { useState } from 'react';
import { useAppContext } from '../App';
import type { Client, Project } from '../types';
import { ProjectStatus } from '../types';
import { Button, Modal, Input, Textarea, Label, Card, CardHeader, CardTitle, CardContent, Select } from './ui/index';

// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


// --- Client/Project Form ---
type FormState = Partial<Client & Project & { formType: 'client' | 'project' }>;

const ClientProjectForm = ({
    initialState,
    onSave,
    onCancel,
}: {
    initialState: FormState;
    onSave: (data: FormState) => void;
    onCancel: () => void;
}) => {
    const { clients } = useAppContext();
    const [formData, setFormData] = useState(initialState);
    const { formType } = initialState;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formType === 'client' && (
                <>
                    <div><Label htmlFor="name">Client Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                    <div><Label htmlFor="contactName">Contact Name</Label><Input id="contactName" name="contactName" value={formData.contactName || ''} onChange={handleChange} /></div>
                    <div><Label htmlFor="contactEmail">Contact Email</Label><Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail || ''} onChange={handleChange} /></div>
                    <div><Label htmlFor="billingAddress">Billing Address</Label><Textarea id="billingAddress" name="billingAddress" value={formData.billingAddress || ''} onChange={handleChange} /></div>
                </>
            )}
            {formType === 'project' && (
                 <>
                    <div><Label htmlFor="clientId">Client</Label>
                        <Select id="clientId" name="clientId" value={formData.clientId || ''} onChange={handleChange} required>
                            <option value="" disabled>Select a client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div><Label htmlFor="name">Project Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                    <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label htmlFor="hourlyRate">Hourly Rate</Label><Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" value={formData.hourlyRate || ''} onChange={handleChange} required /></div>
                        <div><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" value={formData.currency || 'USD'} onChange={handleChange} required /></div>
                    </div>
                 </>
            )}
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};


// --- Client Accordion Item ---
const ClientAccordionItem = ({ client }: { client: Client }) => {
    const { projects, deleteClient, addProject, updateProject } = useAppContext();
    const [isOpen, setIsOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialState, setModalInitialState] = useState<FormState>({});
    
    const clientProjects = projects.filter(p => p.clientId === client.id);

    const handleDeleteClient = () => {
        const hasActiveProjects = clientProjects.some(p => p.status === ProjectStatus.Active);
        if (hasActiveProjects) {
            alert("Cannot delete client with active projects. Please archive all projects for this client first.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
            deleteClient(client.id);
        }
    };

    const handleOpenModal = (type: 'project', data?: Project) => {
        if (type === 'project') {
            setModalInitialState(data ? { ...data, formType: 'project' } : { formType: 'project', clientId: client.id, status: ProjectStatus.Active, currency: 'USD' });
        }
        setIsModalOpen(true);
    };

    const handleSave = (data: FormState) => {
        if (data.formType === 'project') {
            const { formType, ...projectData } = data;
            if (projectData.id) {
                updateProject(projectData as Project);
            } else {
                addProject(projectData as Omit<Project, 'id'>);
            }
        }
        setIsModalOpen(false);
    };
    
    const toggleArchive = (project: Project) => {
        const newStatus = project.status === ProjectStatus.Active ? ProjectStatus.Archived : ProjectStatus.Active;
        updateProject({ ...project, status: newStatus });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div>
                    <CardTitle>{client.name}</CardTitle>
                    <p className="text-sm text-slate-500">{client.contactEmail}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('project'); }}><PlusIcon/> Add Project</Button>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClient(); }}><TrashIcon/></Button>
                    <ChevronDownIcon className={`${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </CardHeader>
            {isOpen && (
                <CardContent>
                    {clientProjects.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                        {clientProjects.map(project => (
                             <div key={project.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">{project.name}</p>
                                    <p className="text-sm text-slate-500">{formatCurrency(project.hourlyRate, project.currency)}/hr</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === ProjectStatus.Active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {project.status}
                                    </span>
                                    <Button variant="secondary" size="sm" onClick={() => toggleArchive(project)}><ArchiveIcon/></Button>
                                </div>
                             </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No projects for this client yet.</p>
                    )}
                </CardContent>
            )}
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalInitialState.id ? 'Edit Project' : 'Add New Project'}>
                <ClientProjectForm initialState={modalInitialState} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </Card>
    );
};

// --- MAIN COMPONENT ---
export default function ClientsProjects() {
    const { clients, addClient, updateClient } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialState, setModalInitialState] = useState<FormState>({});

    const handleOpenModal = (type: 'client', data?: Client) => {
        setModalInitialState(data ? { ...data, formType: 'client' } : { formType: 'client' });
        setIsModalOpen(true);
    };

    const handleSave = (data: FormState) => {
        if (data.formType === 'client') {
            const { formType, ...clientData } = data;
            if (clientData.id) {
                updateClient(clientData as Client);
            } else {
                addClient(clientData as Omit<Client, 'id'>);
            }
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Clients & Projects</h1>
                <Button onClick={() => handleOpenModal('client')}>
                    <PlusIcon /> Add Client
                </Button>
            </div>
            <div className="space-y-4">
                {clients.map(client => (
                    <ClientAccordionItem key={client.id} client={client} />
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalInitialState.id ? 'Edit Client' : 'Add New Client'}>
                <ClientProjectForm initialState={modalInitialState} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
}
