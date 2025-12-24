import React, { useEffect, useState, useRef, useCallback } from 'react';
import Matter from 'matter-js';

interface WordEntry {
    id: number;
    originalText: string;
    translatedText: string | null;
    explanation: string | null;
    status: string;
}

interface PhysicsItem {
    id: number;
    body: Matter.Body;
    text: string;
    color: string;
}

const STICKY_COLORS = [
    '#fff7d1', // Yellow
    '#ffccd5', // Pink
    '#c1f0c1', // Green
    '#c1e0ff', // Blue
    '#e5d1ff', // Purple
    '#ffd1b3', // Orange
];

// Text-to-Speech "Tutor" feature
const speakWord = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Auto-detect Chinese characters and set language
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    if (hasChinese) {
        utterance.lang = 'zh-CN'; // Simplified Chinese
    } else {
        utterance.lang = 'en-US'; // Default to English
    }

    utterance.rate = 0.9; // Slightly slower for learning
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
};

const PhysicsBoard: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine>(Matter.Engine.create());
    const runnerRef = useRef<Matter.Runner | null>(null);
    const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
    const [items, setItems] = useState<PhysicsItem[]>([]);
    const [status, setStatus] = useState<string>('Loading...');
    // Use a Set ref to track existing IDs - more reliable than array mapping
    const existingIdsRef = useRef<Set<number>>(new Set());

    // Fetch words and create physics bodies
    const fetchAndCreateBodies = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/words');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const words: WordEntry[] = await response.json();

            const engine = engineRef.current;

            // Find new words that we haven't added yet
            const newWords = words.filter(w => !existingIdsRef.current.has(w.id));

            if (newWords.length > 0) {
                const newItems: PhysicsItem[] = newWords.map((w, i) => {
                    // Mark this ID as added IMMEDIATELY to prevent race conditions
                    existingIdsRef.current.add(w.id);

                    const x = Math.random() * (window.innerWidth - 200) + 100;
                    const y = -150 - (i * 120); // Stagger above viewport

                    const body = Matter.Bodies.rectangle(x, y, 160, 110, {
                        restitution: 0.4,
                        friction: 0.3,
                        frictionAir: 0.01,
                        chamfer: { radius: 5 }
                    });

                    Matter.World.add(engine.world, body);

                    return {
                        id: w.id,
                        body,
                        text: w.originalText,
                        color: STICKY_COLORS[w.id % STICKY_COLORS.length]
                    };
                });

                // Use functional update with deduplication as extra safety
                setItems(prev => {
                    const prevIds = new Set(prev.map(item => item.id));
                    const trulyNew = newItems.filter(item => !prevIds.has(item.id));
                    return [...prev, ...trulyNew];
                });
            }

            setStatus(`${words.length} words`);
        } catch (err) {
            console.error('Fetch error:', err);
            setStatus('Connection error');
        }
    }, []);

    useEffect(() => {
        const engine = engineRef.current;

        // Setup boundaries
        const wallThickness = 60;
        const ground = Matter.Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight + wallThickness / 2,
            window.innerWidth * 2,
            wallThickness,
            { isStatic: true }
        );
        const leftWall = Matter.Bodies.rectangle(
            -wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight * 2,
            { isStatic: true }
        );
        const rightWall = Matter.Bodies.rectangle(
            window.innerWidth + wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight * 2,
            { isStatic: true }
        );

        Matter.World.add(engine.world, [ground, leftWall, rightWall]);

        // Mouse interaction
        if (containerRef.current) {
            const mouse = Matter.Mouse.create(containerRef.current);
            const mouseConstraint = Matter.MouseConstraint.create(engine, {
                mouse,
                constraint: {
                    stiffness: 0.2,
                    render: { visible: false }
                }
            });
            Matter.World.add(engine.world, mouseConstraint);
            mouseConstraintRef.current = mouseConstraint;
        }

        // Start physics engine
        const runner = Matter.Runner.create();
        runnerRef.current = runner;
        Matter.Runner.run(runner, engine);

        // Initial fetch
        fetchAndCreateBodies();

        // Poll for new words every 3 seconds
        const pollInterval = setInterval(fetchAndCreateBodies, 3000);

        // Animation loop to sync React with physics
        let animationId: number;
        const loop = () => {
            setItems(prev => [...prev]); // Force re-render
            animationId = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(animationId);
            clearInterval(pollInterval);
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
            Matter.Engine.clear(engine);
        };
    }, [fetchAndCreateBodies]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 100,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                padding: '15px 25px',
                borderRadius: 16,
                color: 'white',
                boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>📝 LexiDrop</h1>
                <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: 14 }}>{status}</p>
            </div>

            {/* Sticky Notes */}
            {items.map(item => {
                const { x, y } = item.body.position;
                const angle = item.body.angle;

                return (
                    <div
                        key={item.id}
                        onDoubleClick={() => speakWord(item.text)}
                        title="Double-click to hear pronunciation"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            transform: `translate(${x - 80}px, ${y - 55}px) rotate(${angle}rad)`,
                            width: 160,
                            height: 110,
                            background: item.color,
                            boxShadow: '4px 4px 15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
                            padding: 12,
                            borderRadius: 4,
                            fontFamily: '"Patrick Hand", "Comic Sans MS", cursive',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: 'grab',
                            userSelect: 'none',
                            wordBreak: 'break-word',
                            lineHeight: 1.2,
                            // Tape effect at top
                            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 15%)`,
                        }}
                    >
                        <strong style={{ color: '#333' }}>{item.text}</strong>
                    </div>
                );
            })}

            {/* Hint */}
            {items.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center',
                    fontSize: 18
                }}>
                    <p>✨ Select text on any webpage and right-click</p>
                    <p>"Save to LexiDrop" to add your first word!</p>
                </div>
            )}
        </div>
    );
};

export default PhysicsBoard;
