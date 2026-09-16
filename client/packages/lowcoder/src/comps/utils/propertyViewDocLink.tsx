import { DocLink } from "lowcoder-design";
import { trans } from "i18n";

export function PropertyViewDocLink(props: { href: string }) {
  return (
    <div style={{ padding: "8px 16px 12px" }}>
      <DocLink href={props.href} title={trans("comp.menuViewDocsTooltip")}>
        {trans("comp.menuViewDocs")}
      </DocLink>
    </div>
  );
}
