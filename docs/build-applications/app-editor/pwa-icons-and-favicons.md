# Per-App PWA Icons and Favicons

-   **What**: Each app can have its own favicon and PWA icons.
-   **Where set**: App settings → `icon`.
-   **Frontend behavior**:
    -   Editor/App routes inject per-app `<link rel="icon">` and `apple-touch-icon`.
    -   Admin routes use a default favicon and do not include per-app manifest/icons.

## Endpoints

-   **List sizes (JSON)**:
    -   `GET /api/applications/{appId}/icons`
-   **PNG icon sizes**:
    -   `GET /api/applications/{appId}/icons/{size}.png`
    -   Allowed sizes: `48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512`
-   **Optional background color**:
    -   Append `?bg=#RRGGBB` (or `?bg=RRGGBB`) to render a solid background.

## Manifest

-   Per-app manifest: `GET /api/applications/{appId}/manifest.json`
-   Includes:
    -   `id`, `start_url`, `scope`, `display` = `standalone`
    -   `theme_color` and `background_color`
    -   `icons`: multiple sizes (see above) with `purpose: any maskable`
    -   `shortcuts`: View and Edit
    -   `categories`: `productivity`, `business`

## Frontend integration

-   **Favicon (tab icon)**:
    -   Uses `/icons/192.png` with optional `?bg=` based on branding color if provided.
-   **Apple touch icon and startup image**:
    -   Use `/icons/512.png` with optional `?bg=`.
-   **Fallbacks**:
    -   If app icon is missing, falls back to brand logo or a default 512 image.

## Utilities (frontend)

```ts
import { getAppIconPngUrl, getOgImageUrl } from 'util/iconConversionUtils'

const icon192 = getAppIconPngUrl(appId, 192, brandingColor)
const ogImage = getOgImageUrl(appId, brandingColor)
```

## Notes

-   PNG generation supports data URLs and HTTP/HTTPS images that Java ImageIO can decode.
-   Unsupported icons render a graceful placeholder with optional background color.
-   Cache headers: `Cache-Control: public, max-age=7d`.
