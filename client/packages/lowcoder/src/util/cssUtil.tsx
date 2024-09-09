type Direction = {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export const parseMarginOrPadding = (style: string):Direction  => {
  const styles = style.split(' ');
  if (styles.length === 1) {
    return {
      top: styles[0], right: styles[0], bottom: styles[0], left: styles[0],
    };
  }
  if (styles.length === 2) {
    return {
      top: styles[0], right: styles[1], bottom: styles[0], left: styles[1],
    };
  }
  if (styles.length === 3) {
    return {
      top: styles[0], right: styles[1], bottom: styles[2], left: styles[1],
    };
  }
  if (styles.length === 4) {
    return {
      top: styles[0], right: styles[1], bottom: styles[2], left: styles[3],
    };
  }
  // invalid margin/padding
  return {
    top: '0px', right: '0px', bottom: '0px', left: '0px',
  };
}

export const getVerticalMargin = (margin: string[]) => {
  if(margin.length === 1) return `(${margin[0]} + ${margin[0]})`;
  if(margin.length === 2) return `(${margin[0]} + ${margin[0]})`;
  if(margin.length === 3 || margin.length === 4)
    return `(${margin[0]} + ${margin[2]})`;

  return '0px';
}

export const getHorizontalMargin = (margin: string[]) => {
  if(margin.length === 1) return `(${margin[0]} + ${margin[0]})`;
  if(margin.length === 2) return `(${margin[1]} + ${margin[1]})`;
  if(margin.length === 3 || margin.length === 4)
    return `(${margin[1]} + ${margin[3]})`;

  return '0px';
}
