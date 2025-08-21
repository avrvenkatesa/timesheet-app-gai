
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useAppContext } from '../App';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Label } from './ui';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// --- Helper Components ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
);

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="secondary" size="sm" onClick={handleCopy} className="absolute top-2 right-2">
            {copied ? 'Copied!' : 'Copy'}
        </Button>
    );
};


// --- AI Tool: Project Description Generator ---
const ProjectDescriptionGenerator = () => {
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!projectName.trim()) {
            setError('Please enter a project name.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const prompt = `Generate a professional and concise project description for a freelance project titled '${projectName}'. The description should be suitable for a client proposal or project management tool. Focus on the key objectives and deliverables.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error(e);
            setError('Failed to generate description. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Project Description Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="projectName">Project Name or Keywords</Label>
                    <Input id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g., E-commerce website redesign" />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Description'}
                </Button>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {result && (
                    <div className="relative">
                        <Textarea value={result} readOnly rows={6} className="bg-slate-50"/>
                        <CopyButton textToCopy={result} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- AI Tool: Client Email Composer ---
const ClientEmailComposer = () => {
    const { clients, projects } = useAppContext();
    const [emailType, setEmailType] = useState('Project Kickoff');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!selectedClientId) {
            setError('Please select a client.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        const client = clients.find(c => c.id === selectedClientId);

        try {
            const prompt = `You are a professional freelancer. Compose a '${emailType}' email to the client '${client?.name}'. Here are some key points to include: '${context}'. The email should be clear, courteous, and professional.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            body: { type: Type.STRING }
                        },
                        required: ["subject", "body"]
                    }
                }
            });

            const jsonString = response.text.trim();
            setResult(JSON.parse(jsonString));

        } catch (e) {
            console.error(e);
            setError('Failed to compose email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Client Email Composer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="emailType">Email Type</Label>
                        <Select id="emailType" value={emailType} onChange={e => setEmailType(e.target.value)}>
                            <option>Project Kickoff</option>
                            <option>Invoice Reminder</option>
                            <option>Weekly Update</option>
                            <option>Project Proposal</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="client">Client</Label>
                        <Select id="client" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                            <option value="" disabled>Select a client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="context">Additional Context (optional)</Label>
                    <Textarea id="context" value={context} onChange={e => setContext(e.target.value)} placeholder="e.g., Attach the signed contract, invoice #INV-0005 is overdue" rows={3}/>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Composing...' : 'Compose Email'}
                </Button>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {result && (
                     <div className="relative border rounded-lg p-4 bg-slate-50 space-y-4">
                        <CopyButton textToCopy={`Subject: ${result.subject}\n\n${result.body}`} />
                        <div>
                            <p className="text-sm font-medium text-slate-600">Subject</p>
                            <p className="font-semibold">{result.subject}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">Body</p>
                            <p className="whitespace-pre-wrap">{result.body}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


// --- AI Tool: Task Breakdown Generator ---
const TaskBreakdownGenerator = () => {
    const { projects } = useAppContext();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!selectedProjectId) {
            setError('Please select a project.');
            return;
        }
        setIsLoading(true);
        setError('');
        setTasks([]);
        
        const project = projects.find(p => p.id === selectedProjectId);

        try {
            const prompt = `Generate a list of common tasks required to complete the following freelance project: '${project?.name}' - '${project?.description}'.`;

             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                           tasks: {
                               type: Type.ARRAY,
                               items: { type: Type.STRING }
                           }
                        },
                        required: ["tasks"]
                    }
                }
            });
            const jsonString = response.text.trim();
            const parsed = JSON.parse(jsonString);
            setTasks(parsed.tasks);
        } catch (e) {
            console.error(e);
            setError('Failed to generate tasks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Task Breakdown Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="project">Project</Label>
                    <Select id="project" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                        <option value="" disabled>Select a project</option>
                        {projects.filter(p => p.status === 'Active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Tasks'}
                </Button>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {tasks.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {tasks.map((task, index) => (
                            <div key={index} className="flex items-center">
                                <input type="checkbox" id={`task-${index}`} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                <label htmlFor={`task-${index}`} className="ml-2 text-slate-700">{task}</label>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Main AI Assistant Component ---
export default function AIAssistant() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">AI Assistant</h1>
                <p className="text-slate-500 mt-1">Your smart partner for streamlining freelance tasks.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <ProjectDescriptionGenerator />
                <ClientEmailComposer />
                <TaskBreakdownGenerator />
            </div>
        </div>
    );
}