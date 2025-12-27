import React, { useEffect, useState } from 'react';
import PhysicsPanel from './components/PhysicsPanel';
import type { WordEntry } from './types';
import { groupWordsByDate } from './utils/grouping';

const SidePanel: React.FC = () => {
    const [view, setView] = useState<'canvas' | 'folders'>('canvas');
    const [words, setWords] = useState<WordEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isStudyMode, setIsStudyMode] = useState(false);

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    const fetchWords = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/words');
            if (!response.ok) throw new Error('Failed to fetch');
            const data: WordEntry[] = await response.json();
            setWords(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchWords();
        const interval = setInterval(fetchWords, 3000);

        const handleResize = () => setIsMobile(window.innerWidth < 600);
        window.addEventListener('resize', handleResize);

        const messageListener = (message: any) => {
            if (message.action === "WORD_SAVED") {
                console.log("Instant update from extension!");
                fetchWords();
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(messageListener);
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);

    // ... (keep deleteWord and grouping same) ...

    const deleteWord = async (id: number) => {
        try {
            await fetch(`http://localhost:3000/api/words/${id}`, { method: 'DELETE' });
            // Optimistic update
            setWords(prev => prev.filter(w => w.id !== id));
        } catch (error) {
            console.error('Failed to delete word:', error);
        }
    };

    const groupedWords = groupWordsByDate(words);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>

            {/* Unified Header Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 200,
                padding: isMobile ? '10px' : '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none', // Let clicks pass through to canvas
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 10 : 0
            }}>
                {/* Title Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMobile ? 'center' : 'flex-start',
                    pointerEvents: 'auto' // Re-enable clicks
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.9)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>LexiDrop</h1>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: 12, color: 'white' }}>{words.length} words</p>
                </div>

                {/* Controls Section */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: 5,
                    borderRadius: 20,
                    pointerEvents: 'auto'
                }}>
                    <button
                        onClick={() => setIsStudyMode(!isStudyMode)}
                        style={{
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            border: 'none',
                            borderRadius: 15,
                            background: isStudyMode ? '#ffbd38' : 'rgba(255,255,255,0.3)',
                            color: isStudyMode ? '#333' : '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: isMobile ? 12 : 14,
                            gap: 5
                        }}
                    >
                        {isStudyMode ? '🎓 Learning' : '🧠 Study'}
                    </button>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.3)', margin: '0 2px' }} />
                    <button
                        onClick={() => setView('canvas')}
                        style={{
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            border: 'none',
                            borderRadius: 15,
                            background: view === 'canvas' ? '#fff' : 'transparent',
                            color: view === 'canvas' ? '#333' : '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: isMobile ? 12 : 14,
                            transition: 'all 0.2s'
                        }}
                    >
                        🎨 Canvas
                    </button>
                    <button
                        onClick={() => setView('folders')}
                        style={{
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            border: 'none',
                            borderRadius: 15,
                            background: view === 'folders' ? '#fff' : 'transparent',
                            color: view === 'folders' ? '#333' : '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: isMobile ? 12 : 14,
                            transition: 'all 0.2s'
                        }}
                    >
                        📁 Folders
                    </button>
                </div>
            </div>

            {/* Views */}
            {view === 'canvas' ? (
                <PhysicsPanel
                    words={words}
                    onDeleteWord={deleteWord}
                    isStudyMode={isStudyMode}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    padding: isMobile ? '120px 10px 20px' : '100px 20px 20px', // More padding for header
                    overflowY: 'auto',
                    color: '#fff',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                        <h1 style={{ marginBottom: 30, fontSize: isMobile ? 24 : 32 }}>🗂️ Vocabulary Collection</h1>
                        {loading && <p>Loading...</p>}

                        {groupedWords.map(([date, group]) => (
                            <div key={date} style={{ marginBottom: 30 }}>
                                <h2 style={{
                                    fontSize: 18,
                                    opacity: 0.6,
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    paddingBottom: 10,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                }}>
                                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', // Stack on mobile
                                    gap: 15,
                                    marginTop: 15
                                }}>
                                    {group.map(word => (
                                        <div key={word.id} style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: 15,
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e94560' }}>{word.originalText}</div>
                                            <div style={{ fontSize: 14, marginTop: 5, opacity: 0.8 }}>{word.translatedText}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidePanel;
