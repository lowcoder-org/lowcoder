import { I18nObjects } from "./types";

export const enObj: I18nObjects = {
  jsonForm: {
    defaultSchema: {
      title: "Informações do Usuário",
      description: "Formulário de Exemplo",
      type: "objeto",
      required: ["nome", "telefone"],
      properties: {
        name: {
          type: "string",
          title: "Nome",
        },
        phone: {
          type: "string",
          title: "Telefone",
          minLength: 11,
        },
        birthday: {
          type: "string",
          title: "Aniversário",
        },
      },
    },
    defaultUiSchema: {
      name: {
        "ui:autofocus": true,
        "ui:emptyValue": "",
      },
      phone: {
        "ui:help": "no mínimo 11 caractéres",
      },
      birthday: {
        "ui:widget": "data",
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
      { key: "name", title: "Nome" },
      { key: "date", title: "Data" },
      { key: "department", title: "Departamento", isTag: true },
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
        department: "Recursos Humanos",
      },
      {
        id: 3,
        name: "Garret Kilmaster",
        date: "11/14/2021",
        department: "Pesquisa e Desenvolvimento",
      },
      {
        id: 4,
        name: "Israel Harrowsmith",
        date: "4/3/2022",
        department: "Treinamento",
      },
      {
        id: 5,
        name: "Loren O'Lagen",
        date: "9/10/2022",
        department: "Serviços",
      },
      {
        id: 6,
        name: "Wallis Hothersall",
        date: "4/18/2022",
        department: "Financeiro",
      },
      {
        id: 7,
        name: "Kaia Biskup",
        date: "3/4/2022",
        department: "Vendas",
      },
      {
        id: 8,
        name: "Travers Saterweyte",
        date: "1/9/2022",
        department: "Recursos Humanos",
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
        department: "Pesquisa e Desenvolvimento",
      },
    ],
  },
  editorTutorials: {
    mockDataUrl: "https://6523073ef43b179384152c4f.mockapi.io/api/lowcoder/users",
    data: (code) => (
      <>
        O Estado atual do Componente com todas as Configurações e Dados listados aqui. Você pode referenciar estes dados com a expressão guidão.
        Por Exemplo: {code("{{table1.selectedRow}}")}.
      </>
    ),
    compProperties: (code) => (
      <>
        Quando o componente for selecionado, as suas propriedades serão mostradas na direita. Agora você pode definir uma Vinculação de Dados. Por favor, apague os Dados estáticos e insira a seguinte expressão guidão:
        {code("{{query1.data}}")}. Com isso, você pode vincular os dados da query para na tabela. A tabela irá mostrar automaticamente os dados retornados pela query. Se a query atualiza os dados, a tabela também irá atualizar automaticamente.
      </>
    ),
  },
  cascader: [
    {
      value: "Califórnia",
      label: "Califórnia",
      children: [
        {
          value: "São Francisco",
          label: "São Francisco",
          children: [
            {
              value: "A Ponte Golden Gate",
              label: "A Ponte Golden Gate",
            },
          ],
        },
      ],
    },
    {
      value: "Nova Gales do Sul",
      label: "Nova Gales do Sul",
      children: [
        {
          value: "Sidney",
          label: "Sidney",
          children: [
            {
              value: "Casa de Ópera de Sidney",
              label: "Casa de Ópera de Sidney",
            },
          ],
        },
      ],
    },
  ],
  cascaderDefult: ["Califórnia", "São Francisco", "A Ponte Golden Gate"],
};
