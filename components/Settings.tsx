
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Label, Input, Textarea } from './ui/index';
import { useAppContext } from '../App';
import type { BillerInfo } from '../types';

const GoogleDriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.4,8.3,12,17.5,6.6,8.3,9.45,3.5,14.55,3.5ZM8.5,4.5l-4,6.9,3.5,6.1,4-6.9ZM15.5,4.5,12,9.6l3.5,6,4-6.9Z" opacity=".7"/>
        <path d="M12,17.5,6.6,8.3,1.75,12,12,22,22.25,12Z"/>
    </svg>
);


const BillerInfoForm = () => {
    const { billerInfo, updateBillerInfo } = useAppContext();
    const [formState, setFormState] = useState<BillerInfo>(billerInfo);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setFormState(billerInfo);
    }, [billerInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaveState('saving');
        updateBillerInfo(formState);
        setTimeout(() => setSaveState('saved'), 500);
        setTimeout(() => setSaveState('idle'), 2500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <Label htmlFor="name">Your Name / Company Name</Label>
                <Input id="name" name="name" value={formState.name} onChange={handleChange} placeholder="e.g. Acme Freelancing Co."/>
            </div>
             <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={formState.address} onChange={handleChange} placeholder="123 Main St, Anytown, USA 12345" rows={3}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formState.email} onChange={handleChange} placeholder="you@example.com"/>
                </div>
                 <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formState.phone} onChange={handleChange} placeholder="(555) 123-4567"/>
                </div>
            </div>
             <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input id="website" name="website" value={formState.website} onChange={handleChange} placeholder="www.your-freelance-site.com"/>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={saveState === 'saving'}>
                    {saveState === 'saving' && 'Saving...'}
                    {saveState === 'saved' && 'Saved!'}
                    {saveState === 'idle' && 'Save Biller Info'}
                </Button>
            </div>
        </form>
    );
};

export default function Settings() {
    const [isDriveConnected, setIsDriveConnected] = useState(false);

    // In a real app, this would use the context to get all data.
    const handleExport = () => {
        const data = {
            clients: JSON.parse(localStorage.getItem('clients') || '[]'),
            projects: JSON.parse(localStorage.getItem('projects') || '[]'),
            timeEntries: JSON.parse(localStorage.getItem('timeEntries') || '[]'),
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            billerInfo: JSON.parse(localStorage.getItem('billerInfo') || '{}'),
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `protracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Settings</h1>
            
            <div className="space-y-8 max-w-4xl">
                 <Card>
                    <CardHeader>
                        <CardTitle>Biller Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 mb-4">This information will appear on your invoices.</p>
                        <BillerInfoForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 mb-4">Export all your data to a single JSON file. You can import this file later to restore your data.</p>
                        <div className="flex space-x-4">
                            <Button variant="secondary" onClick={handleExport}>Export Data (JSON)</Button>
                             <Button variant="secondary" onClick={() => alert('Import functionality coming soon!')}>Import Data (JSON)</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Integrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <GoogleDriveIcon />
                                <div>
                                    <h3 className="font-semibold text-slate-800">Google Drive Integration</h3>
                                    <p className="text-sm text-slate-500">
                                        {isDriveConnected 
                                            ? "Your data is being backed up to Google Drive."
                                            : "Automatically back up your invoices and data to Google Drive."
                                        }
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant={isDriveConnected ? 'secondary' : 'primary'}
                                onClick={() => setIsDriveConnected(prev => !prev)}
                            >
                                {isDriveConnected ? 'Disconnect' : 'Connect'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}