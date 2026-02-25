# Code Analysis: wp-sig Plugin

## Security Issues

### ~~CRITICAL: SQL Injection~~ FIXED

~~**File:** `includes/services/event-service.php:146`~~ — Raw `$event['id']` interpolation replaced with `$wpdb->prepare()` using `%d` placeholder.

~~**File:** `includes/services/member-service.php:289`~~ — `$limit` is now cast to `(int)` and passed through `$wpdb->prepare()` as a `%d` placeholder.

### ~~HIGH: Redundant Manual Nonce Check on REST API~~ FIXED

~~**File:** `includes/controllers/public-api-controller.php:41-44`~~ — Removed the manual `wp_verify_nonce()` check. The endpoint uses `'__return_true'` as its permission callback (intended for unauthenticated visitors), so the manual nonce check was blocking public registration.

### ~~HIGH: Unsanitized File Content Stored Directly in Database~~ FIXED

~~**File:** `includes/services/setting-service.php:265`~~ — Added JSON validity check (`json_decode` + `json_last_error`) and GeoJSON structure validation (must have `type` and `features` array) before storing content in the database.

### ~~HIGH: Direct Access to `$_FILES` Superglobal~~ FIXED

~~**File:** `includes/controllers/setting-controller.php:96`~~ — Replaced `$_FILES['geojson_file']` with `$request->get_file_params()['geojson_file']` to use the WordPress REST API request abstraction.

### ~~MEDIUM: Unused Permission Methods~~ FIXED

~~**Files:** `includes/controllers/member-controller.php`, `includes/controllers/setting-controller.php`~~ — Removed unused `logged_in_permissions_check()` and `public_permissions_check()` methods from both controllers.

### ~~MEDIUM: `$wpdb->prepare()` Called Without Placeholders~~ FIXED

~~**File:** `includes/services/event-service.php`~~ — Removed unnecessary `$wpdb->prepare()` wrappers from three queries that had no placeholders (`get_recent_completed_events`, `get_active_api_form_details`, `get_active_api_form_details_public`).

### MEDIUM: Uninstall Does Not Clean Up Data

**File:** `uninstall.php`

The uninstall file is essentially empty — it doesn't drop the four custom tables (`sig_members`, `sig_events`, `sig_member_events`, `sig_geojson_datasets`) or remove the `sig_plugin_settings` option. This leaves orphaned data in the database after plugin removal. *(Kept intentionally per project decision.)*

---

## Code Quality & Bad Practices

### ~~`get_settings()` Discards Its Own Defaults~~ FIXED

~~**File:** `includes/services/setting-service.php`~~ — Removed the redundant second `get_option()` call. The method now returns the properly merged result from `wp_parse_args($settings, $defaults)`.

### ~~Multiple Service Instantiation (No Dependency Injection)~~ FIXED

~~All controllers and services now accept optional constructor parameters for their dependencies.~~ `class-wp-sig.php` creates shared `SettingsService`, `EventService`, `MemberService`, and `ImportService` instances once and passes them to all controllers, eliminating redundant object trees. Services still fall back to `new` if no dependency is provided, preserving backward compatibility.

### Inconsistent Error Response Patterns

The codebase mixes three different error response patterns:

1. Returning `WP_Error` objects (e.g., `event-service.php:179`)
2. Returning `WP_REST_Response` with error data (e.g., `import-controller.php:28`)
3. Returning `WP_REST_Response` wrapping `WP_Error` messages (e.g., `member-controller.php:121-125`)

This inconsistency means the frontend must handle multiple response shapes for error cases.

### ~~`finish_active_event()` Has a Dangerous Mass Update~~ FIXED

~~**File:** `includes/services/event-service.php`~~ — Replaced the blanket `UPDATE sig_members SET status='verified' WHERE status='pending'` with a JOIN query scoped to only members who participated in the finishing event.

### ~~Unused `handle_geojson_upload` Method~~ FIXED

~~**File:** `includes/services/setting-service.php`~~ — Removed dead code: `handle_geojson_upload()`, `custom_geojson_upload_dir()`, `add_geojson_mime_type()`, and the `$upload_context` property.

### ~~`console.log` Left in Production Code~~ FIXED

~~**File:** `src/components/dashboard/RegionMap.jsx:125`~~ — Removed.

### ~~Dashboard Uses Raw `fetch()` Instead of TanStack Query~~ FIXED

~~**File:** `src/pages/Dashboard.jsx`~~ — Refactored to use TanStack Query. Created `src/hooks/use-api.js` with `useSettings`, `useEvents`, `useMemberSummary`, `useMembers`, `useSaveMember`, and `useDeleteMember` hooks. Dashboard now uses `useQuery` for all reads and `useMutation` for writes, with automatic cache invalidation on mutations. Removed ~100 lines of manual fetch/state management boilerplate.

### ~~Duplicated Form Logic~~ FIXED

~~`MemberForm.jsx` and `RegistrationForm.jsx`~~ — Extracted shared logic into:
- `src/hooks/use-region-fields.js` — `useRegionFields()` hook for district/village option transformation and filtering, plus `sanitizePhoneNumber()` utility.
- `src/components/shared/RegionFields.jsx` — Shared component for the outside-region checkbox, district select, and village select fields.

Both forms now import and use these shared modules.

---

## Consistency Issues

### Mixed Comment Language

Comments alternate between Indonesian and English, sometimes within the same file:

- `event-service.php`: `// Validasi status untuk keamanan` vs `// Data baru`
- `class-wp-sig-admin.php`: `// Muat juga CSS hasil build jika ada` vs `// only load in this plugins`
- `setting-controller.php`: English docblocks mixed with Indonesian inline comments

### Inconsistent Naming Conventions

- **Controllers:** `MemberApiController`, `EventApiController`, `SettingsApiController`, `ImportApiController` — but then `EventScheduleApiController` and `PublicApiController` break the pattern
- **PHP files:** Some use `class-wp-sig-*.php` (boilerplate convention), while controllers use lowercase names like `member-controller.php`
- ~~**Permission methods:** `admin_permissions_check()` vs `permissions_check()` (singular vs plural) across different controllers~~ **FIXED** — Standardized all controllers to use `admin_permissions_check()`.
- **React files:** `countDownTimer.jsx` (camelCase) vs `QrCodeReader.jsx` (PascalCase) vs `importPage.jsx` (camelCase) — inconsistent component file naming

### ~~Inconsistent `is_outside_region` Type Handling~~ FIXED

~~Previously used loose `==` comparison and `sanitize_text_field()` for a numeric field.~~ Now consistently handled as integer: explicit `(int)` cast before strict `===` comparison in PHP services/controllers, and stored as `(int)` instead of sanitized string.

### ~~Mixed Data Fetching Patterns~~ FIXED

~~`Dashboard.jsx` used raw `fetch()` with manual state management while `QueryClientProvider` wrapped the app.~~ Dashboard now uses TanStack Query hooks from `src/hooks/use-api.js`. `RegistrationForm.jsx` still uses raw `fetch()` because it runs in the public-facing bundle (`public-form.js`) which has its own entry point outside the `QueryClientProvider`.

### Brace Style Inconsistency

PHP files mix WordPress-style (Allman braces with tabs) in boilerplate files with K&R style in controllers and services.

---

## Minor Issues

1. ~~**`wp-sig.php`** registers activation hooks twice~~ **FIXED** — Removed the redundant `activate_wp_sig()` function and its `register_activation_hook` call. DB schema creation now runs only through `sig_plugin_activate`.

2. ~~**`event-service.php:28-29`**: `find_or_create` returns `false` on invalid date~~ **FIXED** — Now returns a `WP_Error` with a descriptive message.

3. ~~**`import-service.php:38`**: `array_combine($header, $row)` warning on mismatched counts~~ **FIXED** — Added a column count check before `array_combine()`; mismatched rows are skipped with an error message.

4. ~~**`member-service.php:344`**: Dead `die(var_dump($filters))` debug statement~~ **FIXED** — Removed.

5. ~~**`RegionMap.jsx`**: Hardcoded `id="legend-gradient"` for SVG gradient~~ **FIXED** — Uses a unique `gradientIdRef` per component instance to avoid ID collisions.

6. ~~**`MemberForm.jsx:109`**: `village_id` flash/reset~~ **FIXED** — Collapsed the two-`useEffect` pattern into a single effect that sets `village_id` directly from `initialData`.

7. ~~**No loading/error boundary**~~ **FIXED** — Added `src/components/ErrorBoundary.jsx` (React class component with `getDerivedStateFromError`). Wraps the entire admin SPA inside `App.jsx` within the `QueryClientProvider`. Displays a card with the error message and a "Try Again" button.

8. ~~**`public-api-controller.php:48`**: `event_ids` set to empty string instead of array~~ **FIXED** — Now sets `$data['event_ids'] = []`.
