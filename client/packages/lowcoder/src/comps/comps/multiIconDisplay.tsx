
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { findIconDefinition, library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import * as AntdIcons from '@ant-design/icons';

library.add(far,fas);

function parseIconIdentifier(identifier: string) {
  if (identifier.startsWith('/icon:antd/')) {
    let name = identifier.split('/')[2];
    return { type: 'antd', name };
  } 
  else if (identifier.startsWith('/icon:solid/') || identifier.startsWith('/icon:regular/')) {
    const [style, name] = identifier.substring(6).split('/');
    return { type: 'fontAwesome', style, name };
  } 
  else if (identifier.startsWith('data:image')) {
    return { type: 'base64', data: identifier, name: "" };
  } 
  else if (identifier.startsWith('http')) {
    return { type: 'url', url: identifier, name: "" };
  } 
  else {
    return { type: 'unknown', name: "" };
  }
}

interface IconProps {
  identifier: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

const convertToCamelCase = (name: string) => {
  return name.replace(/(-\w)/g, (match) => match[1].toUpperCase());
}

const appendStyleSuffix = (name: string) => {
  if (name.endsWith('outlined')) {
    return name.replace('outlined', 'Outlined');
  } else if (name.endsWith('filled')) {
    return name.replace('filled', 'Filled');
  } else if (name.endsWith('twotone')) {
    return name.replace('twotone', 'TwoTone');
  }
  return name;
}

// Multi icon Display Component

const baseMultiIconDisplay: React.FC<IconProps> = ({ identifier, width = '24px', height = '24px', style }) => {
  
  const iconData = parseIconIdentifier(identifier);

  if (iconData.type === 'fontAwesome') {
    const prefix = iconData.style === 'solid' ? 'fas' : 'far'; // 'fas' for solid, 'far' for regular
    // Find the icon definition using prefix and iconName
    const iconLookup = findIconDefinition({ prefix: prefix as any, iconName: iconData.name as any });

    if (!iconLookup) {
      console.error(`Icon ${iconData.name} with prefix ${prefix} not found`);
      return null;
    }
    return <FontAwesomeIcon icon={iconLookup} style={{ width, height, ...style }} />;
  } 
  else if (iconData.type === 'antd') {
    let iconName = convertToCamelCase(iconData.name);
    iconName = appendStyleSuffix(iconName);
    iconName = iconName.charAt(0).toUpperCase() + iconName.slice(1); 
    const AntdIcon = (AntdIcons as any)[iconName];
    if (!AntdIcon) {
      console.error(`ANTd Icon ${iconData.name} not found`);
      return null;
    }
    return <AntdIcon style={{ fontSize: width, ...style }} />;
  } 
  else if (iconData.type === 'url' || iconData.type === 'base64') {
    return <img src={iconData.type === 'url' ? iconData.url : iconData.data} alt="icon" style={{ width, height, ...style }} />;
  } 
  else {
    return null; // Unknown type
  }
};

export const MultiIconDisplay = baseMultiIconDisplay;