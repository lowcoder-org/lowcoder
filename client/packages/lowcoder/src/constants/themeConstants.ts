import { ThemeDetail } from "@lowcoder-ee/api/commonSettingApi";

const theme = {
  primary: "#3377FF",
  textDark: "#222222",
  textLight: "#FFFFFF",
  canvas: "#F5F5F6",
  primarySurface: "#FFFFFF",
  border: "#D7D9E0",
  radius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "3px",
  padding: "3px",
  lineHeight: "18px",
  gridColumns: "24",
  textSize: "14px",
  // text: "#222222",
  animation: "",
  animationDelay: "",
  animationDuration: "",
  opacity: "1",
  boxShadow: "",
  boxShadowColor: "",
  animationIterationCount: "",
  showComponentLoadingIndicators: true,
  showDataLoadingIndicators: true,
};

const text = {
  style: {
    borderWidth: 0,
  }
};

const input = {
  style: {
    borderWidth: '0px',
    background: 'transparent',  
  },
  labelStyle: {
    borderWidth: '0px',
  },
  inputFieldStyle: {
    // borderWidth: '1px',
    border: theme.border,
    lineHeight: theme.lineHeight,
  }
};

const select = {
  ...input,
  childrenInputFieldStyle: {
    borderWidth: '0px',
  }
};

const table = {
  style: {
    borderWidth: '1px',
    borderStyle: 'solid',
    border: '#D7D9E0',
  },
  rowStyle: {
    borderWidth: '1px',
    borderStyle: 'solid',
    border: '#D7D9E0',
  },
  headerStyle: {
    borderWidth: '1px',
    borderStyle: 'solid',
    border: '#D7D9E0',
  },
  columnsStyle: {
    radius: '0px'
  },
  summaryRowStyle: {
    radius: '0px'
  }
}

const link = {
  style: {
    borderWidth: '0px',
    background: 'transparent',
  }
}

const rating = {
  style: {
    background: 'transparent',
    borderWidth: '0px',
  },
  labelStyle: {
    borderWidth: '0px',
  },
  inputFieldStyle: {
    borderWidth: '0px',
  }
}

const segmentedControl = {
  style: {
    borderWidth: '0px',
  }
};

const columnLayout = {
  columnStyle: {
    borderWidth: '1px',
  }
};

const tabbedContainer  = {
  style: {
    borderWidth: '1px',
  }
};

const step  = {
  style: {text:'#D7D9E0'}
};

const pageLayout  = {
  style: {
    borderWidth: '1px',
  }
};

const qrCode  = {
  style: {
    background:'transparent'
  }
};

const divider = {
  style: {
    radius: "0px"
  }
};

const navigation = {
  style: {
    borderWidth: '0px',
  }
}

const slider = {
  ...input,
  inputFieldStyle: {
    ...input.inputFieldStyle,
    track: '#D7D9E0',
  }
}

const switchComp = {
  ...input,
  inputFieldStyle: {
    ...input.inputFieldStyle,
    unchecked: '#D7D9E0',
  }
}

const checkbox = {
  ...input,
  inputFieldStyle: {
    ...input.inputFieldStyle,
    uncheckedBorder: '#D7D9E0',
  }
}

const tree = {
  ...input.inputFieldStyle,
  labelStyle: {
    borderWidth: '0px',
  },
  style: { background: theme.primarySurface }
  
}


export const defaultTheme: ThemeDetail = {
  ...theme,
  components: {
    text,
    input,
    table,
    link,
    rating,
    columnLayout,
    tabbedContainer,
    step,
    qrCode,
    pageLayout,
    divider,
    navigation,
    slider,
    checkbox,
    password: input,
    numberInput: input,
    textArea: input,
    autocomplete: input,
    switch: switchComp,
    radio: checkbox,
    date: input,
    dateRange: input,
    time: input,
    timeRange: input,
    rangeSlider: slider,
    segmentedControl,
    select: select,
    multiSelect: select,
    treeSelect: select,
    tree:tree
  },
};
