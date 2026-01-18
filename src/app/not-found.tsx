"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Smooth lerp could be added here, but direct mapping for responsiveness
            setOffset({
                x: (e.clientX / window.innerWidth - 0.5) * 40,
                y: (e.clientY / window.innerHeight - 0.5) * 40,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const languages = [
        "Page Not Found", "ページが見つかりません", "Seite nicht gefunden",
        "Page non trouvée", "Página no encontrada", "페이지를 찾을 수 없습니다", "页面未找到"
    ];

    return (
        <div style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#F9F8F4", // Warm off-white
            color: "#1a1a1a",
            fontFamily: "var(--font-display)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Multilingual Marquee - Top */}
            <div style={{
                padding: "20px 0",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                position: "absolute",
                top: 0,
                width: "100%",
                zIndex: 1,
                background: "rgba(249, 248, 244, 0.9)",
                backdropFilter: "blur(5px)"
            }}>
                <div style={{
                    display: "inline-block",
                    animation: "marquee 40s linear infinite",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#888"
                }}>
                    {[...languages, ...languages, ...languages, ...languages].map((text, i) => (
                        <span key={i} style={{ margin: "0 60px" }}>{text}</span>
                    ))}
                </div>
            </div>

            {/* Main Center Composition */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 2
            }}>
                {/* Large 404 Typography with Parallax and Blending */}
                <div style={{ position: "relative" }}>
                    {/* Layer 1 - Back - Large Faint */}
                    <h1 style={{
                        fontSize: "clamp(8rem, 25vw, 24rem)",
                        lineHeight: 0.8,
                        margin: 0,
                        color: "rgba(0,0,0,0.02)",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) translate(${offset.x * -1.2}px, ${offset.y * -1.2}px) scale(1.1)`,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        userSelect: "none"
                    }}>
                        404
                    </h1>

                    {/* Layer 2 - Middle - Accent Blur */}
                    <h1 style={{
                        fontSize: "clamp(8rem, 25vw, 24rem)",
                        lineHeight: 0.8,
                        margin: 0,
                        color: "var(--color-accent)",
                        opacity: 0.15,
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        filter: "blur(12px)",
                        userSelect: "none"
                    }}>
                        404
                    </h1>

                    {/* Layer 3 - Front - Sharp */}
                    <h1 style={{
                        fontSize: "clamp(8rem, 25vw, 24rem)",
                        lineHeight: 0.8,
                        margin: 0,
                        color: "#2D2D2D",
                        position: "relative",
                        zIndex: 10,
                        userSelect: "none",
                        letterSpacing: "-0.05em"
                    }}>
                        404
                    </h1>
                </div>

                {/* Decorative Elements */}
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "1px",
                    height: "100vh",
                    background: "rgba(0,0,0,0.05)",
                    transform: `translate(-50%, -50%) rotate(15deg) translateX(${offset.x * 2}px)`,
                    pointerEvents: "none"
                }} />
            </div>

            {/* Bottom Content */}
            <div style={{
                padding: "40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                zIndex: 10,
                flexWrap: "wrap",
                gap: "20px"
            }}>
                <div style={{ maxWidth: "400px" }}>
                    <h2 style={{
                        fontSize: "2rem",
                        marginBottom: "16px",
                        fontStyle: "italic",
                        fontWeight: 400
                    }}>
                        Lost in Translation.
                    </h2>
                    <p style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        color: "#666",
                        lineHeight: 1.8,
                        letterSpacing: "0.02em"
                    }}>
                        The page you are looking for has drifted into the void. <br />
                        It might have been translated into silence.
                    </p>
                </div>

                <Link href="/app/dashboard" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 32px",
                    background: "#2D2D2D",
                    color: "#fff",
                    borderRadius: "2px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)"
                }}>
                    <ArrowLeft size={16} />
                    <span>Return Home</span>
                </Link>
            </div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
