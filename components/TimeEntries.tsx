import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../App';
import type { TimeEntry } from '../types';
import { ProjectStatus } from '../types';
import { Button, Modal, Input, Textarea, Label, Select, Card, CardHeader, CardTitle, CardContent } from './ui/index';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" /></svg>;

interface TimeTemplate {
  id: string;
  name: string;
  projectId: string;
  description: string;
  defaultHours: number;
  isBillable: boolean;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  projectId: string;
  description: string;
  phaseId?: string;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  projectId: string;
  billableOnly: boolean;
}

const initialFilters: Filters = {
  dateFrom: '',
  dateTo: '',
  projectId: '',
  billableOnly: false
};

// --- Timer Component ---
const Timer = ({ timer, onStart, onPause, onStop, onUpdate }: {
  timer: TimerState;
  onStart: (projectId: string, description: string, phaseId?: string) => void;
  onPause: () => void;
  onStop: () => void;
  onUpdate: (projectId: string, description: string, phaseId?: string) => void;
}) => {
  const { projects, clients, projectPhases } = useAppContext();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');

  const activeProjects = projects.filter(p => p.status === ProjectStatus.Active);
  const clientProjects = selectedClientId 
    ? activeProjects.filter(p => p.clientId === selectedClientId)
    : [];
  const availablePhases = timer.projectId 
    ? projectPhases.filter(phase => phase.projectId === timer.projectId && !phase.isArchived)
        .sort((a, b) => a.order - b.order)
    : [];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && !timer.isPaused) {
      interval = setInterval(() => {
        const elapsed = timer.pausedTime + (Date.now() - (timer.startTime || 0));
        setCurrentTime(elapsed);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused, timer.startTime, timer.pausedTime]);

  // Update selected client when project changes
  useEffect(() => {
    if (timer.projectId) {
      const project = projects.find(p => p.id === timer.projectId);
      if (project && project.clientId !== selectedClientId) {
        setSelectedClientId(project.clientId);
      }
    }
  }, [timer.projectId, projects, selectedClientId]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!timer.projectId || !timer.description.trim()) {
      alert('Please select a client, project and enter a description before starting the timer.');
      return;
    }
    onStart(timer.projectId, timer.description, timer.phaseId);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    // Clear project and phase selection when client changes
    if (timer.projectId) {
      const currentProject = projects.find(p => p.id === timer.projectId);
      if (!currentProject || currentProject.clientId !== clientId) {
        onUpdate('', timer.description, '');
        setSelectedPhaseId('');
      }
    }
  };

  const handleProjectChange = (projectId: string) => {
    onUpdate(projectId, timer.description, '');
    setSelectedPhaseId('');
  };

  const handlePhaseChange = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    onUpdate(timer.projectId, timer.description, phaseId);
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center text-green-800">
          <PlayIcon />
          <span className="ml-2">Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-slate-800 mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="flex justify-center space-x-2">
              {!timer.isRunning ? (
                <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
                  <PlayIcon /> Start
                </Button>
              ) : timer.isPaused ? (
                <Button onClick={() => onStart(timer.projectId, timer.description)} className="bg-green-600 hover:bg-green-700">
                  <PlayIcon /> Resume
                </Button>
              ) : (
                <Button onClick={onPause} className="bg-yellow-600 hover:bg-yellow-700">
                  <PauseIcon /> Pause
                </Button>
              )}
              {timer.isRunning && (
                <Button onClick={onStop} className="bg-red-600 hover:bg-red-700">
                  <StopIcon /> Stop
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="timer-client">Client</Label>
              <Select
                id="timer-client"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                disabled={timer.isRunning && !timer.isPaused}
              >
                <option value="">Select client...</option>
                {clients.filter(client => 
                  activeProjects.some(p => p.clientId === client.id)
                ).map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="timer-project">Project</Label>
              <Select
                id="timer-project"
                value={timer.projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                disabled={timer.isRunning && !timer.isPaused || !selectedClientId}
              >
                <option value="">
                  {selectedClientId ? 'Select project...' : 'Select client first...'}
                </option>
                {clientProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="timer-phase">Phase (Optional)</Label>
              <Select
                id="timer-phase"
                value={selectedPhaseId}
                onChange={(e) => handlePhaseChange(e.target.value)}
                disabled={timer.isRunning && !timer.isPaused || !timer.projectId}
              >
                <option value="">
                  {timer.projectId ? 'No specific phase...' : 'Select project first...'}
                </option>
                {availablePhases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="timer-description">Description</Label>
              <Input
                id="timer-description"
                value={timer.description}
                onChange={(e) => onUpdate(timer.projectId, e.target.value, timer.phaseId)}
                placeholder="What are you working on?"
                disabled={timer.isRunning && !timer.isPaused}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Template Management ---
const TemplateModal = ({ isOpen, onClose, onSave, templates }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<TimeTemplate, 'id'>) => void;
  templates: TimeTemplate[];
}) => {
  const { projects, clients } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    description: '',
    defaultHours: 1,
    isBillable: true
  });

  const activeProjects = projects.filter(p => p.status === ProjectStatus.Active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.projectId) {
      alert('Please fill in all required fields.');
      return;
    }
    onSave(formData);
    setFormData({ name: '', projectId: '', description: '', defaultHours: 1, isBillable: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Time Entry Templates">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
          <h3 className="font-medium text-slate-800">Create New Template</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Daily Standup"
                required
              />
            </div>
            <div>
              <Label htmlFor="template-hours">Default Hours</Label>
              <Input
                id="template-hours"
                type="number"
                step="0.25"
                min="0"
                value={formData.defaultHours}
                onChange={(e) => setFormData({...formData, defaultHours: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template-project">Project *</Label>
            <Select
              id="template-project"
              value={formData.projectId}
              onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              required
            >
              <option value="">Select project...</option>
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
            <Label htmlFor="template-description">Default Description</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Template description..."
              rows={2}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="template-billable"
              checked={formData.isBillable}
              onChange={(e) => setFormData({...formData, isBillable: e.target.checked})}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="template-billable">Billable by default</Label>
          </div>
          <Button type="submit">Create Template</Button>
        </form>

        <div>
          <h3 className="font-medium text-slate-800 mb-3">Existing Templates</h3>
          {templates.length === 0 ? (
            <p className="text-slate-500 text-sm">No templates created yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map(template => {
                const project = projects.find(p => p.id === template.projectId);
                const client = project ? clients.find(c => c.id === project.clientId) : null;
                return (
                  <div key={template.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-slate-500">
                        {client?.name} - {project?.name} ({template.defaultHours}h)
                      </p>
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

// --- Time Entry Form ---
const TimeEntryForm = ({ onSave, onCancel, editEntry, templates, onUseTemplate }: {
  onSave: (data: Omit<TimeEntry, 'id'>) => void;
  onCancel: () => void;
  editEntry?: TimeEntry;
  templates: TimeTemplate[];
  onUseTemplate: (template: TimeTemplate) => void;
}) => {
    const { projects, clients, timeEntries, projectPhases } = useAppContext();
    const [formData, setFormData] = useState<Omit<TimeEntry, 'id' | 'invoiceId'>>({
        date: editEntry?.date || new Date().toISOString().split('T')[0],
        projectId: editEntry?.projectId || '',
        phaseId: editEntry?.phaseId || '',
        description: editEntry?.description || '',
        hours: editEntry?.hours || 0,
        isBillable: editEntry?.isBillable ?? true,
        startTime: editEntry?.startTime || '',
        stopTime: editEntry?.stopTime || ''
    });
    const [validationError, setValidationError] = useState('');

    const activeProjects = projects.filter(p => p.status === ProjectStatus.Active);
    const availablePhases = formData.projectId 
        ? projectPhases.filter(phase => phase.projectId === formData.projectId && !phase.isArchived)
            .sort((a, b) => a.order - b.order)
        : [];

    // Check for overlapping time entries
    const checkForOverlap = (date: string, startTime: string, endTime: string, excludeId?: string) => {
        if (!startTime || !endTime) return null;

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (start >= end) {
            return 'End time must be after start time';
        }

        const overlapping = timeEntries.find(entry => {
            if (excludeId && entry.id === excludeId) return false;
            if (entry.date !== date) return false;

            // For existing entries without specific times, we can't check overlap
            // This is a simplified check - in a real app you'd store start/end times
            return false;
        });

        return null;
    };

    // Calculate hours from start and stop time
    const calculateHours = (startTime: string, stopTime: string) => {
        if (!startTime || !stopTime) return 0;

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [stopHour, stopMin] = stopTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        let stopMinutes = stopHour * 60 + stopMin;

        // Handle case where stop time is next day
        if (stopMinutes < startMinutes) {
            stopMinutes += 24 * 60;
        }

        const hours = (stopMinutes - startMinutes) / 60;
        // Round up to two decimals
        return Math.ceil(hours * 100) / 100;
    };

    // Calculate expected stop time from start time and hours
    const calculateStopTime = (startTime: string, hours: number) => {
        if (!startTime || hours <= 0) return '';

        const [startHour, startMin] = startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = startMinutes + (hours * 60);
        
        const endHour = Math.floor(endMinutes / 60) % 24;
        const endMin = Math.floor(endMinutes % 60);
        
        return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    };

    // Calculate expected start time from stop time and hours
    const calculateStartTime = (stopTime: string, hours: number) => {
        if (!stopTime || hours <= 0) return '';

        const [stopHour, stopMin] = stopTime.split(':').map(Number);
        const stopMinutes = stopHour * 60 + stopMin;
        const startMinutes = stopMinutes - (hours * 60);
        
        let actualStartMinutes = startMinutes;
        if (actualStartMinutes < 0) {
            actualStartMinutes += 24 * 60; // Previous day
        }
        
        const startHour = Math.floor(actualStartMinutes / 60) % 24;
        const startMin = Math.floor(actualStartMinutes % 60);
        
        return `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    };

    // Validate time consistency
    const validateTimeConsistency = (startTime: string, stopTime: string, hours: number) => {
        if (!startTime || !stopTime || hours <= 0) return null;
        
        const calculatedHours = calculateHours(startTime, stopTime);
        const tolerance = 0.01; // Allow small floating point differences
        
        if (Math.abs(calculatedHours - hours) > tolerance) {
            return `Time mismatch: Start/Stop times indicate ${calculatedHours.toFixed(2)} hours, but ${hours.toFixed(2)} hours entered`;
        }
        
        return null;
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };

        if (name === 'startTime' && updatedData.stopTime) {
            updatedData.hours = calculateHours(value, updatedData.stopTime);
        } else if (name === 'stopTime' && updatedData.startTime) {
            updatedData.hours = calculateHours(updatedData.startTime, value);
        }

        setFormData(updatedData);
    };

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hours = parseFloat(e.target.value) || 0;
        const updatedData = { ...formData, hours };

        // If we have start time and hours, calculate stop time
        if (formData.startTime && hours > 0) {
            updatedData.stopTime = calculateStopTime(formData.startTime, hours);
        }
        // If we have stop time and hours, calculate start time
        else if (formData.stopTime && hours > 0) {
            updatedData.startTime = calculateStartTime(formData.stopTime, hours);
        }

        setFormData(updatedData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'hours') {
            handleHoursChange(e as React.ChangeEvent<HTMLInputElement>);
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        let error = '';
        
        // Check for time overlap
        if (formData.startTime && formData.stopTime) {
            const overlapError = checkForOverlap(formData.date, formData.startTime, formData.stopTime, editEntry?.id);
            if (overlapError) {
                error = overlapError;
            }
        }

        // Check for time consistency when all three values are present
        if (formData.startTime && formData.stopTime && formData.hours > 0) {
            const consistencyError = validateTimeConsistency(formData.startTime, formData.stopTime, formData.hours);
            if (consistencyError) {
                error = consistencyError;
            }
        }

        setValidationError(error);
    }, [formData.startTime, formData.stopTime, formData.hours, formData.date, editEntry?.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId) {
            alert("Please select a project.");
            return;
        }
        if (formData.hours <= 0) {
            alert("Hours must be greater than 0.");
            return;
        }
        if (validationError) {
            alert(`Cannot save: ${validationError}`);
            return;
        }
        onSave({ ...formData, invoiceId: editEntry?.invoiceId || null });
    };

    const handleUseTemplate = (template: TimeTemplate) => {
        setFormData({
            ...formData,
            projectId: template.projectId,
            description: template.description,
            hours: template.defaultHours,
            isBillable: template.isBillable
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {templates.length > 0 && (
                <div>
                    <Label>Quick Templates</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => handleUseTemplate(template)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={formData.date || ''} onChange={handleChange} required /></div>
                <div><Label htmlFor="hours">Hours</Label><Input id="hours" name="hours" type="number" step="0.01" min="0" value={formData.hours || ''} onChange={handleChange} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="startTime">Start Time</Label><Input id="startTime" name="startTime" type="time" value={formData.startTime || ''} onChange={handleTimeChange} /></div>
                <div><Label htmlFor="stopTime">Stop Time</Label><Input id="stopTime" name="stopTime" type="time" value={formData.stopTime || ''} onChange={handleTimeChange} /></div>
            </div>

            {validationError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {validationError}
                </div>
            )}
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
                <Label htmlFor="phaseId">Phase (Optional)</Label>
                <Select id="phaseId" name="phaseId" value={formData.phaseId || ''} onChange={handleChange}>
                    <option value="">No specific phase</option>
                    {availablePhases.map(phase => (
                        <option key={phase.id} value={phase.id}>{phase.name}</option>
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
                <Button type="submit" disabled={!!validationError}>
                    {editEntry ? 'Update Entry' : 'Log Time'}
                </Button>
            </div>
        </form>
    );
};

// --- Main Component ---
export default function TimeEntries() {
    const { timeEntries, projects, clients, addTimeEntry, deleteTimeEntry, updateTimeEntry } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<TimeEntry | undefined>();
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [templates, setTemplates] = useState<TimeTemplate[]>([]);
    const [timer, setTimer] = useState<TimerState>({
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        projectId: '',
        description: ''
    });

    // Load templates from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('timeTemplates');
        if (saved) {
            try {
                setTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading templates:', e);
            }
        }
    }, []);

    // Save templates to localStorage
    const saveTemplates = (newTemplates: TimeTemplate[]) => {
        setTemplates(newTemplates);
        localStorage.setItem('timeTemplates', JSON.stringify(newTemplates));
    };

    // Timer functions
    const handleTimerStart = (projectId: string, description: string, phaseId?: string) => {
        setTimer({
            isRunning: true,
            isPaused: false,
            startTime: Date.now(),
            pausedTime: timer.isPaused ? timer.pausedTime : 0,
            projectId,
            description,
            phaseId
        });
    };

    const handleTimerPause = () => {
        setTimer(prev => ({
            ...prev,
            isPaused: true,
            pausedTime: prev.pausedTime + (Date.now() - (prev.startTime || 0))
        }));
    };

    const handleTimerStop = () => {
        if (!timer.isRunning) return;

        const totalTime = timer.pausedTime + (Date.now() - (timer.startTime || 0));
        const hours = totalTime / (1000 * 60 * 60);

        if (hours > 0) {
            addTimeEntry({
                date: new Date().toISOString().split('T')[0],
                projectId: timer.projectId,
                phaseId: timer.phaseId,
                description: timer.description,
                hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
                isBillable: true,
                invoiceId: null,
                startTime: '', // Reset timer fields
                stopTime: ''
            });
        }

        setTimer({
            isRunning: false,
            isPaused: false,
            startTime: null,
            pausedTime: 0,
            projectId: '',
            description: '',
            phaseId: ''
        });
    };

    const handleTimerUpdate = (projectId: string, description: string, phaseId?: string) => {
        setTimer(prev => ({ ...prev, projectId, description, phaseId }));
    };

    // Template functions
    const handleSaveTemplate = (templateData: Omit<TimeTemplate, 'id'>) => {
        const newTemplate: TimeTemplate = {
            ...templateData,
            id: Date.now().toString()
        };
        saveTemplates([...templates, newTemplate]);
    };

    const handleUseTemplate = (template: TimeTemplate) => {
        // This will be handled in the form component
    };

    const handleSave = (data: Omit<TimeEntry, 'id'>) => {
        try {
            if (editEntry) {
                updateTimeEntry(editEntry.id, data);
                setEditEntry(undefined);
            } else {
                addTimeEntry(data);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving time entry:', error);
            alert('Failed to save time entry. Please try again.');
        }
    };

    const handleEdit = (entry: TimeEntry) => {
        setEditEntry(entry);
        setIsModalOpen(true);
    };

    // Bulk operations
    const handleSelectEntry = (entryId: string) => {
        const newSelected = new Set(selectedEntries);
        if (newSelected.has(entryId)) {
            newSelected.delete(entryId);
        } else {
            newSelected.add(entryId);
        }
        setSelectedEntries(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const toggleAllEntries = () => {
      if (selectedEntries.size === filteredEntries.length) {
          setSelectedEntries(new Set());
          setShowBulkActions(false);
      } else {
          setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
          setShowBulkActions(true);
      }
    };
    
    const handleBulkDelete = () => {
        if (window.confirm(`Delete ${selectedEntries.size} selected entries?`)) {
            selectedEntries.forEach(id => deleteTimeEntry(id));
            setSelectedEntries(new Set());
            setShowBulkActions(false);
        }
    };

    // Filter entries
    const filteredEntries = useMemo(() => {
        return timeEntries.filter(entry => {
            if (filters.dateFrom && entry.date < filters.dateFrom) return false;
            if (filters.dateTo && entry.date > filters.dateTo) return false;
            if (filters.projectId && entry.projectId !== filters.projectId) return false;
            if (filters.billableOnly && !entry.isBillable) return false;
            return true;
        });
    }, [timeEntries, filters]);

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
                <div className="flex space-x-2">
                    <Button onClick={() => setShowFilters(!showFilters)} variant="secondary">
                        <FilterIcon /> Filters
                    </Button>
                    <Button onClick={() => setIsTemplateModalOpen(true)} variant="secondary">
                        Templates
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusIcon /> Log Time
                    </Button>
                </div>
            </div>

            <Timer
                timer={timer}
                onStart={handleTimerStart}
                onPause={handleTimerPause}
                onStop={handleTimerStop}
                onUpdate={handleTimerUpdate}
            />

            {showFilters && (
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="date-from">From Date</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label htmlFor="date-to">To Date</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label htmlFor="filter-project">Project</Label>
                                <Select
                                    id="filter-project"
                                    value={filters.projectId}
                                    onChange={(e) => setFilters({...filters, projectId: e.target.value})}
                                >
                                    <option value="">All projects</option>
                                    {clients.map(client => (
                                        <optgroup label={client.name} key={client.id}>
                                            {projects.filter(p => p.clientId === client.id).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="billable-only"
                                        checked={filters.billableOnly}
                                        onChange={(e) => setFilters({...filters, billableOnly: e.target.checked})}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <Label htmlFor="billable-only">Billable only</Label>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button
                                onClick={() => setFilters(initialFilters)}
                                variant="secondary"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showBulkActions && (
                <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-800 font-medium">
                                {selectedEntries.size} entries selected
                            </span>
                            <div className="space-x-2">
                                <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                                    Delete Selected
                                </Button>
                                <Button onClick={() => {setSelectedEntries(new Set()); setShowBulkActions(false);}} variant="secondary">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                             <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                                            onChange={toggleAllEntries}
                                            className="rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Client / Project</th>
                                    <th scope="col" className="px-6 py-3">Phase</th>
                                    <th scope="col" className="px-6 py-3">Description</th>
                                    <th scope="col" className="px-6 py-3 text-center">Start Time</th>
                                    <th scope="col" className="px-6 py-3 text-center">Stop Time</th>
                                    <th scope="col" className="px-6 py-3 text-right">Hours</th>
                                    <th scope="col" className="px-6 py-3 text-right">Billable Amount</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                               {filteredEntries.map(entry => {
                                   const project = projects.find(p => p.id === entry.projectId);
                                   const client = project ? clients.find(c => c.id === project.clientId) : null;
                                   const phase = entry.phaseId ? projectPhases.find(p => p.id === entry.phaseId) : null;
                                   const billableAmount = (entry.isBillable && project) ? entry.hours * project.hourlyRate : 0;

                                   return (
                                     <tr key={entry.id} className={`bg-white border-b hover:bg-slate-50 ${selectedEntries.has(entry.id) ? 'bg-blue-50' : ''}`}>
                                       <td className="px-6 py-4">
                                         <input
                                           type="checkbox"
                                           checked={selectedEntries.has(entry.id)}
                                           onChange={() => handleSelectEntry(entry.id)}
                                           className="h-4 w-4 rounded border-slate-300"
                                         />
                                       </td>
                                       <td className="px-6 py-4">{new Date(entry.date).toLocaleDateString()}</td>
                                       <td className="px-6 py-4">
                                           <div className="font-medium text-slate-900">{client?.name}</div>
                                           <div className="text-slate-500">{project?.name}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                           {phase ? (
                                               <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                   {phase.name}
                                               </span>
                                           ) : (
                                               <span className="text-slate-400 text-sm">—</span>
                                           )}
                                       </td>
                                       <td className="px-6 py-4 max-w-sm truncate">{entry.description}</td>
                                       <td className="px-6 py-4 text-center">
                                           {entry.startTime ? new Date(`2000-01-01T${entry.startTime}`).toLocaleTimeString('en-US', { 
                                               hour: '2-digit', 
                                               minute: '2-digit',
                                               hour12: true 
                                           }) : '—'}
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                           {entry.stopTime ? new Date(`2000-01-01T${entry.stopTime}`).toLocaleTimeString('en-US', { 
                                               hour: '2-digit', 
                                               minute: '2-digit',
                                               hour12: true 
                                           }) : '—'}
                                       </td>
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
                                          <div className="flex justify-center space-x-2">
                                            {!entry.invoiceId && (
                                              <>
                                                <button
                                                  onClick={() => handleEdit(entry)}
                                                  className="text-blue-500 hover:text-blue-700"
                                                  title="Edit entry"
                                                >
                                                  <EditIcon />
                                                </button>
                                                <button
                                                  onClick={() => window.confirm('Are you sure?') && deleteTimeEntry(entry.id)}
                                                  className="text-red-500 hover:text-red-700"
                                                  title="Delete entry"
                                                >
                                                  <TrashIcon />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                       </td>
                                    </tr>
                                   );
                               })}
                            </tbody>
                        </table>
                         {filteredEntries.length === 0 && (
                            <p className="text-center text-slate-500 py-10">
                                {timeEntries.length === 0 ? 'No time entries logged yet.' : 'No entries match your filters.'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditEntry(undefined);
                }}
                title={editEntry ? "Edit Time Entry" : "Log New Time Entry"}
            >
                <TimeEntryForm
                    onSave={handleSave}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditEntry(undefined);
                    }}
                    editEntry={editEntry}
                    templates={templates}
                    onUseTemplate={handleUseTemplate}
                />
            </Modal>

            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={handleSaveTemplate}
                templates={templates}
            />
        </div>
    )
}