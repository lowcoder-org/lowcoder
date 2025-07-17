import { default as Popover } from "antd/es/popover";
import ColorPicker, {useColorPicker} from 'react-best-gradient-color-picker';
import { ActionType } from '@rc-component/trigger/lib/interface';
import {
  alphaOfRgba,
  toRGBA,
  toHex,
  constantColors,
  isValidColor,
  isValidGradient,
  gradientColors,
} from "components/colorSelect/colorUtils";
import styled, { css } from "styled-components";
import { useCallback, useRef, useState, useEffect, useMemo, } from "react";
import { throttle } from "lodash";
import { changeValueAction } from "lowcoder-core";

interface ColorSelectProps {
  color: string;
  trigger?: ActionType;
  dispatch?: (value: any) => void;
  changeColor?: (value: any) => void;
  presetColors?: string[];
  allowGradient?: boolean;
}

export const ColorSelect = (props: ColorSelectProps) => {
  const { color, trigger = "click", dispatch, changeColor } = props;
  const [visible, setVisible] = useState(false);
  const [ selectedColor, setSelectedColor ] = useState(color);
  const { getGradientObject } = useColorPicker(selectedColor, setSelectedColor);

  const presetColors = useMemo(() => {
    let colors = props.presetColors || [];
    if (props.allowGradient) {
      colors = colors.concat(gradientColors.slice(0, 16 - colors.length));
    }
    return colors;
  }, [props.presetColors, selectedColor, props.allowGradient]);

  const throttleChange = useCallback(
    throttle((rgbaColor: string) => {
      dispatch && dispatch(changeValueAction(rgbaColor, true));
      changeColor && changeColor(rgbaColor);
    }, 200),
    [dispatch,changeColor]
  );

  useEffect(() => {
    if (color !== selectedColor) {
      const value = getGradientObject("#ffffff");
      if (!value?.isGradient) {
        return throttleChange(toHex(selectedColor));
      }
      throttleChange(selectedColor);
    }
  }, [selectedColor])
  
  return (
    <Popover
      trigger={trigger}
      placement="left"
      destroyOnHidden={true}
      onOpenChange={(value) => {
        setVisible(value);
      }}
      content={
        <PopoverContainer>
          <StyledColorPicker
            disableDarkMode
            value={color}
            onChange={setSelectedColor}
            width={250}
            height={160}
            presets={presetColors}
            $allowGradient={props.allowGradient}
          />
        </PopoverContainer>
      }
    >
      <ColorBlock $color={color}>
      </ColorBlock>
    </Popover>
  );
};

// pre-defined color block
const ConstantDiv = styled.div`
  display: flex;
  width: 216px;
  gap: 8px;
  flex-wrap: wrap;
`;
const ConstantBlock = styled.div.attrs<{ color: string }>((props) => ({
  tabIndex: 0,
  style: {
    backgroundColor: props.color,
  },
}))`
  height: 24px;
  width: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;

  :focus {
    box-shadow: 0 0 0 2px #d6e4ff;
  }
`;
// main container
const colorfulStyle = css`
  .react-colorful {
    width: 216px;
    height: 175px;
    gap: 6px;
  }

  .react-colorful__hue {
    height: 8px;
    margin-top: 7px;
    border-radius: 8px;
    width: 176px;
  }

  .react-colorful__alpha {
    width: 176px;
    height: 8px;
    background-size: contain;
  }

  .react-colorful__last-control {
    border-radius: 8px;
  }

  .react-colorful__saturation {
    border-radius: 8px;
    border-bottom: 4px solid #000;
  }

  .react-colorful__interactive {
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .react-colorful__pointer {
    height: 10px;
    width: 10px;
    border: 3px solid #fff;
  }
`;
const PopoverContainer = styled.div`
  ${colorfulStyle};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
// contrast block
const AlphaDiv = styled.div.attrs((props) => ({
  style: {
    backgroundColor: props.color,
  },
}))`
  position: absolute;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  bottom: 0;
  right: 0;
  background-clip: content-box;
`;

const BackDiv = styled.div.attrs<{ $color: string }>((props: { $color: string }) => ({
  style: {
    opacity: 1 - parseFloat(props.$color ? props.$color : "1"),
  },
}))`
  height: 100%;
  width: 100%;
  background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0dGVybiBpZD0icGF0dGVybi0xIiBwYXR0ZXJuVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiB4PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+CiAgICAgICAgICAgIDx1c2UgeGxpbms6aHJlZj0iI2ltYWdlLTIiIHRyYW5zZm9ybT0ic2NhbGUoMC41LDAuNSkiPjwvdXNlPgogICAgICAgIDwvcGF0dGVybj4KICAgICAgICA8aW1hZ2UgaWQ9ImltYWdlLTIiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFEQUFBQUF3Q0FZQUFBQlhBdm1IQUFBQUFYTlNSMElBcnM0YzZRQUFBTE5KUkVGVWFBWHRtRUVLd3pBTUJPUCt5ZjkvZ0IvVjB1TWV4WkJ0QTVPYndKTGlHUXVNMTk3N2ZRMitjODRhTEwvdXJ2K2EvTXcvcm5VRHY3YWlBUTFBQWg0aENCQ25hd0FqaEFVZWIyQjByL25DdXZ0dU02My9lQU51QU00Z1R0Y0FSZ2dMYUFBQ3hPa2F3QWhoQVExQWdEaDlUZThldmd0aDVsbkFHVWdlL1VnRGZlYlpVUVBKb3g5cG9NODhPMm9nZWZRajM0WDZ6TE9qTTVBOCtwRUcrc3l6b3dhU1J6L1NRSjk1ZHRSQTh1aEhIeHRKRzVsckREVTlBQUFBQUVsRlRrU3VRbUNDIj48L2ltYWdlPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0i572R5qC85bqV6ImyIj4KICAgICAgICAgICAgPHBvbHlnb24gaWQ9Iue7hOS7ti3ovpPlhaXmoYYiIGZpbGw9IiNGRkZGRkYiIHBvaW50cz0iLTkuMjgyNTc3MzdlLTE1IDAgMjQgMCAyNCAyNCAtOS4yODI1NzczN2UtMTUgMjQiPjwvcG9seWdvbj4KICAgICAgICAgICAgPHBvbHlnb24gaWQ9Iue7hOS7ti3ovpPlhaXmoYYiIGZpbGwtb3BhY2l0eT0iMC4yIiBmaWxsPSJ1cmwoI3BhdHRlcm4tMSkiIHBvaW50cz0iLTkuMjgyNTc3MzdlLTE1IDAgMjQgMCAyNCAyNCAtOS4yODI1NzczN2UtMTUgMjQiPjwvcG9seWdvbj4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==");
`;
// main block
const ColorBlock = styled.div<{ $color: string }>`
  background: ${(props) => (
    isValidColor(props.$color) || isValidGradient(props.$color)
    ? props.$color
    : "#FFFFFF"
  )};
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  height: 24px;
  width: 24px;
  cursor: pointer;
  background-clip: content-box;
  overflow: hidden;
`;

const StyledColorPicker = styled(ColorPicker)<{$allowGradient?: boolean}>`
  #rbgcp-wrapper > div:nth-child(2) > div:first-child > div:first-child {
    ${props => !props.$allowGradient && `visibility: hidden`};
  }
  #rbgcp-wrapper > div:last-child > div:last-child {
    justify-content: flex-start !important;
    gap: 3px;
  
    > div {
      border: 1px solid lightgray;
    }
  }
`;