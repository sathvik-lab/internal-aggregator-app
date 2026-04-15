# Deep Linking Host Limitations

## Supported
- Custom scheme links via `foodtruckcompliance://...` from app config `scheme`.
- Path mappings from `DEEP_LINKING_CONFIG`:
  - `foodtruckcompliance://login`
  - `foodtruckcompliance://dashboard`
  - `foodtruckcompliance://documents/list`
  - `foodtruckcompliance://readiness`

## Host / Universal Link Constraints
- `https://foodtruckcompliance.app/...` and **`https://www.foodtruckcompliance.app/...`** (see `app.config.js` + `DEEP_LINKING_CONFIG.prefixes`) require domain hosting outside this repo:
  - iOS: Apple App Site Association (AASA) on each host you list under `associatedDomains`.
  - Android: Digital Asset Links (`assetlinks.json`) for the same hosts used in `intentFilters`.
- Until those files are live and valid, HTTPS links can open browser/fallback instead of app.
- Custom scheme links do not require domain verification and should work first for cold-start deep-link validation.
