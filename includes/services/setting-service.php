<?php

/**
 * Handles data operations for plugin settings.
 */
class SettingsService
{

    /**
     * Nama key di tabel wp_options.
     * @var string
     */
    private $option_name = 'sig_plugin_settings';
    private $table_geojson;

    public function __construct()
    {
        global $wpdb;
        $this->table_geojson = $wpdb->prefix . 'sig_geojson_datasets';
    }

    /**
     * Mengambil semua pengaturan plugin dari database.
     *
     * @return array Pengaturan yang tersimpan, atau array kosong.
     */
    public function get_settings()
    {
        $defaults = [
            'map_files' => [],
            'map_keys' => [],
            'map_data' => [],
            'registration_flow_mode' => 'qr_once',
            'badge_thresholds' => [
                'gold'      => 3,
                'silver'    => 2,
                'bronze'    => 1
            ]
        ];

        $settings = get_option($this->option_name, []);
        return wp_parse_args($settings, $defaults);
    }

    /**
     * Menyimpan data pengaturan ke database.
     *
     * @param array $settings Data pengaturan untuk disimpan.
     * @return bool True jika berhasil, false jika gagal.
     */
    public function save_settings($settings)
    {
        $sanitized_settings = $this->sanitize_settings_data($settings);
        return update_option($this->option_name, $sanitized_settings);
    }

    public function process_uploaded_maps($file_urls, $key_mappings, $badge_thresholds, $registration_flow_mode)
    {
        $settings = $this->get_settings();

        $districts = [];
        $villages = [];

        // --- PROSES GEOJSON KECAMATAN ---
        $districts_api_url = $file_urls['districts'] ?? '';
        if (!empty($districts_api_url)) {
            $response = wp_remote_get($districts_api_url);

            if (is_wp_error($response)) {
                return new WP_Error('api_error', 'Gagal mengakses REST API Kecamatan.', ['status' => 400]);
            }

            $body = wp_remote_retrieve_body($response);
            $geojson = json_decode($body, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($geojson['features'])) {
                $id_key = $key_mappings['district_id'] ?? '';
                $name_key = $key_mappings['district_name'] ?? '';

                if ($id_key && $name_key) {
                    foreach ($geojson['features'] as $feature) {
                        $id = $feature['properties'][$id_key] ?? null;
                        $name = $feature['properties'][$name_key] ?? 'N/A';
                        if ($id && !isset($districts[$id])) {
                            $districts[$id] = $name;
                        }
                    }
                }
            } else {
                return new WP_Error('invalid_json', 'Format GeoJSON Kecamatan tidak valid.', ['status' => 400]);
            }
        }

        // --- PROSES GEOJSON DESA ---
        $villages_api_url = $file_urls['villages'] ?? '';
        if (!empty($villages_api_url)) {
            $response = wp_remote_get($villages_api_url);

            if (is_wp_error($response)) {
                return new WP_Error('api_error', 'Gagal mengakses REST API Desa.', ['status' => 400]);
            }

            $body = wp_remote_retrieve_body($response);
            $geojson = json_decode($body, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($geojson['features'])) {
                $id_key = $key_mappings['village_id'] ?? '';
                $name_key = $key_mappings['village_name'] ?? '';
                $parent_district_key = $key_mappings['village_parent_district_id'] ?? '';

                if ($id_key && $name_key) {
                    foreach ($geojson['features'] as $feature) {
                        $id = $feature['properties'][$id_key] ?? null;
                        $name = $feature['properties'][$name_key] ?? 'N/A';
                        $parent_district = $feature['properties'][$parent_district_key] ?? 'N/A';

                        if ($id && !isset($villages[$id])) {
                            $villages["$parent_district.$id"] = [
                                'name' => $name,
                                'parent_district' => $parent_district
                            ];
                        }
                    }
                }
            } else {
                return new WP_Error('invalid_json', 'Format GeoJSON Desa tidak valid.', ['status' => 400]);
            }
        }

        // --- Simpan semua hasil ke settings ---
        $settings['map_files'] = $file_urls;
        $settings['badge_thresholds'] = $badge_thresholds;
        $settings['registration_flow_mode'] = $registration_flow_mode;
        $settings['map_keys'] = $key_mappings;
        $settings['map_data']['districts'] = $districts;
        $settings['map_data']['villages'] = $villages;

        return $this->save_settings($settings);
    }


    /**
     * Membersihkan data sebelum disimpan.
     */
    private function sanitize_settings_data($settings)
    {
        if (isset($settings['badge_thresholds'])) {
            $settings['badge_thresholds']['gold']   = absint($settings['badge_thresholds']['gold'] ?? 3);
            $settings['badge_thresholds']['silver'] = absint($settings['badge_thresholds']['silver'] ?? 2);
            $settings['badge_thresholds']['bronze'] = absint($settings['badge_thresholds']['bronze'] ?? 1);
        }
        if (isset($settings['registration_flow_mode'])) {
            $settings['registration_flow_mode'] = sanitize_text_field($settings['registration_flow_mode']);

            $allowed_modes = ['qr_once', 'manual_or_repeat'];
            $settings['registration_flow_mode'] = in_array($settings['registration_flow_mode'], $allowed_modes) ? $settings['registration_flow_mode'] : 'qr_once';
        }

        return $settings;
    }

    private function generate_api_key()
    {
        // wp_generate_password adalah fungsi WordPress yang aman secara kriptografis
        return 'sig_key_' . wp_generate_password(40, false, false);
    }

    public function regenerate_api_key()
    {
        $settings = $this->get_settings(); // Ambil semua pengaturan yang ada
        $new_key = $this->generate_api_key();
        $settings['api_key'] = $new_key;
        $this->save_settings($settings);
        return $new_key; // Kembalikan key yang baru saja dibuat
    }

    public function store_geojson($type, $file, $user_id = null)
    {
        global $wpdb;

        $json_content = file_get_contents($file['tmp_name']);
        if (empty($json_content)) {
            return new WP_Error('empty_file', 'File GeoJSON kosong atau gagal dibaca.');
        }

        // Validate that the content is valid JSON with expected GeoJSON structure
        $decoded = json_decode($json_content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('invalid_json', 'File bukan JSON yang valid: ' . json_last_error_msg());
        }
        if (!isset($decoded['type']) || !isset($decoded['features']) || !is_array($decoded['features'])) {
            return new WP_Error('invalid_geojson', 'File bukan format GeoJSON yang valid (harus memiliki "type" dan "features").');
        }

        // Hapus data lama untuk tipe yang sama
        $wpdb->delete($this->table_geojson, ['type' => $type]);

        // Simpan ke database
        $wpdb->insert($this->table_geojson, [
            'type' => $type,
            'name' => ucfirst($type) . ' Data (' . current_time('mysql') . ')',
            'geojson' => $json_content,
            'uploaded_by' => $user_id,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]);

        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Gagal menyimpan ke database: ' . $wpdb->last_error);
        }

        return true;
    }

    public function handle_save_geojson_settings($file_type, $newurl)
    {
        $current_settings = $this->get_settings();

        $current_settings['map_files'][$file_type] = $newurl;
        $this->save_settings($current_settings);
    }

    public function get_geojson($type)
    {
        global $wpdb;
        $data = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_geojson} WHERE type = %s", $type));
        return $data ? $data->geojson : '{}';
    }
}
