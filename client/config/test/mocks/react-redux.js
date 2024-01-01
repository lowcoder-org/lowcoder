export default jest.mock("react-redux", () => ({
  connect: () => (Component) => Component,
}));