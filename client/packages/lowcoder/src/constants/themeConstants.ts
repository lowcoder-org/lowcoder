import { ThemeDetail } from "@lowcoder-ee/api/commonSettingApi";

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
    borderWidth: '1px',
    border: '#D7D9E0'
  }
};

const table = {
  style: {
    borderWidth: '1px'
  },
  rowStyle: {
    borderWidth: '1px'
  },
  headerStyle: {
    borderWidth: '1px'
  },
  columnsStyle: {
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
;

export const defaultTheme: ThemeDetail = {
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
  gridColumns: "24",
  textSize: "14px",
  text: "#222222",
  animation: "",
  animationDelay: "",
  animationDuration: "",
  opacity: "1",
  boxShadow: "",
  boxShadowColor: "",
  animationIterationCount: "",
  components: {
    text,
    input,
    table,
    link,
    rating,
    password: input,
    numberInput: input,
    textArea: input,
    autocomplete: input,
    switch: input,
    checkbox: input,
    radio: input,
    date: input,
    dateRange: input,
    time: input,
    timeRange: input,
    slider: input,
    rangeSlider: input,
    segmentedControl,
    select: input,
    multiSelect: input,
  },
};
