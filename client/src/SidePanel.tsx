import React, { useEffect, useState } from 'react';
import PhysicsPanel from './components/PhysicsPanel';
import type { WordEntry } from './types';
import { groupWordsByDate } from './utils/grouping';

const SidePanel: React.FC = () => {
    const [view, setView] = useState<'canvas' | 'folders'>('canvas');
    const [words, setWords] = useState<WordEntry[]>([]);
    const [loading, setLoading] = useState(true);

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
        // Poll every 3 seconds
        const interval = setInterval(fetchWords, 3000);

        // Listen for extension messages
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
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);

    const groupedWords = groupWordsByDate(words);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            {/* Navigation / Toggle */}
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 200,
                display: 'flex',
                gap: 10,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                padding: 5,
                borderRadius: 20
            }}>
                <button
                    onClick={() => setView('canvas')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: 15,
                        background: view === 'canvas' ? '#fff' : 'transparent',
                        color: view === 'canvas' ? '#333' : '#fff',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    🎨 Canvas
                </button>
                <button
                    onClick={() => setView('folders')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: 15,
                        background: view === 'folders' ? '#fff' : 'transparent',
                        color: view === 'folders' ? '#333' : '#fff',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    📁 Folders
                </button>
            </div>

            {/* Views */}
            {view === 'canvas' ? (
                <PhysicsPanel words={words} />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', // Dark theme for list
                    padding: '80px 20px 20px',
                    overflowY: 'auto',
                    color: '#fff',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                        <h1 style={{ marginBottom: 30 }}>🗂️ Vocabulary Collection</h1>
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 15, marginTop: 15 }}>
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
