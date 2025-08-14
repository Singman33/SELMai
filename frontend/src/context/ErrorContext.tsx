import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ErrorMessage {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  timestamp: number;
  details?: string;
}

interface ErrorContextType {
  errors: ErrorMessage[];
  addError: (message: string, type?: 'error' | 'warning' | 'success' | 'info', details?: string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);

  const addError = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'error', details?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const error: ErrorMessage = {
      id,
      message,
      type,
      timestamp: Date.now(),
      details
    };

    setErrors(prev => [...prev, error]);

    // Auto-remove après 10 secondes pour les messages de succès et info
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        removeError(id);
      }, 10000);
    }
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};