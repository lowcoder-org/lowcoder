import type { BrandingConfig } from "api/enterpriseApi";
import { Logo, LogoHome } from "assets/images";
import { trans } from "i18n";
import { buildMaterialPreviewURL } from "util/materialUtils";
import styled from "styled-components";

const BrandLogo = styled.img`
  height: 28px;
  max-width: 100%;
  object-fit: contain;
`;

export function AdminBrand({ branding, showName }: { branding?: BrandingConfig; showName: boolean }) {
  const { logo, standardTitle } = branding?.config_set || {};
  const name = standardTitle || trans("productName");
  if (logo) return <BrandLogo src={branding?.orgId ? buildMaterialPreviewURL(logo) : logo} alt={name} />;
  if (!showName && !standardTitle) return <LogoHome />;
  return (
    <span className="admin-brand-name">
      {!standardTitle && <span className="admin-brand-mark"><Logo /></span>}
      <span className="admin-brand-title" title={name}>{name}</span>
    </span>
  );
}
