ö◊/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
//@ts-ignore
import { http } from '../http/http';
import { PageResponse } from '../types/Imobiliario';
//@ts-ignore
import CloseIcon from '../assets/fecharVermelho.png';

interface GenericSearchConfig<T> {
    title: string;
    placeholder: string;
    searchUrl: string; // e.g., 'bairro/all/containing' or 'logradouro/all/containing'
    searchField: string; // The field to search by (e.g., 'nmbairro', 'nmlogradouro')
    displayFields: {
        primary: string; // Main field to display (e.g., 'nmbairro')
        secondary?: string[]; // Additional fields to display
    };
    emptyStateMessage: string;
    loadingMessage: string;
    getItemKey: (item: T) => string; // Function to get unique key for each item
    minSearchLength?: number; // Minimum search term length (default: 3)
    backendPort?: number; // Porta do backend (default: 8080)
    useQueryString?: boolean; // Se true, usa query string (?field=value) em vez de path parameter (/value)
    enableSubFilters?: boolean; // Habilita sub-filtros din√¢micos
    subFilterOptions?: Array<{ field: string; label: string }>; // Op√ß√µes de campos para sub-filtro
    onSubFilterSearch?: (filters: Record<string, string>, page?: number, size?: number) => Promise<any>; // Fun√ß√£o customizada de busca com filtros
}

interface GenericSearchModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (item: T) => void;
    config: GenericSearchConfig<T>;
}

function GenericSearchModal<T extends Record<string, any>>({
    isOpen,
    onClose,
    onSelectItem,
    config
}: GenericSearchModalProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<T[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Helper function to build URL with custom port
    const buildUrl = (path: string): string => {
        const port = config.backendPort || 8080;
        return `http://localhost:${port}/${path}`;
    };

    // Estados para sub-filtros
    const [showSubFilterModal, setShowSubFilterModal] = useState(false);
    const [selectedSubFilters, setSelectedSubFilters] = useState<string[]>([]);
    const [subFilterValues, setSubFilterValues] = useState<Record<string, string>>({});
    const [hasActiveSubFilters, setHasActiveSubFilters] = useState(false);

    const searchItems = useCallback(async (term: string, page: number = 0) => {
        const minLength = config.minSearchLength ?? 3;
        if (!term || term.length < minLength) {
            setResults([]);
            setTotalPages(0);
            setTotalElements(0);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Se useQueryString for true, usa query string, caso contr√°rio usa path parameter
            const url = config.useQueryString
                ? buildUrl(config.searchUrl)
                : buildUrl(`${config.searchUrl}/${encodeURIComponent(term)}`);

            const params = config.useQueryString
                ? {
                    [config.searchField]: term,
                    page: page,
                    size: 10,
                    sort: 'asc'
                }
                : {
                    page: page,
                    size: 10,
                    sort: `${config.searchField},asc`
                };

            const response = await http.get<PageResponse<T>>(
                url,
                { params }
            );

            setResults(response.data.content);
            const pageSize = response.data.pageable.pageSize;
            const calculatedTotalPages = Math.ceil(response.data.total / pageSize);
            setTotalPages(calculatedTotalPages);
            setTotalElements(response.data.total);
            setCurrentPage(response.data.pageable.pageNumber);
        } catch (error) {
            console.error(`Erro ao buscar ${config.title.toLowerCase()}:`, error);
            setError(`Erro ao buscar ${config.title.toLowerCase()}. Tente novamente.`);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [config]);

    // Fun√ß√£o para aplicar sub-filtros
    const applySubFilters = useCallback(async (page: number = 0) => {
        if (!config.onSubFilterSearch || !hasActiveSubFilters) return;

        setIsLoading(true);
        setError(null);

        try {
            // Monta objeto com todos os filtros (principal + sub-filtros)
            const allFilters: Record<string, string> = {
                [config.searchField]: searchTerm
            };

            // Adiciona sub-filtros preenchidos
            Object.entries(subFilterValues).forEach(([key, value]) => {
                if (value && value.trim()) {
                    allFilters[key] = value.trim();
                }
            });

            const response = await config.onSubFilterSearch(allFilters, page, 10);

            setResults(response.content || []);
            const calculatedTotalPages = Math.ceil((response.total || 0) / 10);
            setTotalPages(calculatedTotalPages);
            setTotalElements(response.total || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error('Erro ao aplicar sub-filtros:', error);
            setError('Erro ao aplicar filtros. Tente novamente.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [config, searchTerm, subFilterValues, hasActiveSubFilters]);

    // Abre modal de sele√ß√£o de sub-filtros
    const handleOpenSubFilterModal = () => {
        setShowSubFilterModal(true);
    };

    // Confirma sele√ß√£o de sub-filtros no modal
    const handleConfirmSubFilters = () => {
        setShowSubFilterModal(false);
        setHasActiveSubFilters(selectedSubFilters.length > 0);

        // Inicializa valores vazios para os campos selecionados
        const initialValues: Record<string, string> = {};
        selectedSubFilters.forEach(field => {
            initialValues[field] = subFilterValues[field] || '';
        });
        setSubFilterValues(initialValues);
    };

    // Limpa sub-filtros
    const handleClearSubFilters = () => {
        setSelectedSubFilters([]);
        setSubFilterValues({});
        setHasActiveSubFilters(false);
        // Volta para busca normal
        searchItems(searchTerm, 0);
    };

    // Toggle sele√ß√£o de campo no modal
    const toggleSubFilterField = (field: string) => {
        setSelectedSubFilters(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchItems(searchTerm, 0);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchItems]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            if (hasActiveSubFilters) {
                applySubFilters(newPage);
            } else {
                searchItems(searchTerm, newPage);
            }
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999
            }}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    width: '90vw',
                    maxWidth: '800px',
                    height: '80vh',
                    maxHeight: '700px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div>
                        <h2 style={{
                            margin: '0 0 4px 0',
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#212529'
                        }}>
                            {config.title}
                        </h2>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                            {config.placeholder}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e9ecef';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <img src={CloseIcon} alt="Fechar" style={{ width: '16px', height: '16px' }} />
                    </button>
                </div>

                {/* Search Section */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`${config.placeholder} (m√≠nimo 3 caracteres)...`}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#0d6efd';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#ced4da';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />

                    {/* Bot√£o Escolher Subfiltro */}
                    {config.enableSubFilters && config.subFilterOptions && results.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={handleOpenSubFilterModal}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: hasActiveSubFilters ? '#198754' : '#0d6efd',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = hasActiveSubFilters ? '#157347' : '#0b5ed7';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = hasActiveSubFilters ? '#198754' : '#0d6efd';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>{hasActiveSubFilters ? '‚úì' : 'üîç'}</span>
                                <span>{hasActiveSubFilters ? 'Filtros Ativos' : 'Escolher Subfiltro'}</span>
                            </button>

                            {hasActiveSubFilters && (
                                <button
                                    onClick={handleClearSubFilters}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#bb2d3b';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#dc3545';
                                    }}
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* Campos de Sub-filtro Din√¢micos */}
                    {hasActiveSubFilters && selectedSubFilters.length > 0 && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
                        }}>
                            <div style={{
                                marginBottom: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#495057',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Filtros Adicionais
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {selectedSubFilters.map(field => {
                                    const option = config.subFilterOptions.find(opt => opt.field === field);
                                    return (
                                        <div key={field}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: '#6c757d',
                                                marginBottom: '4px'
                                            }}>
                                                {option?.label || field}
                                            </label>
                                            <input
                                                type="text"
                                                value={subFilterValues[field] || ''}
                                                onChange={(e) => setSubFilterValues(prev => ({
                                                    ...prev,
                                                    [field]: e.target.value
                                                }))}
                                                placeholder={`Digite ${option?.label || field}...`}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    backgroundColor: 'white'
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => applySubFilters(0)}
                                disabled={isLoading}
                                style={{
                                    marginTop: '12px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: isLoading ? '#6c757d' : '#0d6efd',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = '#0b5ed7';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = '#0d6efd';
                                    }
                                }}
                            >
                                {isLoading ? 'Aplicando Filtros...' : 'Aplicar Filtros'}
                            </button>
                        </div>
                    )}

                    {searchTerm.length > 0 && searchTerm.length < (config.minSearchLength ?? 3) && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffecb5',
                            borderRadius: '4px',
                            color: '#664d03',
                            fontSize: '13px'
                        }}>
                            Digite pelo menos {config.minSearchLength ?? 3} caracteres para buscar
                        </div>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c2c7',
                            borderRadius: '4px',
                            color: '#842029',
                            fontSize: '13px'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Results Info */}
                    {searchTerm.length >= (config.minSearchLength ?? 3) && !isLoading && (
                        <div style={{
                            padding: '16px 24px 0 24px',
                            fontSize: '13px',
                            color: '#6c757d'
                        }}>
                            {totalElements > 0 ? (
                                `${totalElements} ${totalElements !== 1 ? 'itens encontrados' : 'item encontrado'}`
                            ) : (
                                'Nenhum item encontrado'
                            )}
                        </div>
                    )}

                    {/* Results List */}
                    <div style={{
                        flex: 1,
                        padding: '16px 24px',
                        overflowY: 'auto'
                    }}>
                        {isLoading && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '200px',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '3px solid #f3f3f3',
                                    borderTop: '3px solid #0d6efd',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                                    {config.loadingMessage}
                                </p>
                            </div>
                        )}

                        {!isLoading && results.length === 0 && searchTerm.length >= (config.minSearchLength ?? 3) && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>üîç</div>
                                <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                                    Nenhum item encontrado
                                </p>
                                <p style={{ fontSize: '14px', margin: 0 }}>
                                    Tente buscar com termos diferentes
                                </p>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {results.map((item, index) => (
                                    <div
                                        key={config.getItemKey(item)}
                                        style={{
                                            padding: '16px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#0d6efd';
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e9ecef';
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        onClick={() => onSelectItem(item)}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '16px'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{
                                                    margin: '0 0 8px 0',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    color: '#212529'
                                                }}>
                                                    {item[config.displayFields.primary]?.toString()?.trim() || 'N/A'}
                                                </h4>

                                                {config.displayFields.secondary && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                        {config.displayFields.secondary.map((field, fieldIndex) => (
                                                            <div key={fieldIndex}>
                                                                <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                                                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                                                                </span>
                                                                <div style={{ fontSize: '13px', color: '#495057' }}>
                                                                    {item[field]?.toString() || 'N/A'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#e7f3ff',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: '#0969da',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                Ver detalhes ‚Üí
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchTerm.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>üîç</div>
                                <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                                    {config.title}
                                </p>
                                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                                    {config.emptyStateMessage}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && !isLoading && (
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>
                                P√°gina {currentPage + 1} de {totalPages}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        backgroundColor: currentPage === 0 ? '#f8f9fa' : 'white',
                                        color: currentPage === 0 ? '#6c757d' : '#495057',
                                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== 0) {
                                            e.currentTarget.style.backgroundColor = '#e9ecef';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== 0) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    Anterior
                                </button>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        backgroundColor: currentPage >= totalPages - 1 ? '#f8f9fa' : 'white',
                                        color: currentPage >= totalPages - 1 ? '#6c757d' : '#495057',
                                        cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage < totalPages - 1) {
                                            e.currentTarget.style.backgroundColor = '#e9ecef';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage < totalPages - 1) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    Pr√≥xima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `
            }} />
        </div>
    );

    // Modal de sele√ß√£o de sub-filtros
    const subFilterModal = showSubFilterModal && config.enableSubFilters && config.subFilterOptions ? (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                width: '90vw',
                maxWidth: '500px',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#212529'
                    }}>
                        Escolher Campos para Filtrar
                    </h3>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13px',
                        color: '#6c757d'
                    }}>
                        Selecione os campos que deseja usar como filtro adicional
                    </p>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 24px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {config.subFilterOptions.map(option => (
                            <label
                                key={option.field}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    border: selectedSubFilters.includes(option.field) ? '2px solid #0d6efd' : '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedSubFilters.includes(option.field) ? '#e7f3ff' : 'white',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!selectedSubFilters.includes(option.field)) {
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!selectedSubFilters.includes(option.field)) {
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                        e.currentTarget.style.backgroundColor = 'white';
                                    }
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSubFilters.includes(option.field)}
                                    onChange={() => toggleSubFilterField(option.field)}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: selectedSubFilters.includes(option.field) ? '600' : '500',
                                    color: selectedSubFilters.includes(option.field) ? '#0d6efd' : '#495057'
                                }}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e9ecef',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={() => {
                            setShowSubFilterModal(false);
                            setSelectedSubFilters([]);
                        }}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#5c636a';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#6c757d';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmSubFilters}
                        disabled={selectedSubFilters.length === 0}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: selectedSubFilters.length === 0 ? '#adb5bd' : '#0d6efd',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: selectedSubFilters.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedSubFilters.length > 0) {
                                e.currentTarget.style.backgroundColor = '#0b5ed7';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedSubFilters.length > 0) {
                                e.currentTarget.style.backgroundColor = '#0d6efd';
                            }
                        }}
                    >
                        Confirmar ({selectedSubFilters.length})
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return createPortal(
        <div>
            {modalContent}
            {subFilterModal}
        </div>,
        document.body
    );
}

export default GenericSearchModal;· ··
·∂ ∂∂
∂’ ’’
’’ ’’
’¿ ¿¿
¿±* ±*±*
±*⁄1 ⁄1⁄1
⁄1Ú< 
Ú<Ù< Ù<¯<
¯<Å= 
Å=ë= 
ë=õ= õ=ü=
ü=©= ©=≠=
≠=Ÿ= Ÿ=›=
›=Ê= Ê=È=
È=ı= ı=ˆ=
ˆ=Ä> Ä>Ñ>
Ñ>°> °>¢>
¢>Æ> Æ>±>
±>√> √>«>
«>á? á?ã?
ã?ù? ù?ü?
ü?´? ´?≠?
≠?ƒ? ƒ?»?
»?˚? ˚?ˇ?
ˇ?é@ é@ë@
ë@ô@ ô@ö@
ö@Ø@ 
Ø@ı@ 
ı@ˆ@ ˆ@˜@
˜@ÅA ÅAÖA
ÖA∞A ∞A±A
±A¡A ¡AƒA
ƒA€A €AﬂA
ﬂA≠B ≠B±B
±B¡B ¡B√B
√B”B ”B’B
’B‡B ‡B·B
·B˘B ˘B˝B
˝BéC éCèC
èCüC üC¢C
¢C∑C ∑C∫C
∫C C  CÀC
ÀC›C ›C·C
·CõD õDüD
üD≥D ≥D∑D
∑D˛n ˛n˛n˛nÕ¢ 
Õ¢Õ¢Õ¢º¥ 
º¥º¥º¥Û‹ 
Û‹Û‹Û‹í˙ 
í˙í˙í˙ö◊ 2hfile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/components/GenericSearchModal.tsx