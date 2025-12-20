"use client";

import React, { useEffect, useRef } from "react";

interface Props {
    intensity?: "low" | "high";
}

export default function ParticleNetwork({ intensity = "low" }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initParticles();
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.3; // Slower, more elegant
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 2 + 1.5;
            }

            update(w: number, h: number) {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

                // Dark drop shadow for visibility on light background
                ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.fill();

                // Reset shadow for performance cleanup if needed, 
                // though lines below set their own strokeStyle.
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
        }

        const initParticles = () => {
            particles = [];
            const count = intensity === "high" ? 70 : 40;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };

        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) { // Slightly longer range
                        // Brighter connections: max 0.8 opacity instead of 0.4
                        const opacity = (1 - dist / 150) * 0.8;
                        ctx!.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx!.lineWidth = 1.5; // Slightly thicker lines for visibility

                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);

                        // Shadow for lines
                        ctx!.shadowColor = "rgba(0, 0, 0, 0.2)";
                        ctx!.shadowBlur = 5;
                        ctx!.shadowOffsetX = 1;
                        ctx!.shadowOffsetY = 1;

                        ctx!.stroke();

                        // Reset shadow
                        ctx!.shadowColor = "transparent";
                        ctx!.shadowBlur = 0;
                        ctx!.shadowOffsetX = 0;
                        ctx!.shadowOffsetY = 0;
                    }
                }
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Slight dark overlay if needed? No, let parent handle bg

            particles.forEach(p => {
                p.update(canvas.width, canvas.height);
                p.draw();
            });
            drawConnections();
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resize);
        resize();
        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [intensity]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0
            }}
        />
    );
}
