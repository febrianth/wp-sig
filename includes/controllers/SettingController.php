<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/SettingService.php';

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
    }

    /**
     * Callback untuk mengambil pengaturan.
     */
    public function get_settings(WP_REST_Request $request)
    {
        $settings = $this->settings_service->get_settings();
        return new WP_REST_Response($settings, 200);
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
        $files = $request->get_file_params();
        $file_type = $request->get_param('file_type'); // Mengambil file_type dari FormData

        if (empty($files['geojson_file']) || empty($file_type)) {
            return new WP_REST_Response(['error' => 'File atau tipe file tidak ditemukan.'], 400);
        }

        // Panggil service dengan file dan tipe file
        $result = $this->settings_service->handle_geojson_upload($files['geojson_file'], $file_type);

        if ($result['success']) {
            return new WP_REST_Response(['url' => $result['url']], 200);
        } else {
            return new WP_REST_Response(['error' => $result['error']], 500);
        }
    }

    /**
     * Callback untuk menyimpan pengaturan peta (path file & keys).
     */
    public function handle_process_maps(WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        $file_urls = $params['map_files'] ?? [];
        $key_mappings = $params['map_keys'] ?? [];

        if (empty($file_urls['districts']) || empty($file_urls['villages'])) {
            return new WP_REST_Response(['error' => 'URL file Peta Kecamatan dan Desa wajib ada.'], 400);
        }

        $result = $this->settings_service->process_uploaded_maps($file_urls, $key_mappings);

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
