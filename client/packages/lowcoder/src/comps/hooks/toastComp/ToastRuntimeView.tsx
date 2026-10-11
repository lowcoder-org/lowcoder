import React, { useEffect, useId } from "react";
import { NotificationStyleType } from "comps/controls/styleControlConstants";
import { ToastGlobalStyle } from "./toastStyles";

/**
 * Toast runtime view - injects global CSS styles for the notification.
 */
export const ToastRuntimeView = React.memo((props: { comp: any }) => {
  const { comp } = props;
  const style = comp.children.style.getView() as NotificationStyleType;
  const width = comp.children.width.getView() as string;
  const progressHeight = comp.children.progressHeight.getView() as string;
  const instanceId = useId().replace(/:/g, '-');
  
  // Store instance ID so the show() method can use it for the notification className
  useEffect(() => {
    comp.children.instanceId.dispatchChangeValueAction(instanceId);
  }, [comp, instanceId]);

  return (
    <ToastGlobalStyle
      $instanceId={instanceId}
      $background={style.background}
      $textColor={style.color}
      $closeIconColor={style.closeIconColor}
      $infoIconColor={style.infoIconColor}
      $successIconColor={style.successIconColor}
      $warningIconColor={style.warningIconColor}
      $errorIconColor={style.errorIconColor}
      $progressColor={style.progressColor}
      $progressBackground={style.progressBackground}
      $progressHeight={progressHeight || undefined}
      $border={style.border}
      $borderWidth={style.borderWidth}
      $borderStyle={style.borderStyle}
      $radius={style.radius}
      $margin={style.margin}
      $padding={style.padding || '20px'}
      $width={width || undefined}
    />
  );
});

ToastRuntimeView.displayName = "ToastRuntimeView";
