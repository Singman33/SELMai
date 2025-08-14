import React from 'react';
import { useError } from '../context/ErrorContext';

const ErrorDisplay: React.FC = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) {
    return null;
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'error': return '#fee';
      case 'warning': return '#fff3cd';
      case 'success': return '#d4edda';
      case 'info': return '#d1ecf1';
      default: return '#fee';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'error': return '#fcc';
      case 'warning': return '#ffeaa7';
      case 'success': return '#c3e6cb';
      case 'info': return '#bee5eb';
      default: return '#fcc';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'error': return '#c33';
      case 'warning': return '#856404';
      case 'success': return '#155724';
      case 'info': return '#0c5460';
      default: return '#c33';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
      width: '100%'
    }}>
      {errors.map((error) => (
        <div
          key={error.id}
          style={{
            backgroundColor: getBackgroundColor(error.type),
            color: getTextColor(error.type),
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            border: `1px solid ${getBorderColor(error.type)}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {error.message}
              </div>
              {error.details && (
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  {error.details}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                {new Date(error.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => removeError(error.id)}
              style={{
                background: 'none',
                border: 'none',
                color: getTextColor(error.type),
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '0',
                opacity: 0.7
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorDisplay;