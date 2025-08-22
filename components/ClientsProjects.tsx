
import React, { useState } from 'react';
import { useAppContext } from '../App';
import type { Client, Project, ProjectTemplate, ClientNote, ProjectMilestone } from '../types';
import { ProjectStatus, Currency } from '../types';
import { Button, Modal, Input, Textarea, Label, Card, CardHeader, CardTitle, CardContent, Select } from './ui/index';

// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ChevronDownIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const TemplateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const NotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;


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
                        <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Select id="currency" name="currency" value={formData.currency || ''} onChange={handleChange} required>
                                <option value="">Select currency...</option>
                                {Object.values(Currency).map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </Select>
                        </div>
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
    const [phasesModalProject, setPhasesModalProject] = useState<Project | null>(null);
    
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
        try {
            if (!currency) return amount.toFixed(2);
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
        } catch (e) {
            return `${amount.toFixed(2)} ${currency}`;
        }
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
                             <div key={project.id} className="py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{project.name}</p>
                                        <p className="text-sm text-slate-500">{formatCurrency(project.hourlyRate, project.currency)}/hr</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === ProjectStatus.Active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {project.status}
                                        </span>
                                        <Button variant="secondary" size="sm" onClick={() => setPhasesModalProject(project)}>
                                            Phases
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => toggleArchive(project)}><ArchiveIcon/></Button>
                                    </div>
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

            {phasesModalProject && (
                <ProjectPhasesModal
                    project={phasesModalProject}
                    isOpen={!!phasesModalProject}
                    onClose={() => setPhasesModalProject(null)}
                />
            )}
        </Card>
    );
};

// --- Project Templates Management ---
const ProjectTemplatesSection = () => {
    const { projectTemplates, addProjectTemplate, deleteProjectTemplate } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<ProjectTemplate>>({
        name: '',
        description: '',
        defaultHourlyRate: 0,
        defaultCurrency: Currency.USD,
        category: '',
        tags: [],
        tasks: []
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addProjectTemplate(formData as Omit<ProjectTemplate, 'id'>);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', defaultHourlyRate: 0, defaultCurrency: Currency.USD, category: '', tags: [], tasks: [] });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'defaultHourlyRate' ? parseFloat(value) || 0 : value 
        }));
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Project Templates</CardTitle>
                    <Button onClick={() => setIsModalOpen(true)} size="sm">
                        <PlusIcon /> Add Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {projectTemplates.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No project templates created yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectTemplates.map(template => (
                            <div key={template.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-800">{template.name}</h4>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => deleteProjectTemplate(template.id)}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>{template.defaultCurrency} {template.defaultHourlyRate}/hr</span>
                                    <span>{template.category}</span>
                                </div>
                                {template.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {template.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Project Template">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="defaultHourlyRate">Default Hourly Rate</Label>
                                <Input
                                    id="defaultHourlyRate"
                                    name="defaultHourlyRate"
                                    type="number"
                                    step="0.01"
                                    value={formData.defaultHourlyRate || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="defaultCurrency">Currency</Label>
                                <Select
                                    id="defaultCurrency"
                                    name="defaultCurrency"
                                    value={formData.defaultCurrency || ''}
                                    onChange={handleChange}
                                    required
                                >
                                    {Object.values(Currency).map(curr => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                value={formData.category || ''}
                                onChange={handleChange}
                                placeholder="e.g., Web Development, Design, Marketing"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Template</Button>
                        </div>
                    </form>
                </Modal>
            </CardContent>
        </Card>
    );
};

// --- Project Phases Management ---
const ProjectPhasesModal = ({ project, isOpen, onClose }: { project: Project; isOpen: boolean; onClose: () => void }) => {
    const { projectPhases, addProjectPhase, updateProjectPhase, deleteProjectPhase, reorderProjectPhases, getPhaseAnalytics } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedHours: 0
    });

    const projectPhasesList = projectPhases
        .filter(phase => phase.projectId === project.id && !phase.isArchived)
        .sort((a, b) => a.order - b.order);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const maxOrder = projectPhasesList.length > 0 ? Math.max(...projectPhasesList.map(p => p.order)) : -1;
        addProjectPhase({
            projectId: project.id,
            name: formData.name,
            description: formData.description,
            estimatedHours: formData.estimatedHours,
            order: maxOrder + 1,
            isArchived: false,
            createdDate: new Date().toISOString().split('T')[0]
        });
        setFormData({ name: '', description: '', estimatedHours: 0 });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'estimatedHours' ? parseFloat(value) || 0 : value 
        }));
    };

    const handleArchivePhase = (phaseId: string) => {
        if (window.confirm('Archive this phase? Time entries will be preserved but the phase will be hidden.')) {
            deleteProjectPhase(phaseId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Phases for ${project.name}`}>
            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4 border-b border-slate-200 pb-4">
                    <h3 className="font-medium text-slate-800">Add New Phase</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phaseName">Phase Name</Label>
                            <Input
                                id="phaseName"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Planning, Development, Testing"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="estimatedHours">Estimated Hours</Label>
                            <Input
                                id="estimatedHours"
                                name="estimatedHours"
                                type="number"
                                step="0.25"
                                min="0"
                                value={formData.estimatedHours}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="phaseDescription">Description</Label>
                        <Input
                            id="phaseDescription"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Phase description..."
                        />
                    </div>
                    <Button type="submit" size="sm">Add Phase</Button>
                </form>

                <div>
                    <h3 className="font-medium text-slate-800 mb-3">Project Phases</h3>
                    {projectPhasesList.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No phases created yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {projectPhasesList.map((phase, index) => {
                                const analytics = getPhaseAnalytics(phase.id);
                                const actualHours = analytics?.totalHours || 0;
                                const completionPercentage = phase.estimatedHours > 0 ? (actualHours / phase.estimatedHours) * 100 : 0;
                                
                                return (
                                    <div key={phase.id} className="border border-slate-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-800">{phase.name}</h4>
                                                {phase.description && (
                                                    <p className="text-sm text-slate-600 mt-1">{phase.description}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleArchivePhase(phase.id)}
                                            >
                                                <ArchiveIcon />
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                                            <div>
                                                <span className="text-slate-500">Estimated:</span>
                                                <p className="font-medium">{phase.estimatedHours}h</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Actual:</span>
                                                <p className="font-medium">{actualHours.toFixed(1)}h</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Progress:</span>
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs">{completionPercentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// --- Client Notes Management ---
const ClientNotesModal = ({ client, isOpen, onClose }: { client: Client; isOpen: boolean; onClose: () => void }) => {
    const { clientNotes, addClientNote } = useAppContext();
    const [formData, setFormData] = useState({
        type: 'note' as 'call' | 'email' | 'meeting' | 'note',
        subject: '',
        content: ''
    });

    const clientNotesList = clientNotes.filter(note => note.clientId === client.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addClientNote({
            clientId: client.id,
            date: new Date().toISOString().split('T')[0],
            ...formData,
            createdBy: 'User'
        });
        setFormData({ type: 'note', subject: '', content: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Notes for ${client.name}`}>
            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4 border-b border-slate-200 pb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Type</Label>
                            <Select id="type" name="type" value={formData.type} onChange={handleChange}>
                                <option value="note">Note</option>
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="meeting">Meeting</option>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={3}
                            required
                        />
                    </div>
                    <Button type="submit" size="sm">Add Note</Button>
                </form>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {clientNotesList.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No notes for this client yet.</p>
                    ) : (
                        clientNotesList
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(note => (
                                <div key={note.id} className="border border-slate-200 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                note.type === 'call' ? 'bg-green-100 text-green-800' :
                                                note.type === 'email' ? 'bg-blue-100 text-blue-800' :
                                                note.type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {note.type}
                                            </span>
                                            <span className="font-medium">{note.subject}</span>
                                        </div>
                                        <span className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{note.content}</p>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

// --- MAIN COMPONENT ---
export default function ClientsProjects() {
    const { clients, addClient, updateClient, projectTemplates } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialState, setModalInitialState] = useState<FormState>({});
    const [notesModalClient, setNotesModalClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<'clients' | 'templates'>('clients');

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

    const tabButtonClass = (tab: string) => 
        `px-4 py-2 font-medium rounded-lg transition-colors ${
            activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Clients & Projects</h1>
                <div className="mt-3 sm:mt-0 flex space-x-2">
                    <Button onClick={() => handleOpenModal('client')}>
                        <PlusIcon /> Add Client
                    </Button>
                </div>
            </div>

            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6">
                <button onClick={() => setActiveTab('clients')} className={tabButtonClass('clients')}>
                    Clients & Projects
                </button>
                <button onClick={() => setActiveTab('templates')} className={tabButtonClass('templates')}>
                    <TemplateIcon /> Templates ({projectTemplates.length})
                </button>
            </div>

            {activeTab === 'clients' && (
                <div className="space-y-4">
                    {clients.map(client => (
                        <Card key={client.id}>
                            <CardHeader className="flex justify-between items-center cursor-pointer">
                                <div>
                                    <CardTitle>{client.name}</CardTitle>
                                    <p className="text-sm text-slate-500">{client.contactEmail}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setNotesModalClient(client); 
                                        }}
                                    >
                                        <NotesIcon /> Notes
                                    </Button>
                                    <ClientAccordionItem client={client} />
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'templates' && <ProjectTemplatesSection />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalInitialState.id ? 'Edit Client' : 'Add New Client'}>
                <ClientProjectForm initialState={modalInitialState} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {notesModalClient && (
                <ClientNotesModal
                    client={notesModalClient}
                    isOpen={!!notesModalClient}
                    onClose={() => setNotesModalClient(null)}
                />
            )}
        </div>
    );
}