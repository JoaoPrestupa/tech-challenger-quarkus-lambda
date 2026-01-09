ô¬/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { THEMES_HEX } from '../../../../utils/themes';
//@ts-ignore
import { http } from '../../../../../http/http';
import { http8081 } from '../../../../../http/http';
import { ContribuinteResponseDTO, PageResponse, CIProprietarioResponseDTO } from '../../../../../types/Imobiliario';
//@ts-ignore
import CloseIcon from '../../../../../assets/fecharVermelho.png';
import { paginationService, NormalizedPageResponse } from '../services/PaginationService';
import { SearchStateManager, SearchState } from '../services/SearchStateManager';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectContribuinte: (contribuinte: CIProprietarioResponseDTO) => void;
}

export const ProprietarioSearchModal = ({ isOpen, onClose, onSelectContribuinte }: SearchModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<CIProprietarioResponseDTO[]>([]);
    const [pageData, setPageData] = useState<NormalizedPageResponse<CIProprietarioResponseDTO> | null>(null);
    const [stateManager] = useState(() => new SearchStateManager());
    const [searchState, setSearchState] = useState(stateManager.getState());

    // Subscribe to state changes
    useEffect(() => {
        const unsubscribe = stateManager.subscribe(setSearchState);
        return unsubscribe;
    }, [stateManager]);

    const searchContribuintes = useCallback(async (term: string, page: number = 0) => {
        if (!term || term.length < 3) {
            setResults([]);
            setPageData(null);
            stateManager.reset();
            return;
        }

        stateManager.startLoading();

        try {
            const response = await http8081.get(
                `/cadastro-imobiliario/proprietarios/findALlByNomeContaining/pageable/${encodeURIComponent(term)}`,
                {
                    params: {
                        page: page,
                        size: 10,
                        sort: 'nome,asc'
                    }
                }
            );

            console.log("Propriet√°rios response:", JSON.stringify(response.data));

            // Normaliza a resposta usando o servi√ßo Singleton
            const normalized = paginationService.normalizePageResponse<CIProprietarioResponseDTO>(response.data);

            setResults(normalized.content);
            setPageData(normalized);
            stateManager.setSuccess(normalized.content.length > 0);
        } catch (error) {
            console.error('Erro ao buscar contribuintes:', error);
            stateManager.setError('Erro ao buscar contribuintes. Tente novamente.');
            setResults([]);
            setPageData(null);
        }
    }, [stateManager]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchContribuintes(searchTerm, 0);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchContribuintes]);

    const handlePageChange = (newPage: number) => {
        if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
            searchContribuintes(searchTerm, newPage);
        }
    };

    const formatCPFCNPJ = (documento: string) => {
        if (!documento) return '';
        const cleaned = documento.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cleaned.length === 14) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return documento;
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
                            Buscar Propriet√°rio
                        </h2>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                            Digite o nome do propriet√°rio para buscar
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
                        placeholder="Digite o nome do propriet√°rio (m√≠nimo 3 caracteres)..."
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

                    {searchTerm.length > 0 && searchTerm.length < 3 && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffecb5',
                            borderRadius: '4px',
                            color: '#664d03',
                            fontSize: '13px'
                        }}>
                            Digite pelo menos 3 caracteres para buscar
                        </div>
                    )}

                    {searchState.error && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c2c7',
                            borderRadius: '4px',
                            color: '#842029',
                            fontSize: '13px'
                        }}>
                            {searchState.error}
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
                    {searchTerm.length >= 3 && !searchState.isLoading && pageData && (
                        <div style={{
                            padding: '16px 24px 0 24px',
                            fontSize: '13px',
                            color: '#6c757d'
                        }}>
                            {pageData.totalElements > 0 ? (
                                `${pageData.totalElements} contribuinte${pageData.totalElements !== 1 ? 's' : ''} encontrado${pageData.totalElements !== 1 ? 's' : ''}`
                            ) : (
                                'Nenhum contribuinte encontrado'
                            )}
                        </div>
                    )}

                    {/* Results List */}
                    <div style={{
                        flex: 1,
                        padding: '16px 24px',
                        overflowY: 'auto'
                    }}>
                        {searchState.isLoading && (
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
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>Buscando propriet√°rios...</p>
                            </div>
                        )}

                        {!searchState.isLoading && results.length === 0 && searchTerm.length >= 3 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>üîç</div>
                                <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                                    Nenhum propriet√°rio encontrado
                                </p>
                                <p style={{ fontSize: '14px', margin: 0 }}>
                                    Tente buscar com termos diferentes
                                </p>
                            </div>
                        )}

                        {!searchState.isLoading && results.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {results.map((proprietario, index) => (
                                    <div
                                        key={`${proprietario.idProprietarios}-${index}`}
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
                                        onClick={() => onSelectContribuinte(proprietario)}
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
                                                    {proprietario.nome?.trim()}
                                                </h4>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                                            C√≥digo:
                                                        </span>
                                                        <div style={{ fontSize: '13px', color: '#495057' }}>
                                                            {proprietario.codigo}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                                            Percentual:
                                                        </span>
                                                        <div style={{ fontSize: '13px', color: '#495057' }}>
                                                            {proprietario.percentual}%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                                        Vig√™ncia:
                                                    </span>
                                                    <div style={{ fontSize: '13px', color: '#495057' }}>
                                                        {proprietario.vigencia ? new Date(proprietario.vigencia).toLocaleDateString('pt-BR') : 'N/A'}
                                                    </div>
                                                </div>
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
                                    Busca de Contribuintes
                                </p>
                                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                                    Digite o nome do contribuinte no campo acima para iniciar a busca.<br />
                                    Voc√™ poder√° visualizar informa√ß√µes detalhadas de cada contribuinte.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pageData && pageData.totalPages > 1 && !searchState.isLoading && (
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>
                                P√°gina {pageData.currentPage + 1} de {pageData.totalPages}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handlePageChange(pageData.currentPage - 1)}
                                    disabled={!paginationService.canGoToPreviousPage(pageData)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        backgroundColor: !paginationService.canGoToPreviousPage(pageData) ? '#f8f9fa' : 'white',
                                        color: !paginationService.canGoToPreviousPage(pageData) ? '#6c757d' : '#495057',
                                        cursor: !paginationService.canGoToPreviousPage(pageData) ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (paginationService.canGoToPreviousPage(pageData)) {
                                            e.currentTarget.style.backgroundColor = '#e9ecef';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (paginationService.canGoToPreviousPage(pageData)) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    Anterior
                                </button>

                                <button
                                    onClick={() => handlePageChange(pageData.currentPage + 1)}
                                    disabled={!paginationService.canGoToNextPage(pageData)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        backgroundColor: !paginationService.canGoToNextPage(pageData) ? '#f8f9fa' : 'white',
                                        color: !paginationService.canGoToNextPage(pageData) ? '#6c757d' : '#495057',
                                        cursor: !paginationService.canGoToNextPage(pageData) ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (paginationService.canGoToNextPage(pageData)) {
                                            e.currentTarget.style.backgroundColor = '#e9ecef';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (paginationService.canGoToNextPage(pageData)) {
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

    return createPortal(modalContent, document.body);
};

  
 Ã Ã–
–ÿ ÿÈ
ÈÎ ÎÌ
Ìı ı˜
˜Å ÅÖ
Ö• •¶
¶≤ ≤µ
µæ æ¬
¬‰ ‰Ë
Ë˘ ˘˚
˚á  á â 
â õ  õ ü 
ü ﬂ  ﬂ „ 
„ ı  ı ¯ 
¯ Ñ! Ñ!Ö!
Ö!ú! ú!†!
†!”! ”!◊!
◊!Ê! Ê!Í!
Í!á" 
á"Õ" 
Õ"Œ" Œ"œ"
œ"Ÿ" Ÿ"›"
›"à# à#ä#
ä#ö# ö#ú#
ú#≥# ≥#∑#
∑#Ö$ Ö$â$
â$ô$ ô$ú$
ú$¨$ ¨$≠$
≠$∏$ ∏$π$
π$—$ —$’$
’$Ê$ Ê$Ë$
Ë$¯$ ¯$˙$
˙$è% è%í%
í%¢% ¢%£%
£%µ% µ%π%
π%Û% Û%˜%
˜%ã& ã&è&è&“ñ 
“ñ◊ñ◊ñô¬ 2èfile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/SearchModal.tsx