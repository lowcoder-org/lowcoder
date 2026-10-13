import { Alert, Button } from "antd";
import { trans } from "i18n";

export function AdminListError({ retry }: { retry: () => void }) {
  return <Alert type="error" showIcon message={trans("admin.loadError")}
    action={<Button size="small" onClick={retry}>{trans("admin.retry")}</Button>} />;
}
