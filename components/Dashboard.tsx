
import React from 'react';
import type { View } from '../types';
import { useAppContext } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from './ui/index';

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
    const { timeEntries, projects, clients } = useAppContext();

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
            </div>

            <div className="mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeEntries.slice(0, 5).map(entry => {
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