import {useEffect} from "react";

function hideLoading() {
  // hide loading
  const node = document.getElementById("loading");
  if (node) {
    // @ts-ignore
    node.style.opacity = 0;
  }
}
export const LoadingBarHideTrigger = function(props: any) {
  useEffect(() => {
    setTimeout(() => hideLoading(), 300);
  }, []);

  return <></>
};