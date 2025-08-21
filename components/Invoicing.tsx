import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../App';
import type { Invoice, Client, TimeEntry, Project, Payment, RecurringInvoiceTemplate, Currency, ExchangeRate } from '../types';
import { InvoiceStatus, PaymentStatus, RecurringFrequency } from '../types';
import { Button, Modal, Select, Label, Card, CardHeader, CardTitle, CardContent, Input } from './ui/index';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>;
const RepeatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;

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
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
};

// Payment Modal Component
const PaymentModal = ({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) => {
    const { addPayment, payments } = useAppContext();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
    const remainingAmount = invoice.totalAmount - invoice.paidAmount;

    const handleSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        if (parseFloat(amount) > remainingAmount) {
            alert('Payment amount cannot exceed the remaining balance');
            return;
        }

        addPayment({
            invoiceId: invoice.id,
            amount: parseFloat(amount),
            currency: invoice.currency,
            paymentDate,
            paymentMethod,
            notes
        });

        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Record Payment">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="amount">Payment Amount</Label>
                    <Input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        max={remainingAmount}
                        step="0.01"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Remaining: {formatCurrency(remainingAmount, invoice.currency)}
                    </p>
                </div>

                <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                        type="text"
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="Bank Transfer, Credit Card, Cash, etc."
                    />
                </div>

                <div>
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                        type="date"
                        id="paymentDate"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                        type="text"
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes about the payment"
                    />
                </div>

                {invoicePayments.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Previous Payments</h4>
                        <div className="max-h-32 overflow-y-auto border rounded p-2">
                            {invoicePayments.map(payment => (
                                <div key={payment.id} className="flex justify-between text-sm py-1">
                                    <span>{formatDate(payment.paymentDate)}</span>
                                    <span>{formatCurrency(payment.amount, payment.currency)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>Record Payment</Button>
                </div>
            </div>
        </Modal>
    );
};

// Recurring Template Modal
const RecurringTemplateModal = ({ onClose }: { onClose: () => void }) => {
    const { clients, addRecurringTemplate } = useAppContext();
    const [templateName, setTemplateName] = useState('');
    const [clientId, setClientId] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.Monthly);
    const [hourlyRate, setHourlyRate] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [currency, setCurrency] = useState<Currency>('USD' as Currency);
    const [description, setDescription] = useState('');
    const [daysUntilDue, setDaysUntilDue] = useState('30');
    const [nextGenerationDate, setNextGenerationDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = () => {
        if (!templateName || !clientId || !hourlyRate || !estimatedHours) {
            alert('Please fill in all required fields');
            return;
        }

        addRecurringTemplate({
            templateName,
            clientId,
            frequency,
            hourlyRate: parseFloat(hourlyRate),
            estimatedHours: parseFloat(estimatedHours),
            currency,
            description,
            daysUntilDue: parseInt(daysUntilDue),
            nextGenerationDate,
            isActive: true
        });

        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create Recurring Invoice Template">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                        type="text"
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Monthly Retainer - Client Name"
                    />
                </div>

                <div>
                    <Label htmlFor="clientSelect">Client *</Label>
                    <Select id="clientSelect" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                            id="frequency"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                        >
                            {Object.values(RecurringFrequency).map(freq => (
                                <option key={freq} value={freq}>{freq}</option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="nextGeneration">Next Generation Date</Label>
                        <Input
                            type="date"
                            id="nextGeneration"
                            value={nextGenerationDate}
                            onChange={(e) => setNextGenerationDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                        <Input
                            type="number"
                            id="hourlyRate"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div>
                        <Label htmlFor="estimatedHours">Estimated Hours *</Label>
                        <Input
                            type="number"
                            id="estimatedHours"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            step="0.25"
                            min="0"
                        />
                    </div>

                    <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="INR">INR</option>
                            <option value="CAD">CAD</option>
                            <option value="AUD">AUD</option>
                            <option value="JPY">JPY</option>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label htmlFor="daysUntilDue">Days Until Due</Label>
                    <Input
                        type="number"
                        id="daysUntilDue"
                        value={daysUntilDue}
                        onChange={(e) => setDaysUntilDue(e.target.value)}
                        min="1"
                        max="365"
                    />
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Recurring service description"
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>Create Template</Button>
                </div>
            </div>
        </Modal>
    );
};

// Financial Reports Component
const FinancialReports = () => {
    const { invoices, payments, convertCurrency } = useAppContext();
    const [reportPeriod, setReportPeriod] = useState('thisMonth');
    const [baseCurrency, setBaseCurrency] = useState<Currency>('USD' as Currency);

    const getDateRange = () => {
        const now = new Date();
        let startDate, endDate = now;

        switch (reportPeriod) {
            case 'thisWeek':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'thisQuarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return { startDate, endDate };
    };

    const { startDate, endDate } = getDateRange();

    const reportData = useMemo(() => {
        const periodInvoices = invoices.filter(inv => {
            const issueDate = new Date(inv.issueDate);
            return issueDate >= startDate && issueDate <= endDate;
        });

        const totalRevenue = periodInvoices.reduce((sum, inv) => {
            return sum + convertCurrency(inv.totalAmount, inv.currency, baseCurrency);
        }, 0);

        const totalPaid = periodInvoices.reduce((sum, inv) => {
            return sum + convertCurrency(inv.paidAmount, inv.currency, baseCurrency);
        }, 0);

        const totalOutstanding = totalRevenue - totalPaid;

        const statusBreakdown = periodInvoices.reduce((acc, inv) => {
            acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + 1;
            return acc;
        }, {} as Record<PaymentStatus, number>);

        return {
            totalRevenue,
            totalPaid,
            totalOutstanding,
            invoiceCount: periodInvoices.length,
            statusBreakdown,
            periodInvoices
        };
    }, [invoices, startDate, endDate, baseCurrency, convertCurrency]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Financial Reports</h3>
                <div className="flex space-x-4">
                    <Select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="thisQuarter">This Quarter</option>
                        <option value="thisYear">This Year</option>
                    </Select>
                    <Select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value as Currency)}>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(reportData.totalRevenue, baseCurrency)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-gray-500">Paid Amount</h4>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(reportData.totalPaid, baseCurrency)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-gray-500">Outstanding</h4>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(reportData.totalOutstanding, baseCurrency)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-gray-500">Invoice Count</h4>
                        <p className="text-2xl font-bold text-gray-700">
                            {reportData.invoiceCount}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(reportData.statusBreakdown).map(([status, count]) => (
                            <div key={status} className="text-center">
                                <p className="text-lg font-semibold">{count}</p>
                                <p className="text-sm text-gray-500">{status}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Enhanced Invoice Detail Modal
const InvoiceDetailModal = ({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) => {
    const { billerInfo, clients, projects, timeEntries, updateInvoice, payments } = useAppContext();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const client = clients.find(c => c.id === invoice.clientId);
    const invoiceEntries = timeEntries.filter(t => invoice.timeEntryIds.includes(t.id));
    const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);

    const total = useMemo(() => {
        // Always use the stored total amount from the invoice
        return formatCurrency(invoice.totalAmount, invoice.currency);
    }, [invoice.totalAmount, invoice.currency]);

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

            const pageWidth = 210;
            const pageHeight = 297;
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

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'text-green-600';
            case PaymentStatus.PartiallyPaid: return 'text-yellow-600';
            case PaymentStatus.Overdue: return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const modalFooter = (
        <>
            <Button type="button" variant="secondary" onClick={handleSaveAsPdf} disabled={isSaving}>
                 {isSaving ? 'Saving...' : <><SaveIcon /> Save as PDF</>}
            </Button>
            {invoice.paymentStatus !== PaymentStatus.Paid && (
                <Button type="button" onClick={() => setShowPaymentModal(true)}>
                    <DollarIcon /> Record Payment
                </Button>
            )}
            {invoice.status === InvoiceStatus.Draft && <Button type="button" onClick={() => handleUpdateStatus(InvoiceStatus.Sent)}>Mark as Sent</Button>}
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </>
    );

    return (
        <>
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
                                <div>
                                    <p className="text-sm text-slate-500">Payment Status</p>
                                    <p className={`font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                                        {invoice.paymentStatus}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {invoiceEntries.length > 0 ? (
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
                    ) : (
                        <div className="border rounded p-4 mb-6">
                            <p className="font-medium text-slate-800">{invoice.notes || 'Service Invoice'}</p>
                            <p className="text-right font-medium text-lg mt-2">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
                        </div>
                    )}

                    <div className="flex justify-end mt-8">
                         <div className="w-full max-w-sm">
                             <div className="border-t-2 border-slate-200 mt-4 pt-4 space-y-2">
                                 <div className="flex justify-between">
                                    <span>Total</span>
                                    <span className="font-medium">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Paid</span>
                                    <span className="font-medium text-green-600">
                                        -{formatCurrency(invoice.paidAmount, invoice.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Balance Due</span>
                                    <span className="text-primary-600">
                                        {formatCurrency(invoice.totalAmount - invoice.paidAmount, invoice.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {invoicePayments.length > 0 && (
                        <div className="mt-8">
                            <h4 className="font-medium text-slate-800 mb-3">Payment History</h4>
                            <div className="space-y-1">
                                {invoicePayments.map(payment => (
                                    <div key={payment.id} className="flex justify-between text-sm">
                                        <span>{formatDate(payment.paymentDate)} - {payment.paymentMethod}</span>
                                        <span>{formatCurrency(payment.amount, payment.currency)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            {showPaymentModal && (
                <PaymentModal invoice={invoice} onClose={() => setShowPaymentModal(false)} />
            )}
        </>
    );
};

// Enhanced Invoice Creator
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
    const [isManualInvoice, setIsManualInvoice] = useState(false);
    const [manualAmount, setManualAmount] = useState('');
    const [manualCurrency, setManualCurrency] = useState<Currency>('USD' as Currency);
    const [description, setDescription] = useState('');

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
        if (!isManualInvoice && selectedEntryIds.length === 0) {
            alert('Please select at least one time entry to include in the invoice.');
            return;
        }

        if (isManualInvoice && (!manualAmount || parseFloat(manualAmount) <= 0)) {
            alert('Please enter a valid invoice amount.');
            return;
        }

        // Calculate total amount for time-based invoices
        let calculatedTotal = 0;
        let invoiceCurrency: Currency = 'USD' as Currency;

        if (!isManualInvoice && selectedEntryIds.length > 0) {
            selectedEntryIds.forEach(id => {
                const entry = unbilledEntries.find(e => e.id === id);
                const project = entry ? projects.find(p => p.id === entry.projectId) : null;
                if (entry && project) {
                    calculatedTotal += entry.hours * project.hourlyRate;
                    invoiceCurrency = project.currency; // Use the first project's currency
                }
            });
        }

        onSave({
            clientId: selectedClientId,
            issueDate,
            dueDate,
            status: InvoiceStatus.Draft,
            paymentStatus: PaymentStatus.Unpaid,
            timeEntryIds: isManualInvoice ? [] : selectedEntryIds,
            totalAmount: isManualInvoice ? parseFloat(manualAmount) : calculatedTotal,
            currency: isManualInvoice ? manualCurrency : invoiceCurrency,
            paidAmount: 0,
            isRecurring: false,
            notes: isManualInvoice ? description : undefined
        });
    };

    const invoiceTotal = useMemo(() => {
        if (isManualInvoice) {
            return manualAmount ? formatCurrency(parseFloat(manualAmount), manualCurrency) : '$0.00';
        }

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
    }, [selectedEntryIds, unbilledEntries, projects, isManualInvoice, manualAmount, manualCurrency]);

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
                    <div className="flex items-center space-x-4 mb-4">
                        <Label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isManualInvoice}
                                onChange={(e) => setIsManualInvoice(e.target.checked)}
                                className="mr-2"
                            />
                            Create manual invoice (fixed amount)
                        </Label>
                    </div>

                    {isManualInvoice ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="manualAmount">Invoice Amount</Label>
                                    <Input
                                        type="number"
                                        id="manualAmount"
                                        value={manualAmount}
                                        onChange={(e) => setManualAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="manualCurrency">Currency</Label>
                                    <Select
                                        id="manualCurrency"
                                        value={manualCurrency}
                                        onChange={(e) => setManualCurrency(e.target.value as Currency)}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="INR">INR</option>
                                        <option value="CAD">CAD</option>
                                        <option value="AUD">AUD</option>
                                        <option value="JPY">JPY</option>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    type="text"
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Service description"
                                />
                            </div>
                        </div>
                    ) : (
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
                <Button 
                    type="button" 
                    onClick={handleSubmit} 
                    disabled={!selectedClientId || (!isManualInvoice && selectedEntryIds.length === 0) || (isManualInvoice && !manualAmount)}
                >
                    Create Invoice
                </Button>
            </div>
        </div>
    );
};

// Main Component
export default function Invoicing() {
    const { invoices, clients, projects, timeEntries, createInvoice, recurringTemplates, generateRecurringInvoices } = useAppContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [activeTab, setActiveTab] = useState<'invoices' | 'recurring' | 'reports'>('invoices');

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

    // Generate recurring invoices on component mount
    useEffect(() => {
        generateRecurringInvoices();
    }, [generateRecurringInvoices]);

    const handleSave = (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
        createInvoice(data);
        setIsCreateModalOpen(false);
    };

    const getInvoiceTotal = (invoice: Invoice) => {
        return formatCurrency(invoice.totalAmount, invoice.currency);
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-green-100 text-green-800';
            case PaymentStatus.PartiallyPaid: return 'bg-yellow-100 text-yellow-800';
            case PaymentStatus.Overdue: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
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
                <h1 className="text-3xl font-bold text-slate-800">Invoicing & Financial Management</h1>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => setIsRecurringModalOpen(true)}>
                        <RepeatIcon /> Recurring Templates
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon /> Create Invoice
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'invoices'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('recurring')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'recurring'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Recurring Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'reports'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Financial Reports
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'invoices' && (
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
                                        <th scope="col" className="px-6 py-3 text-center">Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(invoice => {
                                        const client = clients.find(c => c.id === invoice.clientId);
                                        return (
                                            <tr key={invoice.id} className="bg-white border-b hover:bg-slate-50 cursor-pointer" onClick={() => setViewingInvoice(invoice)}>
                                                <td className="px-6 py-4 font-medium text-primary-600">
                                                    {invoice.invoiceNumber}
                                                    {invoice.isRecurring && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">R</span>}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-900">{client?.name}</td>
                                                <td className="px-6 py-4">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-900">{getInvoiceTotal(invoice)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[invoice.status]}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                                                        {invoice.paymentStatus}
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
            )}

            {activeTab === 'recurring' && (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Template Name</th>
                                        <th scope="col" className="px-6 py-3">Client</th>
                                        <th scope="col" className="px-6 py-3">Frequency</th>
                                        <th scope="col" className="px-6 py-3">Next Generation</th>
                                        <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recurringTemplates.map(template => {
                                        const client = clients.find(c => c.id === template.clientId);
                                        return (
                                            <tr key={template.id} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{template.templateName}</td>
                                                <td className="px-6 py-4">{client?.name}</td>
                                                <td className="px-6 py-4">{template.frequency}</td>
                                                <td className="px-6 py-4">{new Date(template.nextGenerationDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {formatCurrency(template.estimatedHours * template.hourlyRate, template.currency)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {template.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             {recurringTemplates.length === 0 && (
                                <p className="text-center text-slate-500 py-10">No recurring templates created yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'reports' && <FinancialReports />}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Invoice">
                <InvoiceCreator onSave={handleSave} onCancel={() => setIsCreateModalOpen(false)} />
            </Modal>

            {isRecurringModalOpen && (
                <RecurringTemplateModal onClose={() => setIsRecurringModalOpen(false)} />
            )}

            {viewingInvoice && (
                <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
            )}
        </div>
    );
}