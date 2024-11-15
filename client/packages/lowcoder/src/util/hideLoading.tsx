import {useEffect} from "react";
import {hideLoading} from "@lowcoder-ee/index";

export const LoadingBarHideTrigger = function(props: any) {
    useEffect(() => {
        setTimeout(() => hideLoading(), 300);
    }, []);

    return <></>
};