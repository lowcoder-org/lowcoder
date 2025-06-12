import React from "react";

export enum ClickEventType {
    CLICK = "click",
    DOUBLE_CLICK = "doubleClick"
}

interface Props {
    onEvent: (event: ClickEventType) => void;
}

const DOUBLE_CLICK_THRESHOLD = 300; // ms
let lastClickTime = 0;
let clickTimer: ReturnType<typeof setTimeout>;

export const ComponentClickHandler = (props: Props) => {
    return () => {
        const now = Date.now()
        clearTimeout(clickTimer)

        if((now - lastClickTime) < DOUBLE_CLICK_THRESHOLD){ 
            return props.onEvent(ClickEventType.DOUBLE_CLICK)
        } else {
            clickTimer = setTimeout(() => {
                props.onEvent(ClickEventType.CLICK)
            }, DOUBLE_CLICK_THRESHOLD)
        }
        
        lastClickTime = now 
    }
}