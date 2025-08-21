
import React, { useState } from 'react';
import { useAppContext } from '../App';
import type { TimeReport, RevenueReport, ProjectAnalytics } from '../types';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select } from './ui/index';

// --- ICONS ---
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

// --- Analytics Dashboard ---
const AnalyticsDashboard = () => {
    const { timeEntries, projects, clients, invoices } = useAppContext();

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthEntries = timeEntries.filter(e => new Date(e.date) >= thisMonth);
    const lastMonthEntries = timeEntries.filter(e => {
        const date = new Date(e.date);
        return date >= lastMonth && date < thisMonth;
    });

    const calculateMetrics = (entries: typeof timeEntries) => {
        const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
        const billableHours = entries.filter(e => e.isBillable).reduce((sum, e) => sum + e.hours, 0);
        const billableRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
        
        let totalRevenue = 0;
        entries.filter(e => e.isBillable).forEach(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            if (project) {
                totalRevenue += entry.hours * project.hourlyRate;
            }
        });
        
        return { totalHours, billableHours, billableRate, totalRevenue };
    };

    const thisMonthMetrics = calculateMetrics(thisMonthEntries);
    const lastMonthMetrics = calculateMetrics(lastMonthEntries);

    const KPICard = ({ title, value, change, icon }: { title: string; value: string; change: number; icon: React.ReactNode }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">{title}</p>
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                    </div>
                    <div className="text-slate-400">{icon}</div>
                </div>
                <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-2`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last month
                </div>
            </CardContent>
        </Card>
    );

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Hours"
                    value={thisMonthMetrics.totalHours.toFixed(1)}
                    change={calculateChange(thisMonthMetrics.totalHours, lastMonthMetrics.totalHours)}
                    icon={<BarChartIcon />}
                />
                <KPICard
                    title="Billable Rate"
                    value={`${thisMonthMetrics.billableRate.toFixed(1)}%`}
                    change={calculateChange(thisMonthMetrics.billableRate, lastMonthMetrics.billableRate)}
                    icon={<TrendingUpIcon />}
                />
                <KPICard
                    title="Revenue"
                    value={`$${thisMonthMetrics.totalRevenue.toFixed(0)}`}
                    change={calculateChange(thisMonthMetrics.totalRevenue, lastMonthMetrics.totalRevenue)}
                    icon={<TrendingUpIcon />}
                />
                <KPICard
                    title="Active Projects"
                    value={projects.filter(p => p.status === 'Active').length.toString()}
                    change={0}
                    icon={<BarChartIcon />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Projects (This Month)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects
                                .map(project => {
                                    const projectEntries = thisMonthEntries.filter(e => e.projectId === project.id);
                                    const hours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
                                    const revenue = projectEntries.filter(e => e.isBillable).reduce((sum, e) => sum + e.hours * project.hourlyRate, 0);
                                    const client = clients.find(c => c.id === project.clientId);
                                    return { project, hours, revenue, client };
                                })
                                .filter(item => item.hours > 0)
                                .sort((a, b) => b.hours - a.hours)
                                .slice(0, 5)
                                .map(({ project, hours, revenue, client }) => (
                                    <div key={project.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-slate-800">{project.name}</p>
                                            <p className="text-sm text-slate-500">{client?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{hours.toFixed(1)} hrs</p>
                                            <p className="text-sm text-slate-500">${revenue.toFixed(0)}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoices
                                .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                                .slice(0, 5)
                                .map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    return (
                                        <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                            <div>
                                                <p className="font-medium text-slate-800">{invoice.invoiceNumber}</p>
                                                <p className="text-sm text-slate-500">{client?.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- Time Reports ---
const TimeReports = () => {
    const { generateTimeReport, projects, clients } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [groupBy, setGroupBy] = useState<'project' | 'client' | 'date'>('project');
    const [report, setReport] = useState<TimeReport | null>(null);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) return;
        const generatedReport = generateTimeReport(startDate, endDate);
        setReport(generatedReport);
    };

    const exportToCSV = () => {
        if (!report) return;
        
        let csvContent = 'Type,Name,Hours\n';
        
        if (groupBy === 'project') {
            Object.entries(report.byProject).forEach(([projectId, hours]) => {
                const project = projects.find(p => p.id === projectId);
                csvContent += `Project,"${project?.name || 'Unknown'}",${hours}\n`;
            });
        } else if (groupBy === 'client') {
            Object.entries(report.byClient).forEach(([clientId, hours]) => {
                const client = clients.find(c => c.id === clientId);
                csvContent += `Client,"${client?.name || 'Unknown'}",${hours}\n`;
            });
        } else {
            Object.entries(report.byDate).forEach(([date, hours]) => {
                csvContent += `Date,"${date}",${hours}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-report-${report.period.replace(/ /g, '-')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Time Reports</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate Time Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="groupBy">Group By</Label>
                            <Select
                                id="groupBy"
                                value={groupBy}
                                onChange={e => setGroupBy(e.target.value as 'project' | 'client' | 'date')}
                            >
                                <option value="project">Project</option>
                                <option value="client">Client</option>
                                <option value="date">Date</option>
                            </Select>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={handleGenerateReport}>Generate Report</Button>
                        {report && (
                            <Button variant="secondary" onClick={exportToCSV}>
                                <DownloadIcon /> Export CSV
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {report && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Results - {report.period}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-slate-500">Total Hours</p>
                                <p className="text-2xl font-bold">{report.totalHours.toFixed(1)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Billable Hours</p>
                                <p className="text-2xl font-bold">{report.billableHours.toFixed(1)}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {groupBy === 'project' && Object.entries(report.byProject).map(([projectId, hours]) => {
                                const project = projects.find(p => p.id === projectId);
                                return (
                                    <div key={projectId} className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="font-medium">{project?.name || 'Unknown Project'}</span>
                                        <span className="font-semibold">{hours.toFixed(1)} hrs</span>
                                    </div>
                                );
                            })}
                            
                            {groupBy === 'client' && Object.entries(report.byClient).map(([clientId, hours]) => {
                                const client = clients.find(c => c.id === clientId);
                                return (
                                    <div key={clientId} className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="font-medium">{client?.name || 'Unknown Client'}</span>
                                        <span className="font-semibold">{hours.toFixed(1)} hrs</span>
                                    </div>
                                );
                            })}
                            
                            {groupBy === 'date' && Object.entries(report.byDate)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([date, hours]) => (
                                    <div key={date} className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                                        <span className="font-semibold">{hours.toFixed(1)} hrs</span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// --- Revenue Reports ---
const RevenueReports = () => {
    const { generateRevenueReport, projects, clients } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [report, setReport] = useState<RevenueReport | null>(null);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) return;
        const generatedReport = generateRevenueReport(startDate, endDate);
        setReport(generatedReport);
    };

    const formatCurrency = (amount: number, currency?: string) => {
        try {
            if (!currency) return `$${amount.toFixed(2)}`;
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
        } catch (e) {
            return `${amount.toFixed(2)} ${currency}`;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Revenue Reports</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate Revenue Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>

            {report && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Overview - {report.period}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Total Revenue</p>
                                    <p className="text-3xl font-bold">{formatCurrency(report.totalRevenue)}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">By Currency</p>
                                    {Object.entries(report.byCurrency).map(([currency, amount]) => (
                                        <div key={currency} className="flex justify-between">
                                            <span>{currency}</span>
                                            <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(report.byClient)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([clientId, amount]) => {
                                        const client = clients.find(c => c.id === clientId);
                                        return (
                                            <div key={clientId} className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="font-medium">{client?.name || 'Unknown Client'}</span>
                                                <span className="font-semibold">{formatCurrency(amount)}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

// --- Project Profitability ---
const ProjectProfitability = () => {
    const { projects, getProjectAnalytics, clients } = useAppContext();
    const [analytics, setAnalytics] = useState<ProjectAnalytics[]>([]);

    React.useEffect(() => {
        const projectAnalytics = projects.map(project => getProjectAnalytics(project.id));
        setAnalytics(projectAnalytics);
    }, [projects, getProjectAnalytics]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Project Profitability</h2>
            
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Billable Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Completion</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {analytics.map(analysis => {
                                    const project = projects.find(p => p.id === analysis.projectId);
                                    const client = project ? clients.find(c => c.id === project.clientId) : null;
                                    return (
                                        <tr key={analysis.projectId}>
                                            <td className="px-6 py-4 font-medium text-slate-900">{project?.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{client?.name}</td>
                                            <td className="px-6 py-4">{analysis.totalHours.toFixed(1)}</td>
                                            <td className="px-6 py-4">{analysis.billableHours.toFixed(1)}</td>
                                            <td className="px-6 py-4 font-semibold">${analysis.totalRevenue.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.min(analysis.completionPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm">{analysis.completionPercentage.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Main Reports Component ---
export default function Reports() {
    const [activeTab, setActiveTab] = useState<'analytics' | 'time' | 'revenue' | 'profitability'>('analytics');

    const tabButtonClass = (tab: string) => 
        `px-4 py-2 font-medium rounded-lg transition-colors ${
            activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
            </div>

            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('analytics')} className={tabButtonClass('analytics')}>
                    Analytics
                </button>
                <button onClick={() => setActiveTab('time')} className={tabButtonClass('time')}>
                    Time Reports
                </button>
                <button onClick={() => setActiveTab('revenue')} className={tabButtonClass('revenue')}>
                    Revenue Reports
                </button>
                <button onClick={() => setActiveTab('profitability')} className={tabButtonClass('profitability')}>
                    Profitability
                </button>
            </div>

            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'time' && <TimeReports />}
            {activeTab === 'revenue' && <RevenueReports />}
            {activeTab === 'profitability' && <ProjectProfitability />}
        </div>
    );
}
