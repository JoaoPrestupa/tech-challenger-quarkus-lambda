��/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState, useEffect } from 'react';
import { LoteFisicoResponseDTO } from '../../../../../types/Imobiliario';
import BaseModal from '../../../../../components/BaseModal';
import { useLote } from '../hooks/useLote';

interface LoteSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (lote: LoteFisicoResponseDTO) => void;
}

const LoteSearchModal: React.FC<LoteSearchModalProps> = ({ isOpen, onClose, onSelectItem }) => {
    // Estados de busca simples
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de busca avançada
    const [advancedMode, setAdvancedMode] = useState(false);
    const [loteFilter, setLoteFilter] = useState('');
    const [quadraFilter, setQuadraFilter] = useState('');
    const [setorFilter, setSetorFilter] = useState('');

    // Estados gerais
    const [lotes, setLotes] = useState<LoteFisicoResponseDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    const { searchLotesByFilters } = useLote();

    // Busca simples ou avançada
    const performSearch = async (page: number = 0) => {
        if (!advancedMode && !searchTerm.trim()) {
            setLotes([]);
            return;
        }

        if (advancedMode && !loteFilter && !quadraFilter && !setorFilter) {
            setLotes([]);
            return;
        }

        setIsLoading(true);
        try {
            const result = await searchLotesByFilters({
                lote: advancedMode ? loteFilter || undefined : searchTerm || undefined,
                quadra: advancedMode ? quadraFilter || undefined : undefined,
                setor: advancedMode ? setorFilter || undefined : undefined,
                page,
                size: pageSize
            });

            setLotes(result.content || []);
            setTotalPages(result.totalPages || 0);
            setTotalItems(result.total || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error('Erro na busca de lotes:', error);
            setLotes([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce para busca simples
    useEffect(() => {
        if (!advancedMode) {
            const timer = setTimeout(() => {
                if (searchTerm.trim()) {
                    performSearch(0);
                } else {
                    setLotes([]);
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [searchTerm, advancedMode]);

    const handleToggleMode = () => {
        setAdvancedMode(!advancedMode);
        setSearchTerm('');
        setLoteFilter('');
        setQuadraFilter('');
        setSetorFilter('');
        setLotes([]);
        setCurrentPage(0);
    };

    const handleAdvancedSearch = () => {
        performSearch(0);
    };

    const handlePageChange = (newPage: number) => {
        performSearch(newPage);
    };

    const handleSelectLote = (lote: LoteFisicoResponseDTO) => {
        onSelectItem(lote);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Buscar Lote"
            maxWidth="800px"
            maxHeight="90vh"
        >
            <div css={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* Toggle de modo */}
                <div css={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <label css={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        <input
                            type="checkbox"
                            checked={advancedMode}
                            onChange={handleToggleMode}
                            css={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer'
                            }}
                        />
                        🔍 Busca Avançada (Setor + Quadra + Lote)
                    </label>
                    {advancedMode && (
                        <span css={{
                            marginLeft: 'auto',
                            fontSize: '12px',
                            color: '#6c757d',
                            fontStyle: 'italic'
                        }}>
                            Todos os campos são opcionais
                        </span>
                    )}
                </div>

                {/* Busca Simples */}
                {!advancedMode && (
                    <div>
                        <label css={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#495057'
                        }}>
                            Número do Lote
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Digite o número do lote..."
                            css={{
                                width: '100%',
                                padding: '10px 15px',
                                fontSize: '14px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                '&:focus': {
                                    borderColor: '#007bff',
                                    boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
                                }
                            }}
                        />
                    </div>
                )}

                {/* Busca Avançada */}
                {advancedMode && (
                    <div css={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px'
                    }}>
                        <div>
                            <label css={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                Setor
                            </label>
                            <input
                                type="text"
                                value={setorFilter}
                                onChange={(e) => setSetorFilter(e.target.value)}
                                placeholder="Ex: 114"
                                css={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    fontSize: '14px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    '&:focus': {
                                        borderColor: '#007bff',
                                        boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label css={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                Quadra
                            </label>
                            <input
                                type="text"
                                value={quadraFilter}
                                onChange={(e) => setQuadraFilter(e.target.value)}
                                placeholder="Ex: 002"
                                css={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    fontSize: '14px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    '&:focus': {
                                        borderColor: '#007bff',
                                        boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label css={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#495057'
                            }}>
                                Lote
                            </label>
                            <input
                                type="text"
                                value={loteFilter}
                                onChange={(e) => setLoteFilter(e.target.value)}
                                placeholder="Ex: 0017"
                                css={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    fontSize: '14px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    '&:focus': {
                                        borderColor: '#007bff',
                                        boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
                                    }
                                }}
                            />
                        </div>

                        <div css={{
                            display: 'flex',
                            alignItems: 'flex-end'
                        }}>
                            <button
                                onClick={handleAdvancedSearch}
                                css={{
                                    width: '100%',
                                    padding: '10px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    '&:hover': {
                                        backgroundColor: '#0056b3'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#6c757d',
                                        cursor: 'not-allowed'
                                    }
                                }}
                                disabled={!loteFilter && !quadraFilter && !setorFilter}
                            >
                                🔍 Buscar
                            </button>
                        </div>
                    </div>
                )}

                {/* Resultados */}
                {isLoading ? (
                    <div css={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        color: '#6c757d'
                    }}>
                        Buscando lotes...
                    </div>
                ) : lotes.length > 0 ? (
                    <div>
                        <div css={{
                            marginBottom: '15px',
                            fontSize: '14px',
                            color: '#6c757d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                {totalItems} {totalItems === 1 ? 'lote encontrado' : 'lotes encontrados'}
                            </span>
                            {totalPages > 1 && (
                                <span css={{ fontSize: '13px', fontStyle: 'italic' }}>
                                    Mostrando {Math.min(currentPage * pageSize + 1, totalItems)} - {Math.min((currentPage + 1) * pageSize, totalItems)} de {totalItems}
                                </span>
                            )}
                        </div>

                        <div css={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px'
                        }}>
                            {lotes.map((lote) => (
                                <div
                                    key={lote.sqls}
                                    onClick={() => handleSelectLote(lote)}
                                    css={{
                                        padding: '15px',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#f8f9fa',
                                            borderColor: '#007bff',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <div css={{ fontWeight: '600', fontSize: '16px', marginBottom: '5px' }}>
                                        Lote: {lote.lote}
                                    </div>
                                    <div css={{ fontSize: '14px', color: '#6c757d' }}>
                                        Quadra: {lote.quadra} | Setor: {lote.setor} | Inscrição: {lote.inscrmunic}
                                    </div>
                                    {lote.sqls && (
                                        <div css={{ fontSize: '12px', color: '#6c757d', marginTop: '3px' }}>
                                            SQLS: {lote.sqls}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div css={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #dee2e6'
                            }}>
                                {/* Botão Primeira Página */}
                                {totalPages > 3 && currentPage > 1 && (
                                    <button
                                        onClick={() => handlePageChange(0)}
                                        disabled={isLoading}
                                        css={{
                                            padding: '8px 12px',
                                            backgroundColor: isLoading ? '#e9ecef' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s',
                                            '&:hover:not(:disabled)': {
                                                backgroundColor: '#5a6268',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        ⏮ Primeira
                                    </button>
                                )}

                                {/* Botão Anterior */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0 || isLoading}
                                    css={{
                                        padding: '8px 16px',
                                        backgroundColor: currentPage === 0 || isLoading ? '#e9ecef' : '#007bff',
                                        color: currentPage === 0 || isLoading ? '#6c757d' : 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: currentPage === 0 || isLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        '&:hover:not(:disabled)': {
                                            backgroundColor: '#0056b3',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                >
                                    ← Anterior
                                </button>

                                {/* Indicador de Página */}
                                <div css={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '3px',
                                    minWidth: '150px'
                                }}>
                                    <span css={{ fontSize: '14px', color: '#495057', fontWeight: '600' }}>
                                        Página {currentPage + 1} de {totalPages}
                                    </span>
                                    <span css={{ fontSize: '12px', color: '#6c757d' }}>
                                        ({pageSize} por página)
                                    </span>
                                </div>

                                {/* Botão Próxima */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1 || isLoading}
                                    css={{
                                        padding: '8px 16px',
                                        backgroundColor: currentPage >= totalPages - 1 || isLoading ? '#e9ecef' : '#007bff',
                                        color: currentPage >= totalPages - 1 || isLoading ? '#6c757d' : 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: currentPage >= totalPages - 1 || isLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        '&:hover:not(:disabled)': {
                                            backgroundColor: '#0056b3',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                >
                                    Próxima →
                                </button>

                                {/* Botão Última Página */}
                                {totalPages > 3 && currentPage < totalPages - 2 && (
                                    <button
                                        onClick={() => handlePageChange(totalPages - 1)}
                                        disabled={isLoading}
                                        css={{
                                            padding: '8px 12px',
                                            backgroundColor: isLoading ? '#e9ecef' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s',
                                            '&:hover:not(:disabled)': {
                                                backgroundColor: '#5a6268',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        Última ⏭
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div css={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6c757d',
                        fontSize: '14px'
                    }}>
                        {advancedMode
                            ? 'Preencha pelo menos um dos campos e clique em Buscar.'
                            : 'Digite o número do lote no campo acima para iniciar a busca.'}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default LoteSearchModal;
� ����� 2�file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/LoteSearchModal.tsx