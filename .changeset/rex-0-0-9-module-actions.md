---
"@rexnow/libs": minor
"@rexnow/rslib-plugin": minor
---

Add Rex 0.0.9 custom button and item action support:

- `@rexnow/libs`: add `WidgetAction`, `WidgetEditActionParams`, `WidgetItemActionParams`, `WidgetActionResult`, `BaseWidgetModule.editActions`, and `VideoItemChild.actions` (including generated Zod schemas).
- `@rexnow/rslib-plugin`: validate `editActions` via updated metadata schema and generate typed declarations for module `editActions` handlers in `rex-widget-env.d.ts`.
