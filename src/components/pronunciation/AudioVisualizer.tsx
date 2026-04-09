"use client";

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    audioLevel: number; // 0 to 255
    isRecording: boolean;
}

export function AudioVisualizer({ audioLevel, isRecording }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bars = 30; // Number of bars

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / bars;

        ctx.clearRect(0, 0, width, height);

        // Styling
        const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#FF4F00';
        const inactiveColor = getComputedStyle(document.documentElement).getPropertyValue('--color-fg-muted').trim() || '#888';

        for (let i = 0; i < bars; i++) {
            // Simplified visualization logic based on single level
            // In a real analyzer we'd have frequency data array
            // Here we simulate a wave based on volume

            const normalizedVol = audioLevel / 255;
            const waveFactor = Math.sin((i / bars) * Math.PI * 2 + Date.now() / 100);
            const heightFactor = isRecording ? Math.max(0.1, normalizedVol * (0.5 + 0.5 * waveFactor)) : 0.05;

            const barHeight = height * heightFactor * 1.5;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;

            ctx.fillStyle = isRecording ? activeColor : inactiveColor;
            ctx.globalAlpha = isRecording ? 0.8 : 0.2;

            // Rounded bars
            roundRect(ctx, x + 1, y, barWidth - 2, barHeight, 2);
            ctx.fill();
        }

    }, [audioLevel, isRecording, bars]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            style={{ width: '100%', height: '60px' }}
        />
    );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
