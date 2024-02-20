import { I18nObjects } from "./types";

export const enObj: I18nObjects = {
  jsonForm: {
    defaultSchema: {
      title: "User Information",
      description: "Form Example",
      type: "object",
      required: ["name", "phone"],
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
        phone: {
          type: "string",
          title: "Phone",
          minLength: 11,
        },
        birthday: {
          type: "string",
          title: "Birthday",
        },
      },
    },
    defaultUiSchema: {
      name: {
        "ui:autofocus": true,
        "ui:emptyValue": "",
      },
      phone: {
        "ui:help": "at least 11 characters",
      },
      birthday: {
        "ui:widget": "date",
      },
    },
    defaultFormData: {
      name: "David",
      phone: "13488886666",
      birthday: "1980-03-16",
    },
  },
  table: {
    columns: [
      { key: "id", title: "ID" },
      { key: "name", title: "Name" },
      { key: "date", title: "Date" },
      { key: "department", title: "Department", isTag: true },
    ],
    defaultData: [
      {
        id: 1,
        name: "Reagen Gilberthorpe",
        date: "7/5/2022",
        department: "Marketing",
      },
      {
        id: 2,
        name: "Haroun Lortzing",
        date: "11/6/2022",
        department: "Human Resources",
      },
      {
        id: 3,
        name: "Garret Kilmaster",
        date: "11/14/2021",
        department: "Research and Development",
      },
      {
        id: 4,
        name: "Israel Harrowsmith",
        date: "4/3/2022",
        department: "Training",
      },
      {
        id: 5,
        name: "Loren O'Lagen",
        date: "9/10/2022",
        department: "Services",
      },
      {
        id: 6,
        name: "Wallis Hothersall",
        date: "4/18/2022",
        department: "Accounting",
      },
      {
        id: 7,
        name: "Kaia Biskup",
        date: "3/4/2022",
        department: "Sales",
      },
      {
        id: 8,
        name: "Travers Saterweyte",
        date: "1/9/2022",
        department: "Human Resources",
      },
      {
        id: 9,
        name: "Mikey Niemetz",
        date: "1/4/2022",
        department: "Marketing",
      },
      {
        id: 10,
        name: "Mano Meckiff",
        date: "2/19/2022",
        department: "Research and Development",
      },
    ],
  },
  editorTutorials: {
    mockDataUrl: "https://6523073ef43b179384152c4f.mockapi.io/api/lowcoder/users",
    data: (code) => (
      <>
        The current State of the Component with all Settings and Data listed here. You can reference to this data with the handlebar expression.
        For example: {code("{{table1.selectedRow}}")}.
      </>
    ),
    compProperties: (code) => (
      <>
        When the component is selected, its properties are displayed on the right. Now you can set a Data Binding. Please delete all static Data and enter the following handlebar expression:
        {code("{{query1.data}}")}. With this, you bind the data of the query to the table. The table will automatically display the data returned by the query. If the query updates the data, the table will also update the data automatically.
      </>
    ),
  },
  cascader: [
    {
      value: "California",
      label: "California",
      children: [
        {
          value: "San Francisco",
          label: "San Francisco",
          children: [
            {
              value: "The Golden Gate Bridge",
              label: "The Golden Gate Bridge",
            },
          ],
        },
      ],
    },
    {
      value: "New South Wales",
      label: "New South Wales",
      children: [
        {
          value: "Sydney",
          label: "Sydney",
          children: [
            {
              value: "Sydney Opera House",
              label: "Sydney Opera House",
            },
          ],
        },
      ],
    },
  ],
  cascaderDefult: ["California", "San Francisco", "The Golden Gate Bridge"],
};
