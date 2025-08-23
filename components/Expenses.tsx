
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import type { Expense, ExpenseTemplate, ExpenseReport, ExpenseReceipt, Project, ProjectPhase } from '../types';
import { ExpenseStatus, ExpenseCategory, Currency } from '../types';
import { Button, Modal, Select, Label, Card, CardHeader, CardTitle, CardContent, Input } from './ui/index';

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch (e) {
        return `${amount.toFixed(2)} ${currency}`;
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Expense Form Component
const ExpenseForm = ({ expense, onSave, onCancel }: {
    expense?: Expense;
    onSave: (data: Omit<Expense, 'id' | 'statusHistory'>) => void;
    onCancel: () => void;
}) => {
    const { projects, projectPhases, expenseTemplates } = useAppContext();
    const [formData, setFormData] = useState({
        date: expense?.date || new Date().toISOString().split('T')[0],
        description: expense?.description || '',
        amount: expense?.amount?.toString() || '',
        currency: expense?.currency || Currency.USD,
        category: expense?.category || ExpenseCategory.Other,
        projectId: expense?.projectId || '',
        phaseId: expense?.phaseId || '',
        status: expense?.status || ExpenseStatus.Draft,
        vendor: expense?.vendor || '',
        notes: expense?.notes || '',
        markupPercentage: expense?.markupPercentage?.toString() || '0',
        tags: expense?.tags?.join(', ') || '',
        isBusinessExpense: expense?.isBusinessExpense ?? true
    });

    const availablePhases = useMemo(() => {
        if (!formData.projectId) return [];
        return projectPhases.filter(phase => phase.projectId === formData.projectId && !phase.isArchived);
    }, [formData.projectId, projectPhases]);

    const handleTemplateSelect = (templateId: string) => {
        const template = expenseTemplates.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                description: template.description,
                category: template.category,
                currency: template.currency,
                projectId: template.projectId || '',
                amount: template.defaultAmount?.toString() || prev.amount,
                tags: template.tags.join(', ')
            }));
        }
    };

    const handleSubmit = () => {
        if (!formData.description || !formData.amount) {
            alert('Please fill in description and amount');
            return;
        }

        const expenseData = {
            ...formData,
            amount: parseFloat(formData.amount),
            markupPercentage: parseFloat(formData.markupPercentage) || 0,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            receipts: expense?.receipts || [],
            phaseId: formData.phaseId || undefined,
            projectId: formData.projectId || undefined
        };

        onSave(expenseData);
    };

    return (
        <div className="space-y-6">
            {/* Template Selection */}
            {expenseTemplates.length > 0 && (
                <div>
                    <Label htmlFor="template">Use Template (Optional)</Label>
                    <Select id="template" onChange={(e) => handleTemplateSelect(e.target.value)}>
                        <option value="">Select a template...</option>
                        {expenseTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                        type="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                </div>

                <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    >
                        {Object.values(ExpenseCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                    type="text"
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the expense..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                        type="number"
                        id="amount"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                    >
                        {Object.values(Currency).map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </Select>
                </div>

                <div>
                    <Label htmlFor="markup">Markup % (for billing)</Label>
                    <Input
                        type="number"
                        id="markup"
                        step="0.1"
                        value={formData.markupPercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, markupPercentage: e.target.value }))}
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="project">Project (Optional)</Label>
                    <Select
                        id="project"
                        value={formData.projectId}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value, phaseId: '' }))}
                    >
                        <option value="">No project assigned</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </Select>
                </div>

                {availablePhases.length > 0 && (
                    <div>
                        <Label htmlFor="phase">Phase (Optional)</Label>
                        <Select
                            id="phase"
                            value={formData.phaseId}
                            onChange={(e) => setFormData(prev => ({ ...prev, phaseId: e.target.value }))}
                        >
                            <option value="">No phase assigned</option>
                            {availablePhases.map(phase => (
                                <option key={phase.id} value={phase.id}>{phase.name}</option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="vendor">Vendor/Supplier</Label>
                    <Input
                        type="text"
                        id="vendor"
                        value={formData.vendor}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                        placeholder="Company or person paid"
                    />
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ExpenseStatus }))}
                    >
                        {Object.values(ExpenseStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                    type="text"
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="client-meeting, urgent, reimbursable"
                />
            </div>

            <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                    type="text"
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional details..."
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="businessExpense"
                    checked={formData.isBusinessExpense}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBusinessExpense: e.target.checked }))}
                    className="mr-2"
                />
                <Label htmlFor="businessExpense">This is a business expense</Label>
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={handleSubmit}>
                    {expense ? 'Update' : 'Create'} Expense
                </Button>
            </div>
        </div>
    );
};

// Receipt Management Component
const ReceiptManager = ({ expense }: { expense: Expense }) => {
    const { uploadReceipt, deleteReceipt, getReceiptUrl } = useAppContext();
    const [isUploading, setIsUploading] = useState(false);
    const [loadingReceipts, setLoadingReceipts] = useState<Set<string>>(new Set());

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only images (JPG, PNG, GIF) or PDF files');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            await uploadReceipt(expense.id, file);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload receipt. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset the file input
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Receipts</h3>
                <div>
                    <input
                        type="file"
                        id="receipt-upload"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <Button
                        onClick={() => document.getElementById('receipt-upload')?.click()}
                        disabled={isUploading}
                        size="sm"
                    >
                        {isUploading ? 'Uploading...' : 'Upload Receipt'}
                    </Button>
                </div>
            </div>

            {expense.receipts.length === 0 ? (
                <p className="text-gray-500 text-sm">No receipts uploaded yet</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expense.receipts.map(receipt => (
                        <div key={receipt.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium truncate">{receipt.fileName}</span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this receipt?')) {
                                            try {
                                                await deleteReceipt(receipt.id);
                                            } catch (error) {
                                                alert('Failed to delete receipt. Please try again.');
                                            }
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Delete
                                </Button>
                            </div>
                            
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>Size: {(receipt.fileSize / 1024).toFixed(1)} KB</p>
                                <p>Uploaded: {formatDate(receipt.uploadDate)}</p>
                                
                                {receipt.ocrData && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded">
                                        <p className="font-medium">OCR Data:</p>
                                        {receipt.ocrData.extractedAmount && (
                                            <p>Amount: ${receipt.ocrData.extractedAmount.toFixed(2)}</p>
                                        )}
                                        {receipt.ocrData.extractedVendor && (
                                            <p>Vendor: {receipt.ocrData.extractedVendor}</p>
                                        )}
                                        <p>Confidence: {(receipt.ocrData.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                )}
                            </div>
                            
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                    setLoadingReceipts(prev => new Set(prev).add(receipt.id));
                                    try {
                                        const url = await getReceiptUrl(receipt.url);
                                        window.open(url, '_blank');
                                    } catch (error) {
                                        alert('Failed to load receipt. Please try again.');
                                    } finally {
                                        setLoadingReceipts(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(receipt.id);
                                            return newSet;
                                        });
                                    }
                                }}
                                disabled={loadingReceipts.has(receipt.id)}
                                className="w-full mt-2"
                            >
                                {loadingReceipts.has(receipt.id) ? 'Loading...' : 'View'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Expense Analytics Component
const ExpenseAnalytics = () => {
    const { getExpenseAnalytics, projects, expenses } = useAppContext();
    const [selectedProject, setSelectedProject] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const analytics = useMemo(() => {
        return getExpenseAnalytics(selectedProject || undefined, startDate || undefined, endDate || undefined);
    }, [selectedProject, startDate, endDate, getExpenseAnalytics]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="analyticsProject">Project Filter</Label>
                        <Select
                            id="analyticsProject"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="analyticsStartDate">Start Date</Label>
                        <Input
                            type="date"
                            id="analyticsStartDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="analyticsEndDate">End Date</Label>
                        <Input
                            type="date"
                            id="analyticsEndDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-500">Total Expenses</h4>
                            <p className="text-2xl font-bold">{analytics.totalExpenses}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                            <p className="text-2xl font-bold">${analytics.totalAmount.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-500">Average Amount</h4>
                            <p className="text-2xl font-bold">${analytics.averageAmount.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* By Category */}
                <div>
                    <h4 className="font-medium mb-3">Expenses by Category</h4>
                    <div className="space-y-2">
                        {Object.entries(analytics.byCategory).map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center">
                                <span>{category}</span>
                                <span className="font-medium">${amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Status */}
                <div>
                    <h4 className="font-medium mb-3">Expenses by Status</h4>
                    <div className="space-y-2">
                        {Object.entries(analytics.byStatus).map(([status, amount]) => (
                            <div key={status} className="flex justify-between items-center">
                                <span>{status}</span>
                                <span className="font-medium">${amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Expenses Component
export default function Expenses() {
    const { 
        expenses, 
        addExpense, 
        updateExpense, 
        deleteExpense, 
        projects, 
        projectPhases,
        exportExpenseData 
    } = useAppContext();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
    const [projectFilter, setProjectFilter] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            if (statusFilter && expense.status !== statusFilter) return false;
            if (projectFilter && expense.projectId !== projectFilter) return false;
            return true;
        });
    }, [expenses, statusFilter, projectFilter]);

    const handleSaveExpense = (data: Omit<Expense, 'id' | 'statusHistory'>) => {
        if (editingExpense) {
            updateExpense({ ...editingExpense, ...data });
            setEditingExpense(null);
        } else {
            addExpense(data);
            setIsCreateModalOpen(false);
        }
    };

    const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
        setIsExporting(true);
        try {
            const data = await exportExpenseData(format);
            const blob = new Blob([data], { 
                type: format === 'json' ? 'application/json' : 'text/csv' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusColor = (status: ExpenseStatus) => {
        switch (status) {
            case ExpenseStatus.Draft: return 'bg-gray-100 text-gray-800';
            case ExpenseStatus.Submitted: return 'bg-blue-100 text-blue-800';
            case ExpenseStatus.Approved: return 'bg-green-100 text-green-800';
            case ExpenseStatus.Reimbursed: return 'bg-purple-100 text-purple-800';
            case ExpenseStatus.Rejected: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Expense Tracking</h1>
                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                    >
                        Export CSV
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="statusFilter">Filter by Status</Label>
                            <Select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | '')}
                            >
                                <option value="">All Statuses</option>
                                {Object.values(ExpenseStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="projectFilter">Filter by Project</Label>
                            <Select
                                id="projectFilter"
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                            >
                                <option value="">All Projects</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expense Analytics */}
            <ExpenseAnalytics />

            {/* Expenses List */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Project</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(expense => {
                                    const project = projects.find(p => p.id === expense.projectId);
                                    const phase = projectPhases.find(p => p.id === expense.phaseId);
                                    
                                    return (
                                        <tr key={expense.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{formatDate(expense.date)}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium">{expense.description}</p>
                                                    {phase && (
                                                        <p className="text-xs text-gray-500">Phase: {phase.name}</p>
                                                    )}
                                                    {expense.vendor && (
                                                        <p className="text-xs text-gray-500">Vendor: {expense.vendor}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {formatCurrency(expense.amount, expense.currency)}
                                            </td>
                                            <td className="px-6 py-4">{expense.category}</td>
                                            <td className="px-6 py-4">{project?.name || 'No Project'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                                                    {expense.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setViewingExpense(expense)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setEditingExpense(expense)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this expense?')) {
                                                                deleteExpense(expense.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredExpenses.length === 0 && (
                            <p className="text-center text-slate-500 py-10">No expenses found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Modal 
                isOpen={isCreateModalOpen || !!editingExpense} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingExpense(null);
                }}
                title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
            >
                <ExpenseForm
                    expense={editingExpense || undefined}
                    onSave={handleSaveExpense}
                    onCancel={() => {
                        setIsCreateModalOpen(false);
                        setEditingExpense(null);
                    }}
                />
            </Modal>

            {/* View Modal */}
            {viewingExpense && (
                <Modal
                    isOpen={true}
                    onClose={() => setViewingExpense(null)}
                    title="Expense Details"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date</Label>
                                <p className="font-medium">{formatDate(viewingExpense.date)}</p>
                            </div>
                            <div>
                                <Label>Amount</Label>
                                <p className="font-medium">{formatCurrency(viewingExpense.amount, viewingExpense.currency)}</p>
                            </div>
                            <div>
                                <Label>Category</Label>
                                <p className="font-medium">{viewingExpense.category}</p>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingExpense.status)}`}>
                                    {viewingExpense.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <p className="font-medium">{viewingExpense.description}</p>
                        </div>

                        {viewingExpense.vendor && (
                            <div>
                                <Label>Vendor</Label>
                                <p className="font-medium">{viewingExpense.vendor}</p>
                            </div>
                        )}

                        {viewingExpense.notes && (
                            <div>
                                <Label>Notes</Label>
                                <p className="font-medium">{viewingExpense.notes}</p>
                            </div>
                        )}

                        {viewingExpense.tags.length > 0 && (
                            <div>
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {viewingExpense.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ReceiptManager expense={viewingExpense} />

                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setViewingExpense(null)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                setEditingExpense(viewingExpense);
                                setViewingExpense(null);
                            }}>
                                Edit Expense
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
