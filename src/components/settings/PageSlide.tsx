"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageSlideProps {
    children: ReactNode;
    direction?: "left" | "right";
}

export function PageSlide({ children, direction = "right" }: PageSlideProps) {
    const variants = {
        initial: {
            x: direction === "right" ? "100%" : "-100%",
            opacity: 0,
        },
        animate: {
            x: 0,
            opacity: 1,
        },
        exit: {
            x: direction === "right" ? "-100%" : "100%",
            opacity: 0,
        },
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
            style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
            }}
        >
            {children}
        </motion.div>
    );
}
