import { useCallback, useRef, useState } from "react";

interface LongPressOptions {
    threshold?: number;
    onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
    onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function useLongPress({
    threshold = 500,
    onLongPress,
    onClick,
}: LongPressOptions) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);
    const startPos = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            // Prevent default right-click context menu on long press if desired?
            // e.preventDefault(); 
            isLongPress.current = false;

            // Track position to cancel if moved too much (drag)
            if ('touches' in e) {
                startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else {
                startPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
            }

            timerRef.current = setTimeout(() => {
                isLongPress.current = true;
                onLongPress(e);
            }, threshold);
        },
        [onLongPress, threshold]
    );

    const clear = useCallback(
        (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            // If it wasn't a long press and we want to trigger click
            if (shouldTriggerClick && !isLongPress.current && onClick) {
                onClick(e);
            }
        },
        [onClick]
    );

    const move = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (timerRef.current && startPos.current) {
            const { clientX, clientY } = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
            const dist = Math.sqrt(
                Math.pow(clientX - startPos.current.x, 2) + Math.pow(clientY - startPos.current.y, 2)
            );
            // Cancel if moved more than 10px
            if (dist > 10) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
                startPos.current = null;
            }
        }
    }, []);

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
        onTouchMove: (e: React.TouchEvent) => move(e)
    };
}
