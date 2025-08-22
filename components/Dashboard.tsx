import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useAppContext, useTheme } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from './ui/index';
import { DollarSignIcon, ClockIcon } from 'lucide-react'; // Assuming these icons are available

// Define View type if not already defined in context or App.tsx
type View = 'dashboard' | 'timesheet' | 'projects' | 'clients' | 'invoicing' | 'expenses';
// Define InvoiceStatus enum if not already defined
enum InvoiceStatus {
    Draft = 'Draft',
    Sent = 'Sent',
    Paid = 'Paid',
    Void = 'Void',
    Overdue = 'Overdue'
}

const StatCard = ({ title, value, unit }: { title: string, value: string | number, unit: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base font-medium text-slate-500">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold text-slate-800">
                {value} <span className="text-lg font-normal text-slate-500">{unit}</span>
            </p>
        </CardContent>
    </Card>
);


export default function Dashboard({ setView }: { setView: React.Dispatch<React.SetStateAction<View>> }) {
    const {
        clients,
        projects,
        timeEntries,
        invoices,
        expenses, // Added expenses to context
        billerInfo
    } = useAppContext();

    const getTotalHours = (entries: typeof timeEntries) => {
        return entries.reduce((acc, entry) => acc + entry.hours, 0).toFixed(2);
    };

    const getBillableHours = (entries: typeof timeEntries) => {
        return entries.filter(e => e.isBillable).reduce((acc, entry) => acc + entry.hours, 0).toFixed(2);
    };

    const getUnbilledAmount = () => {
        const unbilledEntries = timeEntries.filter(t => t.isBillable && !t.invoiceId);
        const amountByCurrency: { [key: string]: number } = {};

        unbilledEntries.forEach(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            if (project) {
                const amount = entry.hours * project.hourlyRate;
                if (amountByCurrency[project.currency]) {
                    amountByCurrency[project.currency] += amount;
                } else {
                    amountByCurrency[project.currency] = amount;
                }
            }
        });

        return Object.entries(amountByCurrency).map(([currency, amount]) => {
            try {
                if (!currency) return amount.toFixed(2);
                return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
            } catch (e) {
                return `${amount.toFixed(2)} ${currency}`;
            }
        }).join(' + ');
    };

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekEntries = timeEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    const thisMonthEntries = timeEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= startOfMonth;
    });

    const getProjectCompletionRate = () => {
        const projectsWithTasks = projects.filter(p => p.tasks && p.tasks.length > 0);
        if (projectsWithTasks.length === 0) return 0;

        const totalTasks = projectsWithTasks.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
        const completedTasks = projectsWithTasks.reduce((sum, p) =>
            sum + (p.tasks?.filter(t => t.isCompleted).length || 0), 0
        );

        return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    };

    // Calculate recent activity and statistics
    const recentTimeEntries = timeEntries.slice(0, 5);
    const totalHoursThisMonth = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).reduce((sum, entry) => sum + entry.hours, 0);

    const billableHoursThisMonth = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.isBillable && entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).reduce((sum, entry) => sum + entry.hours, 0);

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const pendingRevenue = invoices.filter(inv => inv.status !== InvoiceStatus.Paid).reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    // Expense calculations
    const totalExpensesThisMonth = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const pendingReimbursements = expenses.filter(expense =>
        expense.status === 'Submitted' || expense.status === 'Approved'
    ).reduce((sum, expense) => sum + expense.amount, 0);

    const getMonthlyRevenue = () => {
        const billableEntries = thisMonthEntries.filter(e => e.isBillable);
        let totalRevenue = 0;

        billableEntries.forEach(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            if (project) {
                totalRevenue += entry.hours * project.hourlyRate;
            }
        });

        return totalRevenue;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 transition-colors duration-200">Dashboard</h1>
                <div className="mt-3 sm:mt-0 text-sm text-slate-600 dark:text-slate-400">
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <StatCard title="Hours Logged (Week)" value={getTotalHours(thisWeekEntries)} unit="hrs" />
                <StatCard title="Billable Hours (Week)" value={getBillableHours(thisWeekEntries)} unit="hrs" />
                <StatCard title="Monthly Revenue" value={`$${getMonthlyRevenue().toFixed(0)}`} unit="" />
                <StatCard title="Total Unbilled" value={getUnbilledAmount() || '$0.00'} unit="" />
                <StatCard title="Project Completion" value={`${getProjectCompletionRate().toFixed(1)}%`} unit="" />

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('invoicing')}>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 rounded-lg bg-green-100">
                                    <DollarSignIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('invoicing')}>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 rounded-lg bg-yellow-100">
                                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pending Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">${pendingRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('expenses')}>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 rounded-lg bg-red-100">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Monthly Expenses</p>
                                    <p className="text-2xl font-bold text-gray-900">${totalExpensesThisMonth.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('expenses')}>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pending Reimbursements</p>
                                    <p className="text-2xl font-bold text-gray-900">${pendingReimbursements.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
            </div>

            <div className="mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTimeEntries.map(entry => {
                            const project = projects.find(p => p.id === entry.projectId);
                            const client = project ? clients.find(c => c.id === project.clientId) : null;
                            return (
                                <div key={entry.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0">
                                    <div>
                                        <p className="font-medium text-slate-800">{entry.description}</p>
                                        <p className="text-sm text-slate-500">{client?.name} - {project?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-800">{entry.hours} hrs</p>
                                        <p className="text-sm text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                         {timeEntries.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}