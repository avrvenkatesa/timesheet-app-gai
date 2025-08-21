
import React, { ReactNode } from 'react';

// --- Card ---
export const Card = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-4 sm:p-6 border-b border-slate-200 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={`text-lg font-semibold text-slate-800 ${className}`} {...props}>
        {children}
    </h2>
);

export const CardContent = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-4 sm:p-6 ${className}`} {...props}>
        {children}
    </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
        const variantClasses = {
            primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
        };
        const sizeClasses = {
            sm: 'px-3 py-1.5',
            md: 'px-4 py-2',
        };
        return <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} ref={ref} {...props} />;
    }
);
Button.displayName = 'Button';


// --- Input ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    )
);
Input.displayName = 'Input';

// --- Textarea ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            className={`flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    )
);
Textarea.displayName = 'Textarea';

// --- Select ---
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, ...props }, ref) => (
        <select
            className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        >
            {children}
        </select>
    )
);
Select.displayName = 'Select';

// --- Label ---
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            className={`text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
            ref={ref}
            {...props}
        />
    )
);
Label.displayName = 'Label';


// --- Modal ---
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between p-5 border-b rounded-t">
                    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                    <button type="button" className="text-slate-400 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" onClick={onClose}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
