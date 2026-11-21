---
'@rexnow/libs': patch
'@rexnow/rslib-plugin': patch
'create-rex-widget': patch
---

- `@rexnow/libs`: align `WidgetAdaptor.http.request` with Rex `WidgetShim` / `modules.rexnow.app` proxy by only reading `data` and deprecating `body`.
- `@rexnow/rslib-plugin`: support Rslib `MultiStats` output discovery, ignore non-JS assets during post-build processing, and deduplicate generated declarations for variants sharing a `WidgetMetadata.id`.
- `create-rex-widget`: migrate templates from deprecated `lib.autoExternal` to `output.autoExternal`.
