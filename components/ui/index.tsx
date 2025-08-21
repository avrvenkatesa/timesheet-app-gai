
import React, { ReactNode } from 'react';

// --- Loading Spinner ---
export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    return (
        <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-primary-500 ${sizeClasses[size]} ${className}`} role="status" aria-label="Loading">
            <span className="sr-only">Loading...</span>
        </div>
    );
};

// --- Card ---
export const Card = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200 ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={`text-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors duration-200 ${className}`} {...props}>
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
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:pointer-events-none';
        const variantClasses = {
            primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md',
            secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400 border border-slate-300 dark:border-slate-600',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
        };
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };
        
        return (
            <button 
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} 
                ref={ref} 
                disabled={disabled || loading}
                aria-busy={loading}
                {...props}
            >
                {loading && <LoadingSpinner size="sm" className="mr-2" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';


// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    helperText?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, helperText, ...props }, ref) => (
        <div className="w-full">
            <input
                className={`flex h-10 w-full rounded-md border transition-colors duration-200 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${
                    error 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-400 focus:border-red-400' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-primary-400 focus:border-primary-400'
                } ${className}`}
                ref={ref}
                aria-invalid={error}
                aria-describedby={helperText ? `${props.id}-helper` : undefined}
                {...props}
            />
            {helperText && (
                <p 
                    id={`${props.id}-helper`} 
                    className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {helperText}
                </p>
            )}
        </div>
    )
);
Input.displayName = 'Input';

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    helperText?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, helperText, ...props }, ref) => (
        <div className="w-full">
            <textarea
                className={`flex min-h-[80px] w-full rounded-md border transition-colors duration-200 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                    error 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-400 focus:border-red-400' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-primary-400 focus:border-primary-400'
                } ${className}`}
                ref={ref}
                aria-invalid={error}
                aria-describedby={helperText ? `${props.id}-helper` : undefined}
                {...props}
            />
            {helperText && (
                <p 
                    id={`${props.id}-helper`} 
                    className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {helperText}
                </p>
            )}
        </div>
    )
);
Textarea.displayName = 'Textarea';

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    helperText?: string;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, error, helperText, ...props }, ref) => (
        <div className="w-full">
            <select
                className={`flex h-10 w-full items-center justify-between rounded-md border transition-colors duration-200 bg-white dark:bg-slate-800 py-2 px-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${
                    error 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-400 focus:border-red-400' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-primary-400 focus:border-primary-400'
                } ${className}`}
                ref={ref}
                aria-invalid={error}
                aria-describedby={helperText ? `${props.id}-helper` : undefined}
                {...props}
            >
                {children}
            </select>
            {helperText && (
                <p 
                    id={`${props.id}-helper`} 
                    className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {helperText}
                </p>
            )}
        </div>
    )
);
Select.displayName = 'Select';

// --- Label ---
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, required, children, ...props }, ref) => (
        <label
            className={`text-sm font-medium leading-none text-slate-700 dark:text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200 ${className}`}
            ref={ref}
            {...props}
        >
            {children}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
    )
);
Label.displayName = 'Label';

// --- Alert Component ---
export const Alert = ({ type = 'info', children, className = '', onDismiss }: { 
    type?: 'success' | 'error' | 'warning' | 'info'; 
    children: ReactNode; 
    className?: string;
    onDismiss?: () => void;
}) => {
    const typeClasses = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    };

    return (
        <div className={`p-4 border rounded-md transition-colors duration-200 ${typeClasses[type]} ${className}`} role="alert">
            <div className="flex items-start justify-between">
                <div className="flex-1">{children}</div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-3 -mx-1.5 -my-1.5 rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Modal ---
export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: ReactNode; 
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="printable-modal-wrapper fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className={`printable-modal-dialog relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transition-colors duration-200`} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="no-print flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700 rounded-t flex-shrink-0">
                    <h3 id="modal-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button 
                        type="button" 
                        className="text-slate-400 dark:text-slate-500 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center transition-colors duration-200" 
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="no-print flex items-center justify-end p-6 space-x-2 border-t border-slate-200 dark:border-slate-700 rounded-b flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
