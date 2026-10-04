# ARCHLAB UI upgrade

All working surfaces share Material Tailwind primitives and the existing architectural bronze/charcoal identity. The Uzbek product copy, Figma assets, routes, roles and API contracts remain in place.

## Coverage

| Routes                               | UI composition                                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Login                                | Material inputs, password visibility action, checkbox, submit button, error/loading feedback; original imagery                          |
| Projects and all six categories      | Material search input, segmented year filter, card/table composition, status chips, action buttons, create/edit/preview/archive dialogs |
| Project and nested folders           | Material keyboard tabs, folder table, document views, file dialogs and stacked confirmations                                            |
| Contracts, expenses, letters, orders | Shared document cards/tables, filters, fields/selects, monetary forms, XLSX and attachment actions                                      |
| Users                                | Staff table, authenticated avatars, role/position selectors, checkbox and password fields in dialogs                                    |
| Tasks                                | Priority/status/assignee selectors, date fields, empty-state card and modal view/edit/archive                                           |
| Files                                | Search, file metadata, backup badges, download actions, preview and archive dialogs                                                     |
| Dashboard                            | Linked metric cards with preserved API totals                                                                                           |
| Notifications                        | Card feed, alerts/loading, read actions and pagination                                                                                  |
| Settings                             | Profile/password/company card forms, live theme selector, GitHub archive statistics                                                     |
| Chat and calls                       | Material navigation/actions/avatars, inputs, participant checkboxes, message cards and call dialogs; existing Socket.IO/WebRTC behavior |
| App shell                            | Material Navbar, List, sidebar Card, search, theme switch and profile actions                                                           |

## Compatibility

- React 18.3.1; `@material-tailwind/react` 2.1.10; Anime.js 4.5.0.
- Material Tailwind 2 includes concrete React 18.2 dependencies. Scoped npm overrides resolve them to the application's React dependencies. Vite also explicitly deduplicates React and React DOM. Installation requires neither `--force` nor `--legacy-peer-deps`.
- Tailwind 4 remains in use. `withMT` supplies library tokens; explicit `@source` directives scan component/theme classes. ARCHLAB's final unlayered token stylesheet defines light/dark surfaces and control states.
- Named imports from the installed component modules avoid loading unused components and work in both Vite dev and production builds.
- Select adapts the former `onChange(event)` API to Material Select. A separate non-accessible native control retains form validation/FormData. Accessible names and keyboard operation belong to the visible picker.

## Motion and accessibility

`MotionRoot` uses short-lived Anime.js scopes for each active animation. It animates newly mounted routes, panels, table bodies, search/select menus, feedback, messages, and button hover/press/release. It caps entrance batches, cleans detached targets, releases completed scopes and reverts on unmount. Switching reduced motion on and off does not retain stale callbacks. Reduced-motion preferences disable this motion and restore transient styles.

Dialogs use Material Dialog, Header and Body with Anime.js entrance/exit, explicit layer order, accessible titles, escape/outside dismissal and the library's focus management. The entire Dialog is removed after the exit animation so its internal presence delay cannot hold keyboard focus unnecessarily. Busy dialogs cannot be dismissed.

Project tabs support arrows, Home/End, Enter/Space and roving focus. All themes retain visible focus, readable contrast, scrollable data tables, mobile navigation and modal view/edit/delete confirmation. File uploads show actual HTTP transfer progress and success feedback; GitHub archiving remains asynchronous.

## Verification

Run `npm run lint`, `npm run build`, `npm run test:integration`, and `npm run test:storage`. Browser checks use a separate MongoDB at **127.0.0.1:27021**, never production. Material Select checks exercise the real visible options.

The integration suite includes upload authorization, project/folder/record CRUD, XLSX, search-to-modal navigation, archive/restore, nested dialogs, focus, persistence/system/multiple-tab themes, hover/press, reduced motion, two-user chat and synthetic-device WebRTC calls. The route matrix checks every working route in both themes at 1440, 360, 390 and 768 pixels and saves screenshots/reports under ignored `test-artifacts/`.

Figma MCP's Starter call limit prevented a fresh design-context fetch during this upgrade. Existing checked-in Figma assets and the established layout were reused; no new pixel-identity claim is made.

References: [Material Tailwind](https://www.material-tailwind.com/docs/react/installation), [Anime.js React scopes](https://animejs.com/documentation/getting-started/using-with-react/), [Tailwind directives](https://tailwindcss.com/docs/functions-and-directives).
