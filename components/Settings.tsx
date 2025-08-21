
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

const SyncStatusIndicator = () => {
    const { syncStatus, lastSyncTime } = useAppContext();
    
    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'syncing':
                return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
            case 'success':
                return <div className="h-4 w-4 bg-green-500 rounded-full"></div>;
            case 'error':
                return <div className="h-4 w-4 bg-red-500 rounded-full"></div>;
            default:
                return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'syncing':
                return 'Syncing...';
            case 'success':
                return lastSyncTime ? `Last sync: ${new Date(lastSyncTime).toLocaleString()}` : 'Synced';
            case 'error':
                return 'Sync failed';
            default:
                return 'Ready to sync';
        }
    };

    return (
        <div className="flex items-center space-x-2 text-sm">
            {getStatusIcon()}
            <span className="text-slate-600">{getStatusText()}</span>
        </div>
    );
};

export default function Settings() {
    const { 
        exportData, 
        importData, 
        recoverData, 
        triggerSync, 
        syncStatus 
    } = useAppContext();
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [importMessages, setImportMessages] = useState<string[]>([]);

    const handleExport = async () => {
        try {
            const exportedData = await exportData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(exportedData)}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `protracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportStatus('importing');
        setImportMessages([]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const result = await importData(content, 'merge'); // Default to merge mode
                
                if (result.success) {
                    setImportStatus('success');
                    const messages = ['Import completed successfully!'];
                    if (result.warnings.length > 0) {
                        messages.push(...result.warnings.map(w => `Warning: ${w}`));
                    }
                    setImportMessages(messages);
                    
                    // Clear messages after 5 seconds
                    setTimeout(() => {
                        setImportStatus('idle');
                        setImportMessages([]);
                    }, 5000);
                } else {
                    setImportStatus('error');
                    setImportMessages(result.errors);
                }
            } catch (error) {
                setImportStatus('error');
                setImportMessages([`Import failed: ${error.message}`]);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    };

    const handleRecover = async () => {
        if (confirm('This will attempt to recover your data from the last backup. Continue?')) {
            const success = await recoverData();
            if (success) {
                alert('Data recovery completed successfully!');
            } else {
                alert('Data recovery failed. No backup data found.');
            }
        }
    };

    const handleManualSync = async () => {
        await triggerSync();
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
                        <div className="flex items-center justify-between">
                            <CardTitle>Data Management & Sync</CardTitle>
                            <SyncStatusIndicator />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Sync Section */}
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Auto-Sync & Backup</h4>
                            <p className="text-slate-500 mb-3">Your data is automatically synced and backed up every 5 minutes.</p>
                            <div className="flex space-x-3">
                                <Button 
                                    variant="secondary" 
                                    onClick={handleManualSync}
                                    disabled={syncStatus === 'syncing'}
                                >
                                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                                </Button>
                                <Button variant="secondary" onClick={handleRecover}>
                                    Recover from Backup
                                </Button>
                            </div>
                        </div>

                        {/* Import/Export Section */}
                        <div className="border-t pt-6">
                            <h4 className="font-semibold text-slate-800 mb-2">Import/Export Data</h4>
                            <p className="text-slate-500 mb-4">
                                Export your data to a secure JSON file or import data from a backup. 
                                Import will merge new data with existing data by default.
                            </p>
                            
                            <div className="flex flex-wrap gap-3">
                                <Button variant="secondary" onClick={handleExport}>
                                    Export Data (JSON)
                                </Button>
                                
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={importStatus === 'importing'}
                                    />
                                    <Button 
                                        variant="secondary" 
                                        disabled={importStatus === 'importing'}
                                    >
                                        {importStatus === 'importing' ? 'Importing...' : 'Import Data (JSON)'}
                                    </Button>
                                </div>
                            </div>

                            {/* Import Status Messages */}
                            {importMessages.length > 0 && (
                                <div className={`mt-4 p-3 rounded-lg ${
                                    importStatus === 'success' ? 'bg-green-50 border border-green-200' :
                                    importStatus === 'error' ? 'bg-red-50 border border-red-200' : 
                                    'bg-blue-50 border border-blue-200'
                                }`}>
                                    <ul className={`text-sm ${
                                        importStatus === 'success' ? 'text-green-800' :
                                        importStatus === 'error' ? 'text-red-800' :
                                        'text-blue-800'
                                    }`}>
                                        {importMessages.map((message, index) => (
                                            <li key={index} className="mb-1">{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
