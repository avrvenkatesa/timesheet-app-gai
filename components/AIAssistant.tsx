

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useAppContext } from '../App';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Label } from './ui';
import type { Contract, Expense, BusinessInsight, PricingSuggestion } from '../types';
import { ContractType, ExpenseCategory, Currency, InsightType } from '../types';

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

// --- Contract Generator ---
const ContractGenerator = () => {
    const { clients, projects, addContract } = useAppContext();
    const [contractType, setContractType] = useState<ContractType>(ContractType.ServiceAgreement);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [projectDetails, setProjectDetails] = useState('');
    const [customRequirements, setCustomRequirements] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<Contract | null>(null);
    const [error, setError] = useState('');

    const clientProjects = projects.filter(p => p.clientId === selectedClientId);
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const handleGenerate = async () => {
        if (!selectedClientId) {
            setError('Please select a client.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const contextInfo = {
                client: selectedClient,
                project: selectedProject,
                projectDetails,
                customRequirements,
                contractType
            };

            const prompt = `Generate a professional ${contractType} contract for client "${selectedClient?.name}". 
            ${selectedProject ? `Project: ${selectedProject.name} - ${selectedProject.description}` : ''}
            ${projectDetails ? `Additional project details: ${projectDetails}` : ''}
            ${customRequirements ? `Custom requirements: ${customRequirements}` : ''}
            
            Include standard clauses for scope of work, payment terms, intellectual property, termination, and liability. 
            Make it legally sound but readable. Include placeholders for specific details that need to be filled in.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING }
                        },
                        required: ["title", "content"]
                    }
                }
            });

            const jsonString = response.text.trim();
            const contractData = JSON.parse(jsonString);
            
            const newContract: Contract = {
                id: `contract_${Date.now()}`,
                clientId: selectedClientId,
                projectId: selectedProjectId || undefined,
                contractType,
                title: contractData.title,
                content: contractData.content,
                status: 'Draft',
                createdDate: new Date().toISOString().split('T')[0],
                value: selectedProject?.hourlyRate,
                currency: selectedProject?.currency
            };

            setResult(newContract);
            if (addContract) {
                addContract(newContract);
            }

        } catch (e) {
            console.error(e);
            setError('Failed to generate contract. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Contract Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="contractType">Contract Type</Label>
                        <Select 
                            id="contractType" 
                            value={contractType} 
                            onChange={e => setContractType(e.target.value as ContractType)}
                        >
                            {Object.values(ContractType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="client">Client</Label>
                        <Select 
                            id="client" 
                            value={selectedClientId} 
                            onChange={e => setSelectedClientId(e.target.value)}
                        >
                            <option value="" disabled>Select a client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                </div>
                
                {selectedClientId && clientProjects.length > 0 && (
                    <div>
                        <Label htmlFor="project">Project (Optional)</Label>
                        <Select 
                            id="project" 
                            value={selectedProjectId} 
                            onChange={e => setSelectedProjectId(e.target.value)}
                        >
                            <option value="">No specific project</option>
                            {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                )}

                <div>
                    <Label htmlFor="projectDetails">Project Details</Label>
                    <Textarea 
                        id="projectDetails" 
                        value={projectDetails} 
                        onChange={e => setProjectDetails(e.target.value)} 
                        placeholder="Describe the scope, deliverables, timeline..."
                        rows={3}
                    />
                </div>

                <div>
                    <Label htmlFor="customRequirements">Custom Requirements</Label>
                    <Textarea 
                        id="customRequirements" 
                        value={customRequirements} 
                        onChange={e => setCustomRequirements(e.target.value)} 
                        placeholder="Any specific terms, conditions, or clauses..."
                        rows={2}
                    />
                </div>

                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating Contract...' : 'Generate Contract'}
                </Button>

                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {result && (
                    <div className="relative border rounded-lg p-4 bg-slate-50 space-y-4">
                        <CopyButton textToCopy={result.content} />
                        <div>
                            <p className="text-sm font-medium text-slate-600">Contract Title</p>
                            <p className="font-semibold">{result.title}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">Contract Content</p>
                            <div className="max-h-64 overflow-y-auto bg-white p-3 rounded border">
                                <pre className="whitespace-pre-wrap text-sm">{result.content}</pre>
                            </div>
                        </div>
                        <p className="text-xs text-green-600">Contract saved to your records as draft.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Expense Categorizer ---
const ExpenseCategorizer = () => {
    const { addExpense } = useAppContext();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>(Currency.USD);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<Partial<Expense> | null>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!description.trim() || !amount) {
            setError('Please enter description and amount.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestion(null);

        try {
            const prompt = `Analyze this expense: "${description}" for amount ${amount} ${currency}. 
            Categorize it and determine if it's a business expense. Provide business expense determination and category from: 
            ${Object.values(ExpenseCategory).join(', ')}. Also suggest relevant tags.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            isBusinessExpense: { type: Type.BOOLEAN },
                            reasoning: { type: Type.STRING },
                            suggestedTags: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            }
                        },
                        required: ["category", "isBusinessExpense", "reasoning", "suggestedTags"]
                    }
                }
            });

            const jsonString = response.text.trim();
            const analysis = JSON.parse(jsonString);
            
            const expenseSuggestion: Partial<Expense> = {
                description,
                amount: parseFloat(amount),
                currency,
                category: analysis.category as ExpenseCategory,
                isBusinessExpense: analysis.isBusinessExpense,
                tags: analysis.suggestedTags,
                date: new Date().toISOString().split('T')[0],
                aiSuggested: true
            };

            setSuggestion({ ...expenseSuggestion, reasoning: analysis.reasoning });

        } catch (e) {
            console.error(e);
            setError('Failed to analyze expense. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveExpense = () => {
        if (suggestion && addExpense) {
            const { reasoning, ...expenseData } = suggestion;
            addExpense(expenseData as Omit<Expense, 'id'>);
            setDescription('');
            setAmount('');
            setSuggestion(null);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Smart Expense Categorizer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="expenseDesc">Expense Description</Label>
                    <Input 
                        id="expenseDesc"
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="e.g., Adobe Creative Suite subscription, Coffee meeting with client"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input 
                            id="amount"
                            type="number" 
                            step="0.01"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select 
                            id="currency"
                            value={currency} 
                            onChange={e => setCurrency(e.target.value as Currency)}
                        >
                            {Object.values(Currency).map(curr => (
                                <option key={curr} value={curr}>{curr}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <Button onClick={handleAnalyze} disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Analyze & Categorize'}
                </Button>

                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {suggestion && (
                    <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                        <h4 className="font-semibold text-blue-900">AI Analysis Results</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Category:</span> {suggestion.category}
                            </div>
                            <div>
                                <span className="font-medium">Business Expense:</span> 
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                    suggestion.isBusinessExpense ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {suggestion.isBusinessExpense ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="font-medium">Reasoning:</span> 
                            <p className="text-sm text-slate-600 mt-1">{(suggestion as any).reasoning}</p>
                        </div>
                        <div>
                            <span className="font-medium">Suggested Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {suggestion.tags?.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <Button onClick={handleSaveExpense} size="sm">Save Expense</Button>
                            <Button variant="secondary" size="sm" onClick={() => setSuggestion(null)}>
                                Reject
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Business Insights Generator ---
const BusinessInsightsGenerator = () => {
    const { timeEntries, projects, clients, invoices, generateBusinessInsights } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<BusinessInsight[]>([]);
    const [error, setError] = useState('');

    const handleGenerateInsights = async () => {
        setIsLoading(true);
        setError('');
        setInsights([]);

        try {
            // Prepare data summary for AI analysis
            const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
            const billableHours = timeEntries.filter(e => e.isBillable).reduce((sum, entry) => sum + entry.hours, 0);
            const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
            const avgHourlyRate = projects.reduce((sum, p) => sum + p.hourlyRate, 0) / projects.length;
            
            const dataContext = {
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'Active').length,
                totalClients: clients.length,
                totalHours,
                billableHours,
                billabilityRate: (billableHours / totalHours) * 100,
                totalRevenue,
                avgHourlyRate,
                recentActivity: timeEntries.slice(0, 10)
            };

            const prompt = `Analyze this freelance business data and provide actionable insights:
            ${JSON.stringify(dataContext, null, 2)}
            
            Generate 3-5 business insights covering areas like revenue optimization, productivity, client relationships, 
            pricing strategy, and time management. Each insight should include title, description, impact level, and be actionable.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            insights: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        impact: { type: Type.STRING },
                                        actionable: { type: Type.BOOLEAN }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const jsonString = response.text.trim();
            const analysis = JSON.parse(jsonString);
            
            const businessInsights: BusinessInsight[] = analysis.insights.map((insight: any, index: number) => ({
                id: `insight_${Date.now()}_${index}`,
                type: insight.type as InsightType,
                title: insight.title,
                description: insight.description,
                impact: insight.impact,
                actionable: insight.actionable,
                data: dataContext,
                generatedDate: new Date().toISOString().split('T')[0]
            }));

            setInsights(businessInsights);
            if (generateBusinessInsights) {
                generateBusinessInsights(businessInsights);
            }

        } catch (e) {
            console.error(e);
            setError('Failed to generate insights. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High': return 'bg-red-100 text-red-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Business Insights</CardTitle>
                    <Button onClick={handleGenerateInsights} disabled={isLoading} size="sm">
                        {isLoading ? 'Analyzing...' : 'Generate Insights'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {insights.length > 0 && (
                    <div className="space-y-4">
                        {insights.map(insight => (
                            <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                                    <div className="flex space-x-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactColor(insight.impact)}`}>
                                            {insight.impact} Impact
                                        </span>
                                        {insight.actionable && (
                                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                                Actionable
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">{insight.description}</p>
                                <div className="text-xs text-slate-400">
                                    Generated on {new Date(insight.generatedDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Smart Pricing Assistant ---
const SmartPricingAssistant = () => {
    const { projects, timeEntries, generatePricingSuggestion } = useAppContext();
    const [projectType, setProjectType] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null);
    const [error, setError] = useState('');

    const handleGeneratePricing = async () => {
        if (!projectType.trim() || !projectDescription.trim()) {
            setError('Please provide project type and description.');
            return;
        }

        setIsLoading(true);
        setError('');
        setPricingSuggestion(null);

        try {
            // Analyze historical data for similar projects
            const historicalData = projects.map(project => {
                const projectTimeEntries = timeEntries.filter(e => e.projectId === project.id);
                const totalHours = projectTimeEntries.reduce((sum, e) => sum + e.hours, 0);
                return {
                    name: project.name,
                    description: project.description,
                    hourlyRate: project.hourlyRate,
                    currency: project.currency,
                    totalHours,
                    category: project.category || 'General'
                };
            });

            const prompt = `Based on this historical project data:
            ${JSON.stringify(historicalData, null, 2)}
            
            Suggest pricing for a new project:
            Type: ${projectType}
            Description: ${projectDescription}
            Estimated Hours: ${estimatedHours || 'Not specified'}
            
            Provide hourly rate suggestion, optional fixed price, confidence level (0-100), 
            reasoning, and list of similar historical projects used for the recommendation.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggestedHourlyRate: { type: Type.NUMBER },
                            suggestedFixedPrice: { type: Type.NUMBER },
                            confidence: { type: Type.NUMBER },
                            reasoning: { type: Type.STRING },
                            basedOnProjects: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            }
                        },
                        required: ["suggestedHourlyRate", "confidence", "reasoning", "basedOnProjects"]
                    }
                }
            });

            const jsonString = response.text.trim();
            const pricing = JSON.parse(jsonString);
            
            const suggestion: PricingSuggestion = {
                projectType,
                suggestedHourlyRate: pricing.suggestedHourlyRate,
                suggestedFixedPrice: pricing.suggestedFixedPrice || undefined,
                confidence: pricing.confidence,
                reasoning: pricing.reasoning,
                basedOnProjects: pricing.basedOnProjects
            };

            setPricingSuggestion(suggestion);
            if (generatePricingSuggestion) {
                generatePricingSuggestion(suggestion);
            }

        } catch (e) {
            console.error(e);
            setError('Failed to generate pricing suggestion. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-600';
        if (confidence >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card>
            <CardHeader><CardTitle>Smart Pricing Assistant</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Input 
                        id="projectType"
                        value={projectType} 
                        onChange={e => setProjectType(e.target.value)} 
                        placeholder="e.g., Website Development, Mobile App, Logo Design"
                    />
                </div>
                
                <div>
                    <Label htmlFor="projectDescription">Project Description</Label>
                    <Textarea 
                        id="projectDescription"
                        value={projectDescription} 
                        onChange={e => setProjectDescription(e.target.value)} 
                        placeholder="Describe the scope, complexity, requirements..."
                        rows={3}
                    />
                </div>

                <div>
                    <Label htmlFor="estimatedHours">Estimated Hours (Optional)</Label>
                    <Input 
                        id="estimatedHours"
                        type="number"
                        value={estimatedHours} 
                        onChange={e => setEstimatedHours(e.target.value)} 
                        placeholder="0"
                    />
                </div>

                <Button onClick={handleGeneratePricing} disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Get Pricing Suggestion'}
                </Button>

                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {pricingSuggestion && (
                    <div className="border rounded-lg p-4 bg-green-50 space-y-3">
                        <h4 className="font-semibold text-green-900">Pricing Recommendation</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium">Suggested Hourly Rate:</span>
                                <p className="text-xl font-bold text-green-700">${pricingSuggestion.suggestedHourlyRate}/hr</p>
                            </div>
                            {pricingSuggestion.suggestedFixedPrice && (
                                <div>
                                    <span className="text-sm font-medium">Suggested Fixed Price:</span>
                                    <p className="text-xl font-bold text-green-700">${pricingSuggestion.suggestedFixedPrice}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <span className="text-sm font-medium">Confidence Level:</span>
                            <p className={`text-lg font-semibold ${getConfidenceColor(pricingSuggestion.confidence)}`}>
                                {pricingSuggestion.confidence}%
                            </p>
                        </div>

                        <div>
                            <span className="text-sm font-medium">Reasoning:</span>
                            <p className="text-sm text-slate-600 mt-1">{pricingSuggestion.reasoning}</p>
                        </div>

                        {pricingSuggestion.basedOnProjects.length > 0 && (
                            <div>
                                <span className="text-sm font-medium">Based on Similar Projects:</span>
                                <ul className="text-sm text-slate-600 mt-1 list-disc list-inside">
                                    {pricingSuggestion.basedOnProjects.map((project, index) => (
                                        <li key={index}>{project}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Enhanced Client Email Composer ---
const EnhancedClientEmailComposer = () => {
    const { clients, projects, timeEntries, invoices } = useAppContext();
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
        const clientProjects = projects.filter(p => p.clientId === selectedClientId);
        const clientTimeEntries = timeEntries.filter(e => 
            clientProjects.some(p => p.id === e.projectId)
        );
        const clientInvoices = invoices.filter(i => i.clientId === selectedClientId);

        // Prepare context-aware information
        const clientContext = {
            client: client?.name,
            activeProjects: clientProjects.filter(p => p.status === 'Active').length,
            recentWork: clientTimeEntries.slice(0, 3),
            unpaidInvoices: clientInvoices.filter(i => i.status !== 'Paid'),
            totalWorkedHours: clientTimeEntries.reduce((sum, e) => sum + e.hours, 0)
        };

        try {
            const prompt = `You are a professional freelancer. Compose a context-aware '${emailType}' email to client '${client?.name}'. 
            
            Client context: ${JSON.stringify(clientContext, null, 2)}
            Additional context: ${context}
            
            Make the email professional, personalized based on the client history, and include relevant details about their projects, 
            work completed, or outstanding items. The tone should be courteous and professional.`;
            
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
            <CardHeader><CardTitle>Context-Aware Email Composer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="emailType">Email Type</Label>
                        <Select id="emailType" value={emailType} onChange={e => setEmailType(e.target.value)}>
                            <option>Project Kickoff</option>
                            <option>Progress Update</option>
                            <option>Invoice Follow-up</option>
                            <option>Project Completion</option>
                            <option>Contract Renewal</option>
                            <option>Payment Reminder</option>
                            <option>Meeting Request</option>
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
                    <Label htmlFor="context">Additional Context</Label>
                    <Textarea 
                        id="context" 
                        value={context} 
                        onChange={e => setContext(e.target.value)} 
                        placeholder="Any specific details, updates, or requests..."
                        rows={3}
                    />
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Composing...' : 'Compose Smart Email'}
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
                            <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm">{result.body}</pre>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Main AI Assistant Component ---
export default function AIAssistant() {
    const [activeTab, setActiveTab] = useState<'contracts' | 'expenses' | 'insights' | 'pricing' | 'emails'>('contracts');

    const tabButtonClass = (tab: string) => 
        `px-4 py-2 font-medium rounded-lg transition-colors ${
            activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Enhanced AI Assistant</h1>
                <p className="text-slate-500 mt-1">Advanced AI capabilities for contract generation, expense management, business insights, and more.</p>
            </div>

            <div className="flex flex-wrap space-x-1 bg-slate-100 p-1 rounded-lg mb-6">
                <button onClick={() => setActiveTab('contracts')} className={tabButtonClass('contracts')}>
                    Contracts
                </button>
                <button onClick={() => setActiveTab('expenses')} className={tabButtonClass('expenses')}>
                    Expenses
                </button>
                <button onClick={() => setActiveTab('insights')} className={tabButtonClass('insights')}>
                    Insights
                </button>
                <button onClick={() => setActiveTab('pricing')} className={tabButtonClass('pricing')}>
                    Pricing
                </button>
                <button onClick={() => setActiveTab('emails')} className={tabButtonClass('emails')}>
                    Emails
                </button>
            </div>

            <div>
                {activeTab === 'contracts' && <ContractGenerator />}
                {activeTab === 'expenses' && <ExpenseCategorizer />}
                {activeTab === 'insights' && <BusinessInsightsGenerator />}
                {activeTab === 'pricing' && <SmartPricingAssistant />}
                {activeTab === 'emails' && <EnhancedClientEmailComposer />}
            </div>
        </div>
    );
}
