import React, { useEffect, useState, useRef } from 'react';
import Matter from 'matter-js';

import type { WordEntry } from '../types';

interface PhysicsItem {
    id: number;
    body: Matter.Body;
    text: string;
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
}

const PhysicsPanel: React.FC<PhysicsBoardProps> = ({ words }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine>(Matter.Engine.create());
    const runnerRef = useRef<Matter.Runner | null>(null);
    const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
    // Track items locally for physics bodies
    const [items, setItems] = useState<PhysicsItem[]>([]);

    // Persistent Set to track added IDs immediately and prevent duplicates (race conditions/strict mode)
    const processedIdsRef = useRef<Set<number>>(new Set());

    // Sync physics bodies with incoming words prop
    useEffect(() => {
        const engine = engineRef.current;

        // Use the persistent ref for checking duplicates
        // We also check against the valid "words" prop to ensure we only add what's currently passed,
        // but mostly we care about not adding the SAME id twice ever in this session (unless we implemented removal, which we haven't yet).

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
                    chamfer: { radius: 5 }
                });

                Matter.World.add(engine.world, body);

                return {
                    id: w.id,
                    body,
                    text: w.originalText,
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

        // Reset bodies that fall out of bounds
        Matter.Events.on(engine, 'afterUpdate', () => {
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

        // Handle resize to keep walls correct
        const handleResize = () => {
            const height = window.innerHeight;
            const width = window.innerWidth;

            // Move walls
            Matter.Body.setPosition(ground, { x: width / 2, y: height + 60 / 2 });
            Matter.Body.setPosition(leftWall, { x: -60 / 2, y: height / 2 });
            Matter.Body.setPosition(rightWall, { x: width + 60 / 2, y: height / 2 });

            // Recreate vertices for static bodies to resize them
            Matter.Body.setVertices(ground, Matter.Bodies.rectangle(width / 2, height + 60 / 2, width * 2, 60).vertices);
            Matter.Body.setVertices(leftWall, Matter.Bodies.rectangle(-60 / 2, height / 2, 60, height * 2).vertices);
            Matter.Body.setVertices(rightWall, Matter.Bodies.rectangle(width + 60 / 2, height / 2, 60, height * 2).vertices);
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
    }, []);

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
            {/* Compact Header */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 100,
                // Make it smaller and transparent to avoid overlapping
                pointerEvents: 'none'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: 20, // Smaller font
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>LexiDrop</h1>
                <p style={{ margin: 0, opacity: 0.8, fontSize: 12, color: 'white' }}>{words.length} words</p>
            </div>

            {/* Sticky Notes */}
            {items.map(item => {
                const { x, y } = item.body.position;
                const angle = item.body.angle;
                // Default to standard size if property missing
                const w = item.width || 160;
                const h = item.height || 110;
                const fs = item.fontSize || 18;

                return (
                    <div
                        key={item.id}
                        onDoubleClick={() => speakWord(item.text)}
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

export default PhysicsPanel;
