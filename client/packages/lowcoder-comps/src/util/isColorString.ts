export default function isColorString(color: string) {
  const element = document.createElement("isColorString");
  element.style.backgroundColor = color;
  return element.style.backgroundColor !== '';
}