//window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
import { ReactComponent as LogoIcon } from "./logo-with-name-home.svg";
import { ReactComponent as LogoWithNameIcon } from "./logo-with-name-home.svg";
import { ReactComponent as LogoHomeIcon } from "./logo-with-name-home.svg";

export { default as favicon } from "./favicon.ico";

export const Logo = (props: { branding?: boolean }) => {
  return <LogoIcon />;
};
export const LogoWithName = (props: { branding?: boolean }) => {
  return <LogoWithNameIcon />;
};
export const LogoHome = (props: { branding?: boolean }) => {
  return <LogoHomeIcon />;
};
