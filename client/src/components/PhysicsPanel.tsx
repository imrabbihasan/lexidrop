import React, { useEffect, useState, useRef } from 'react';
import Matter from 'matter-js';

import type { WordEntry } from '../types';

interface PhysicsItem {
    id: number;
    body: Matter.Body;
    originalText: string;
    translatedText: string;
    secondaryTranslation?: string;
    pinyin?: string;
    language?: string;
    color: string;
    width: number;
    height: number;
    fontSize: number;
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

interface PhysicsBoardProps {
    words: WordEntry[];
    onDeleteWord?: (id: number) => void;
    isStudyMode: boolean;
}

const PhysicsPanel: React.FC<PhysicsBoardProps> = ({ words, onDeleteWord, isStudyMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine>(Matter.Engine.create());
    const runnerRef = useRef<Matter.Runner | null>(null);
    const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
    // Track items locally for physics bodies
    const [items, setItems] = useState<PhysicsItem[]>([]);
    // Track if a held item is hovering over the trash
    const [isHoveringTrash, setIsHoveringTrash] = useState(false);
    // Track hovered item for temporary translation reveal
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    // Track large screen for layout adjustments
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1024);



    // Persistent Set to track added IDs immediately and prevent duplicates (race conditions/strict mode)
    const processedIdsRef = useRef<Set<number>>(new Set());

    // Sync physics bodies with incoming words prop
    useEffect(() => {
        const engine = engineRef.current;

        // Use the persistent ref for checking duplicates
        const newWords = words.filter(w => !processedIdsRef.current.has(w.id));

        if (newWords.length > 0) {
            const newItems: PhysicsItem[] = newWords.map((w, i) => {
                // Mark immediately as processed
                processedIdsRef.current.add(w.id);

                // Responsive Sizing
                const isNarrow = window.innerWidth < 400;
                const width = isNarrow ? 120 : 160;
                const height = isNarrow ? 80 : 110;
                const fontSize = isNarrow ? 14 : 18;

                const x = Math.random() * (window.innerWidth - width * 1.5) + width / 2 + 20;
                const y = -150 - (i * 120);

                const body = Matter.Bodies.rectangle(x, y, width, height, {
                    restitution: 0.4,
                    friction: 0.3,
                    frictionAir: 0.01,
                    chamfer: { radius: 5 },
                    label: `word-${w.id}` // Label needed for collision identification
                });

                Matter.World.add(engine.world, body);

                return {
                    id: w.id,
                    body,
                    originalText: w.originalText,
                    translatedText: w.translatedText || '...',
                    secondaryTranslation: w.secondaryTranslation || undefined,
                    pinyin: w.pinyin || undefined,
                    language: w.language || undefined,
                    color: STICKY_COLORS[w.id % STICKY_COLORS.length],
                    width,
                    height,
                    fontSize
                };
            });

            setItems(prev => [...prev, ...newItems]);
        }
    }, [words]);

    useEffect(() => {
        const engine = engineRef.current;

        // Setup boundaries
        const wallThickness = 60;
        // Add padding on right side for large screens
        const rightPadding = window.innerWidth > 1024 ? 40 : 0;

        const ground = Matter.Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight - 20 + wallThickness / 2, // -20px padding from bottom
            window.innerWidth * 2,
            wallThickness,
            { isStatic: true, label: 'wall' }
        );
        const leftWall = Matter.Bodies.rectangle(
            -wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight * 2,
            { isStatic: true, label: 'wall' }
        );
        const rightWall = Matter.Bodies.rectangle(
            window.innerWidth - rightPadding + wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight * 2,
            { isStatic: true, label: 'wall' }
        );

        // o Hole Sensor (Bottom Right)
        const holeSize = 90; // Smaller size
        // Position it closer to corner. offset = 45px (center) 
        // Visual is at bottom: 15px, height: 60px -> Center is 15+30=45px.
        // Also respect right padding
        const sensorOffset = 45 + rightPadding;

        const blackHole = Matter.Bodies.circle(
            window.innerWidth - sensorOffset,
            window.innerHeight - 45, // Keep bottom offset constant
            holeSize / 2,
            {
                isStatic: true,
                isSensor: true, // Key: Collisions detected but no physical bounce
                label: 'black-hole',
                render: { visible: false } // We render via React
            }
        );

        Matter.World.add(engine.world, [ground, leftWall, rightWall, blackHole]);

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

            // Track active drag body
            let draggedBody: Matter.Body | null = null;

            Matter.Events.on(mouseConstraint, 'startdrag', (event: any) => {
                draggedBody = event.body;
            });

            // Deletion on Drop (not just collision)
            Matter.Events.on(mouseConstraint, 'enddrag', (event: any) => {
                const body = event.body;
                draggedBody = null;
                setIsHoveringTrash(false);

                if (!body) return;

                // Check if the dropped body is touching the black hole
                const collisions = Matter.Query.collides(blackHole, [body]);

                if (collisions.length > 0) {
                    if (body.label.startsWith('word-')) {
                        const id = parseInt(body.label.split('-')[1]);

                        // Move visual removal logic to state update? 
                        // Actually we remove from physics immediately for responsiveness
                        Matter.World.remove(engine.world, body);

                        // Remove from local state
                        setItems(prev => prev.filter(item => item.id !== id));
                        processedIdsRef.current.delete(id);

                        // Call parent delete
                        if (onDeleteWord) onDeleteWord(id);
                    }
                }
            });

            // Check collision continuously during drag for visual feedback
            Matter.Events.on(engine, 'afterUpdate', () => {
                if (draggedBody) {
                    const collisions = Matter.Query.collides(blackHole, [draggedBody]);
                    const isOver = collisions.length > 0;
                    setIsHoveringTrash(isOver);
                }

                // Reset bodies that fall out of bounds
                const bodies = Matter.Composite.allBodies(engine.world);
                const height = window.innerHeight;
                const width = window.innerWidth;

                bodies.forEach(body => {
                    // If body falls way below the ground (out of view)
                    if (body.position.y > height + 200 || body.position.x < -100 || body.position.x > width + 100) {
                        if (!body.isStatic) { // Don't move the ground
                            Matter.Body.setPosition(body, {
                                x: Math.random() * (width - 100) + 50,
                                y: -100 // Respawn at top
                            });
                            // Reset velocity to prevent it from zooming down again instantly
                            Matter.Body.setVelocity(body, { x: 0, y: 0 });
                            Matter.Body.setAngularVelocity(body, 0);
                        }
                    }
                });
            });
        }

        // Start physics engine
        const runner = Matter.Runner.create();
        runnerRef.current = runner;
        Matter.Runner.run(runner, engine);

        // Handle resize to keep walls correct
        const handleResize = () => {
            const height = window.innerHeight;
            const width = window.innerWidth;
            const rPadding = width > 1024 ? 40 : 0;
            setIsLargeScreen(width > 1024);

            // Move walls
            Matter.Body.setPosition(ground, { x: width / 2, y: height - 20 + 60 / 2 });
            Matter.Body.setPosition(leftWall, { x: -60 / 2, y: height / 2 });
            Matter.Body.setPosition(rightWall, {
                x: width - rPadding + 60 / 2,
                y: height / 2
            });

            // Move Black Hole to corner
            Matter.Body.setPosition(blackHole, {
                x: width - (45 + rPadding),
                y: height - 45
            });

            // Recreate vertices for static bodies to resize them
            Matter.Body.setVertices(ground, Matter.Bodies.rectangle(width / 2, height - 20 + 60 / 2, width * 2, 60).vertices);
            Matter.Body.setVertices(leftWall, Matter.Bodies.rectangle(-60 / 2, height / 2, 60, height * 2).vertices);
            Matter.Body.setVertices(rightWall, Matter.Bodies.rectangle(width - rPadding + 60 / 2, height / 2, 60, height * 2).vertices);
        };
        window.addEventListener('resize', handleResize);

        // Animation loop to sync React with physics
        let animationId: number;
        const loop = () => {
            setItems(prev => [...prev]); // Force re-render
            animationId = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
            Matter.Engine.clear(engine);
        };
    }, [onDeleteWord]);  // Re-run if handler changes (unlikely)

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

            {/* Sticky Notes */}
            {items.map(item => {
                const { x, y } = item.body.position;
                const angle = item.body.angle;
                const w = item.width || 160;
                const h = item.height || 110;
                const fs = item.fontSize || 18;

                // Interaction Logic
                const isHovered = hoveredId === item.id;

                return (
                    <div
                        key={item.id}
                        onDoubleClick={() => speakWord(item.originalText)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            transform: `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${angle}rad)`,
                            width: w,
                            height: h,
                            background: item.color,
                            boxShadow: '4px 4px 15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
                            padding: 12,
                            borderRadius: 4,
                            fontFamily: '"Patrick Hand", "Comic Sans MS", cursive',
                            fontSize: fs,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: 'grab',
                            userSelect: 'none',
                            wordBreak: 'break-word',
                            lineHeight: 1.2,
                            // Tape effect at top
                            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 15%)`,
                            zIndex: isHovered ? 10 : 1, // Pop to front on hover
                            transition: 'transform 0.1s, z-index 0s' // Smooth transform only
                        }}
                    >
                        {/* Content Render Logic */}
                        {isStudyMode ? (
                            // Study Mode: Show ALL (Original + Pinyin + Translations)
                            <>
                                <strong style={{ color: '#333' }}>{item.originalText}</strong>
                                {item.pinyin && (
                                    <div style={{ fontSize: '0.8em', color: '#666', marginBottom: 2 }}>{item.pinyin}</div>
                                )}
                                <div style={{
                                    fontSize: '0.85em',
                                    color: '#555',
                                    marginTop: 4,
                                    borderTop: '1px solid rgba(0,0,0,0.1)',
                                    paddingTop: 2,
                                    width: '100%'
                                }}>
                                    <div>{item.translatedText}</div>
                                    {item.secondaryTranslation && (
                                        <div style={{ fontSize: '0.9em', color: '#777', fontStyle: 'italic' }}>
                                            {item.secondaryTranslation}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Canvas Mode: Show Original (Pinyin if Chinese). Hover reveals translations.
                            isHovered ? (
                                // HOVER STATE: Show Translations
                                <>
                                    <strong style={{ color: '#000' }}>{item.translatedText}</strong>
                                    {item.secondaryTranslation && (
                                        <div style={{ fontSize: '0.85em', color: '#444', marginTop: 2, fontStyle: 'italic' }}>
                                            {item.secondaryTranslation}
                                        </div>
                                    )}
                                </>
                            ) : (
                                // NORMAL STATE: Show Original + Pinyin
                                <>
                                    <strong style={{ color: '#333' }}>{item.originalText}</strong>
                                    {item.pinyin && (
                                        <div style={{ fontSize: '0.8em', color: '#666', marginTop: 2 }}>{item.pinyin}</div>
                                    )}
                                </>
                            )
                        )}
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

            {/* Trash Icon Visual */}
            <div style={{
                position: 'absolute',
                // Physics body center is at ~45px from bottom/right (OFFSET)
                // Visual div is 60x60, so center is at bottom + 30.
                // To align centers: bottom = 45 - 30 = 15px.
                // On large screens, offset adds 40px padding.
                bottom: 15,
                right: isLargeScreen ? 55 : 15, // 15 + 40 = 55
                width: 60,
                height: 60,
                zIndex: 50,
                pointerEvents: 'none', // Critical: Allows mouse events to reach the physics body/sensor below
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.27), right 0.3s ease', // Animate right change too
                transform: isHoveringTrash ? 'scale(1.2)' : 'scale(1)',
            }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isHoveringTrash ? "#ff4757" : "rgba(255,255,255,0.5)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        filter: isHoveringTrash ? 'drop-shadow(0 0 8px rgba(255, 71, 87, 0.6))' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
        </div>
    );
};

export default PhysicsPanel;
