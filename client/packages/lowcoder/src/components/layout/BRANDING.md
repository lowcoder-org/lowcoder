# Admin branding

The Admin shell uses the existing Enterprise branding API and Redux state. It does
not introduce another branding API, setting or database representation.

- `getBrandingSetting` selects the current workspace configuration, then the global
  configuration. These are complete configurations, not a field-by-field merge.
  This preserves explicit `false` settings and the origin of logo references
  (workspace material IDs versus global URLs).
- `getAdminAppearance` translates the settings into Ant Design tokens and
  `--admin-*` CSS variables. New Admin components should use these instead of fixed
  Lowcoder colors. Semantic error/success colors and app artwork remain independent.
- Header and sidebar settings override the generated palette. The primary color
  remains exact; text on that color and links get readable foreground colors.
- Stored font names such as `Open+Sans` are normalized for CSS. The existing app
  font loader loads the selected font. No custom font is required for the default
  locally bundled Ubuntu font.
- The scoped styled-components theme carries variables into custom portal content.
  The nested Ant App supplies themed imperative dialogs/messages and restores the
  outer instances when leaving Admin. The app editor retains its own theme.
- Existing custom CSS hooks (`top-header`, `sidebar`, `sidebar-item`,
  `sidebar-section`, `main-content`) and the workspace preload CSS path remain.

With the Vite development server running, `/admin-branding-preview.html` exercises
the real shell, navigation, cards, tables and dialogs with sample company settings.
It never saves account settings or calls the branding API, and is not a production
build entry. Use it to check different brands, responsive navigation and custom CSS.

Regression coverage is in `adminAppearance.test.ts`, `adminTheme.test.tsx` and
`redux/sagas/enterpriseBranding.test.ts`, including workspace switches and API
failures. Branding API persistence still requires an Enterprise backend for a live
end-to-end check.
