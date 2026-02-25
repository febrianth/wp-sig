# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WP-SIG (Sistem Informasi Geografis) is a WordPress plugin for geographic information system member management. It manages members, events, event attendance, and geographic region data (districts/villages) with GeoJSON map visualization. The admin UI is a React SPA embedded in the WordPress admin panel; a separate public-facing React app provides member registration via a WordPress shortcode.

## Build Commands

```bash
npm run start     # Development mode with hot reload (wp-scripts start)
npm run build     # Production build (wp-scripts build)
composer install  # Install PHP dependencies (Carbon Fields, PhpSpreadsheet)
```

Build output goes to `build/` and is gitignored. Two webpack entry points produce `build/index.js` (admin SPA) and `build/public-form.js` (public registration form).

## Architecture

### Two-Layer Hybrid: PHP Backend + React Frontend

**PHP side** follows the WordPress Plugin Boilerplate pattern:
- `wp-sig.php` — Bootstrap file. Defines constants (`WP_SIG_PLUGIN_URL`, `WP_SIG_PLUGIN_PATH`), runs DB schema on activation via `dbDelta()`, loads Composer autoloader
- `includes/class-wp-sig.php` — Core orchestrator. Uses `Wp_Sig_Loader` to register all WordPress hooks. Instantiates all API controllers in `define_admin_hooks()` and `define_public_hooks()`
- `includes/controllers/` — REST API controllers registered under the `sig/v1` namespace. Each controller instantiates its service
- `includes/services/` — Business logic layer using `$wpdb` directly (no ORM). Services use `$wpdb->prefix . 'sig_*'` table names
- `admin/class-wp-sig-admin.php` — Enqueues the React SPA bundle on the `toplevel_page_sig_plugin_main` admin page. Passes `sig_plugin_data` (api_url, nonce, WP_SIG_PLUGIN_URL) to JS via `wp_localize_script`
- `public/class-wp-sig-public.php` — Enqueues the public form bundle when `[sig_registration_form]` shortcode is detected. Passes `sig_public_data` (api_url, nonce) to JS

**React side** (JSX, no TypeScript):
- `src/index.jsx` — Admin SPA entry. Mounts to `#sig-app-root` with HashRouter + QueryClientProvider
- `src/public-form.jsx` — Public form entry. Mounts to `#sig-public-form-root`
- `src/App.jsx` — Routes: `/` (Home), `/dashboard`, `/make-event`, `/absensi`, `/settings`, `/settings/import`, `/member/:memberId`
- `src/components/ui/` — shadcn/ui components (JSX variant, not TSX). Configured via `components.json` with `@` alias pointing to `src/`
- `src/pages/` — Page-level components
- `src/components/` — Feature components (MemberForm, RegionMap, DataTable, QrCodeReader, etc.)

### REST API Endpoints (namespace: `sig/v1`)

| Controller | Resource |
|---|---|
| `MemberApiController` | `/members`, `/members/{id}`, `/members/summary`, `/analysis/events`, `/analysis/badges` |
| `EventApiController` | Events CRUD |
| `EventScheduleApiController` | Event scheduling |
| `SettingsApiController` | Plugin settings |
| `ImportApiController` | Excel import |
| `PublicApiController` | Public registration (no auth required) |

Admin endpoints require `manage_options` capability. The frontend reads API base URL and nonce from the `sig_plugin_data` / `sig_public_data` global objects.

### Database Schema (`database/schema.sql`)

Four custom tables using `%%PREFIX%%` placeholder (replaced with `$wpdb->prefix` at activation):
- `sig_members` — name, phone_number (unique), district_id, village_id, is_outside_region, status (verified/pending/rejected). Soft deletes via `deleted_at`
- `sig_events` — event_name (unique), status, started_at, end_at. Soft deletes
- `sig_member_events` — Pivot table linking members to events with status. Soft deletes
- `sig_geojson_datasets` — Stores GeoJSON data for districts and villages (type enum)

### Key Patterns

- **Soft deletes**: All main tables use `deleted_at IS NULL` checks. Service queries always filter by `deleted_at IS NULL`
- **Phone number sanitization**: Phone numbers are sanitized and used as unique identifiers for members
- **Event sync**: `MemberService::sync_events()` soft-deletes all existing member-event links then re-inserts — full replacement, not differential
- **Settings storage**: Uses `get_option('sig_plugin_settings')` for plugin config including badge thresholds (gold/silver/bronze) and map data
- **Data fetching**: React side uses TanStack Query (`@tanstack/react-query`) for server state. Forms use `react-hook-form` with `zod` validation
- **Styling**: Tailwind CSS 3 with `important: true` and CSS custom properties for theming. The `@` import alias resolves to `src/`
- **Routing**: Admin SPA uses `HashRouter` (hash-based routing within the WP admin page)

### Composer Dependencies

- `htmlburger/carbon-fields` — WordPress custom fields framework
- `phpoffice/phpspreadsheet` — Excel file reading for member import

## Development Environment

Runs on XAMPP (Windows). WordPress installation at `C:\xampp25\htdocs\wordpress\`. The plugin activates from WP Admin > Plugins and creates its DB tables via `dbDelta()`. The admin menu item appears as "SIG Plugin" with a location icon.
