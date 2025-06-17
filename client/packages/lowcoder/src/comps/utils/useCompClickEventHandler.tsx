import React, { useCallback, useRef } from "react";

export enum ClickEventType {
    CLICK = "click",
    DOUBLE_CLICK = "doubleClick"
}

interface Props {
    onEvent: (event: ClickEventType) => void;
}

const DOUBLE_CLICK_THRESHOLD = 300; // ms

export const useCompClickEventHandler = (props: Props) => {
    const lastClickTimeRef = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const handleClick = useCallback(() => {
        const now = Date.now();
        
        // Clear any existing timeout
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
        }

        if ((now - lastClickTimeRef.current) < DOUBLE_CLICK_THRESHOLD) {
            props.onEvent(ClickEventType.DOUBLE_CLICK);
        } else {
            clickTimerRef.current = setTimeout(() => {
                props.onEvent(ClickEventType.CLICK);
            }, DOUBLE_CLICK_THRESHOLD);
        }
        
        lastClickTimeRef.current = now;
    }, [props.onEvent]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    return handleClick;
};
