и5/** @jsx jsx */
import { jsx, React } from 'jimu-core';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../components/CloseIcon/CloseIcon';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    isLoading?: boolean;
    error?: string | null;
    maxWidth?: string;
    maxHeight?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    isLoading = false,
    error = null,
    maxWidth = '800px',
    maxHeight = '90vh'
}) => {
    if (!isOpen) return null;

    // Add CSS animation for spinner
    const spinnerStyle = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    return createPortal(
        <div>
            <style>{spinnerStyle}</style>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                }}
                onClick={onClose}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: maxWidth,
                        maxHeight: maxHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid #e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#212529'
                        }}>
                            {title}
                        </h2>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#6c757d',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.color = '#495057';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6c757d';
                            }}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'scroll'
                    }}>
                        {isLoading ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '60px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f3f3',
                                        borderTop: '4px solid #0d6efd',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 16px'
                                    }}></div>
                                    <p style={{ color: '#6c757d', margin: 0 }}>
                                        Carregando dados...
                                    </p>
                                </div>
                            </div>
                        ) : error ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '60px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>тЪая╕П</div>
                                    <p style={{ color: '#dc3545', margin: 0, fontSize: '16px' }}>
                                        {error}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                flex: 1,
                                padding: '24px',

                            }}>
                                {children}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BaseModal;и52_file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/components/BaseModal.tsx