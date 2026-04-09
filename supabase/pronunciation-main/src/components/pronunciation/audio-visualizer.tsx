'use client';

import { motion } from 'framer-motion';

interface AudioVisualizerProps {
    audioLevel: number; // 0-1
    isRecording: boolean;
}

export function AudioVisualizer({ audioLevel, isRecording }: AudioVisualizerProps) {
    // Create multiple rings that pulse based on audio level
    const rings = [
        { delay: 0, baseScale: 1, maxScale: 1.3 },
        { delay: 0.15, baseScale: 1.15, maxScale: 1.5 },
        { delay: 0.3, baseScale: 1.3, maxScale: 1.7 },
    ];

    return (
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            {/* Background static ring */}
            <div
                className="absolute rounded-full border-2 opacity-20"
                style={{
                    width: 180,
                    height: 180,
                    borderColor: 'var(--primary)',
                }}
            />

            {/* Animated pulsing rings */}
            {rings.map((ring, index) => (
                <motion.div
                    key={index}
                    className="absolute rounded-full"
                    style={{
                        width: 120,
                        height: 120,
                        border: `${2 - index * 0.3}px solid var(--primary)`,
                        opacity: isRecording ? 0.6 - index * 0.15 : 0.2,
                    }}
                    animate={
                        isRecording
                            ? {
                                scale: [
                                    ring.baseScale,
                                    ring.baseScale + (ring.maxScale - ring.baseScale) * audioLevel,
                                    ring.baseScale,
                                ],
                                opacity: [0.6 - index * 0.15, 0.3 - index * 0.05, 0.6 - index * 0.15],
                            }
                            : { scale: ring.baseScale, opacity: 0.2 }
                    }
                    transition={{
                        duration: isRecording ? 0.15 : 0.5,
                        ease: 'easeOut',
                        delay: ring.delay,
                    }}
                />
            ))}

            {/* Center recording indicator */}
            <motion.div
                className="relative z-10 flex items-center justify-center rounded-full"
                style={{
                    width: 80,
                    height: 80,
                    background: isRecording
                        ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                        : 'var(--card)',
                    boxShadow: isRecording ? 'var(--shadow-glow)' : 'var(--shadow-md)',
                }}
                animate={{
                    scale: isRecording ? [1, 1.05, 1] : 1,
                }}
                transition={{
                    duration: 1.5,
                    repeat: isRecording ? Infinity : 0,
                    ease: 'easeInOut',
                }}
            >
                {isRecording ? (
                    <motion.div
                        className="w-6 h-6 rounded-sm bg-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                ) : (
                    <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                    </motion.svg>
                )}
            </motion.div>

            {/* Audio level bar below */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 rounded-full overflow-hidden"
                style={{
                    width: 120,
                    background: 'var(--border)',
                }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                    }}
                    animate={{
                        width: `${audioLevel * 100}%`,
                    }}
                    transition={{
                        duration: 0.05,
                    }}
                />
            </div>
        </div>
    );
}
