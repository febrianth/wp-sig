<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/setting-service.php';

/**
 * Handles all REST API endpoints related to settings.
 */
class SettingsApiController
{

    private $settings_service;

    public function __construct()
    {
        $this->settings_service = new SettingsService();
    }

    /**
     * Mendaftarkan semua rute API untuk pengaturan.
     */
    public function register_routes()
    {
        register_rest_route('sig/v1', '/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_settings'],
                'permission_callback' => [$this, 'admin_permissions_check'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'save_settings'],
                'permission_callback' => [$this, 'admin_permissions_check'],
            ],
        ]);

        register_rest_route('sig/v1', '/upload-geojson', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_upload'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig/v1', '/process-geojson', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_process_maps'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig-maps/v1', '/geojson/(?P<type>[a-zA-Z0-9_-]+)', [
            'methods'               => 'GET',
            'callback'              => [$this, 'get_geojson'],
            'permission_callback'   => '__return_true'
        ]);

        register_rest_route('sig/v1', '/settings/regenerate-api-key', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_regenerate_key'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);
    }

    /**
     * Callback untuk mengambil pengaturan.
     */
    public function get_settings(WP_REST_Request $request)
    {
        $settings = $this->settings_service->get_settings();
        return new WP_REST_Response($settings, 200);
    }

    public function handle_regenerate_key(WP_REST_Request $request)
    {
        $new_key = $this->settings_service->regenerate_api_key();
        if ($new_key) {
            return new WP_REST_Response(['api_key' => $new_key], 200);
        } else {
            return new WP_REST_Response(['error' => 'Gagal membuat API key baru.'], 500);
        }
    }

    /**
     * Callback untuk menyimpan pengaturan.
     */
    public function save_settings(WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        $success = $this->settings_service->save_settings($params);

        if ($success) {
            return new WP_REST_Response(['message' => 'Settings saved successfully.'], 200);
        } else {
            return new WP_REST_Response(['message' => 'Failed to save settings.'], 500);
        }
    }

    public function handle_upload(WP_REST_Request $request)
    {
        $file = $_FILES['geojson_file'] ?? null;
        $type = sanitize_text_field($request->get_param('file_type'));

        if (!$file || empty($file['tmp_name'])) {
            return new WP_REST_Response(['error' => 'File tidak ditemukan.'], 400);
        }

        if (!in_array($type, ['districts', 'villages'])) {
            return new WP_REST_Response(['error' => 'Tipe file tidak valid.'], 400);
        }

        $type_key = $type === 'districts' ? 'district' : 'village';
        $result = $this->settings_service->store_geojson($type_key, $file, get_current_user_id());

        if (is_wp_error($result)) {
            return new WP_REST_Response(['error' => $result->get_error_message()], 500);
        }

        $url = rest_url('sig-maps/v1/geojson/' . $type_key);
        $this->settings_service->handle_save_geojson_settings($type, $url);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'GeoJSON berhasil disimpan ke database.',
            'url' => $url
        ]);
    }

    public function get_geojson(WP_REST_Request $request)
    {
        $type = sanitize_text_field($request['type']);
        $geojson = $this->settings_service->get_geojson($type);

        if (empty($geojson) || $geojson === '{}') {
            return new WP_REST_Response(['error' => 'Data not found'], 404);
        }

        // Cek apakah client mendukung gzip
        $accept_encoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        $supports_gzip = stripos($accept_encoding, 'gzip') !== false;

        // Jangan kirim pakai WP_REST_Response, kirim mentah
        if ($supports_gzip) {
            $compressed = gzencode($geojson, 6);

            header('Content-Type: application/json');
            header('Content-Encoding: gzip');
            header('Vary: Accept-Encoding');
            header('Content-Length: ' . strlen($compressed));

            echo $compressed;
            exit;
        }

        // fallback: kirim JSON biasa
        header('Content-Type: application/json');
        echo $geojson;
        exit;
    }

    /**
     * Callback untuk menyimpan pengaturan peta (path file & keys). 
     */
    public function handle_process_maps(WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        $file_urls = $params['map_files'] ?? [];
        $key_mappings = $params['map_keys'] ?? [];
        $badge_thresholds = $params['badge_thresholds'] ?? [];

        if (empty($file_urls['districts']) || empty($file_urls['villages'])) {
            return new WP_REST_Response(['error' => 'URL file Peta Kecamatan dan Desa wajib ada.'], 400);
        }

        $result = $this->settings_service->process_uploaded_maps($file_urls, $key_mappings, $badge_thresholds);

        if (is_wp_error($result)) {
            return new WP_REST_Response(['error' => $result->get_error_message()], 400);
        }

        $new_settings = $this->settings_service->get_settings();
        return new WP_REST_Response($new_settings, 200);
    }

    /**
     * Only Admin.
     * @return bool
     */
    public function admin_permissions_check()
    {
        return current_user_can('manage_options');
    }

    /**
     * Logged in Users.
     * @return bool
     */
    public function logged_in_permissions_check()
    {
        return is_user_logged_in();
    }

    /**
     * Public.
     * @return bool
     */
    public function public_permissions_check()
    {
        return true;
    }
}
