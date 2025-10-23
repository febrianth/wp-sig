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
            'badge_thresholds' => [
                'gold'      => 3,
                'silver'    => 2,
                'bronze'    => 1
            ]
        ];

        $settings = get_option($this->option_name, []);
        $settings = wp_parse_args($settings, $defaults);

        $settings = get_option($this->option_name, []);
        if (empty($settings['api_key'])) {
            $settings['api_key'] = $this->generate_api_key();
            $this->save_settings($settings);
        }

        return $settings;
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

    private $upload_context = ['is_active' => false, 'subdir' => ''];

    /**
     * Handles the upload of a GeoJSON file.
     */
    public function handle_geojson_upload($file, $file_type)
    {
        if (!function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $current_settings = $this->get_settings();
        if (!is_array($current_settings)) $current_settings = [];
        $old_file_url = $current_settings['map_files'][$file_type] ?? null;

        // 1. Atur konteks upload
        $this->upload_context['is_active'] = true;
        $this->upload_context['subdir'] = sanitize_key($file_type); // misal: 'villages' atau 'districts'

        add_filter('upload_dir', [$this, 'custom_geojson_upload_dir']);
        add_filter('upload_mimes', [$this, 'add_geojson_mime_type']);

        $movefile = wp_handle_upload($file, ['test_form' => false]);

        remove_filter('upload_dir', [$this, 'custom_geojson_upload_dir']);
        remove_filter('upload_mimes', [$this, 'add_geojson_mime_type']);

        // Reset konteks
        $this->upload_context = ['is_active' => false, 'subdir' => ''];

        if ($movefile && !isset($movefile['error'])) {
            // Hapus file lama JIKA upload yang baru berhasil
            if ($old_file_url) {
                $old_file_path = str_replace(content_url(), WP_CONTENT_DIR, $old_file_url);
                if (file_exists($old_file_path)) {
                    @unlink($old_file_path);
                }
            }

            // Simpan URL file yang baru
            if (!isset($current_settings['map_files']) || !is_array($current_settings['map_files'])) {
                $current_settings['map_files'] = [];
            }
            $current_settings['map_files'][$file_type] = $movefile['url'];
            $this->save_settings($current_settings);

            return ['success' => true, 'url' => $movefile['url']];
        } else {
            return ['success' => false, 'error' => $movefile['error'] ?? 'Unknown upload error.'];
        }
    }

    /**
     * Mengubah direktori upload ke subfolder khusus (villages/districts).
     */
    public function custom_geojson_upload_dir($dirs)
    {
        if (!$this->upload_context['is_active']) {
            return $dirs;
        }

        $custom_subdir = 'sig-maps/' . $this->upload_context['subdir'];

        $dirs['subdir'] = $custom_subdir;
        $dirs['path'] = $dirs['basedir'] . '/' . $custom_subdir;
        $dirs['url'] = $dirs['baseurl'] . '/' . $custom_subdir;

        return $dirs;
    }

    public function process_uploaded_maps($file_urls, $key_mappings, $badge_thresholds)
    {
        $settings = $this->get_settings();

        $districts = [];
        $villages = [];

        // --- PROSES FILE KECAMATAN ---
        $districts_file_url = $file_urls['districts'] ?? '';
        if (!empty($districts_file_url)) {
            $districts_file_path = str_replace(content_url(), WP_CONTENT_DIR, $districts_file_url);

            if (file_exists($districts_file_path)) {
                $geojson_string = file_get_contents($districts_file_path);
                $geojson = json_decode($geojson_string, true);

                if (json_last_error() === JSON_ERROR_NONE) {
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
                }
            } else {
                return new WP_Error('file_not_found', 'File Kecamatan tidak ditemukan di server.', ['status' => 400]);
            }
        }

        // --- PROSES FILE DESA ---
        $villages_file_url = $file_urls['villages'] ?? '';
        if (!empty($villages_file_url)) {
            $villages_file_path = str_replace(content_url(), WP_CONTENT_DIR, $villages_file_url);

            if (file_exists($villages_file_path)) {
                $geojson_string = file_get_contents($villages_file_path);
                $geojson = json_decode($geojson_string, true);

                if (json_last_error() === JSON_ERROR_NONE) {
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
                }
            } else {
                return new WP_Error('file_not_found', 'File Desa tidak ditemukan di server.', ['status' => 400]);
            }
        }

        // Simpan semua data yang sudah diproses dan di-mapping
        $settings['map_files'] = $file_urls;
        $settings['badge_thresholds'] = $badge_thresholds;
        $settings['map_keys'] = $key_mappings;
        $settings['map_data']['districts'] = $districts;
        $settings['map_data']['villages'] = $villages;

        return $this->save_settings($settings);
    }

    /**
     * Adds .geojson to the list of allowed mime types.
     * This is the callback for the 'upload_mimes' filter.
     */
    public function add_geojson_mime_type($mimes)
    {
        // Allow .geojson files, mapping them to a safe 'application/json' mime type
        $mimes['geojson'] = 'text/plain';
        return $mimes;
    }

    /**
     * Membersihkan data sebelum disimpan.
     */
    private function sanitize_settings_data($settings)
    {
        if (isset($settings['default_view']['level'])) {
            $settings['default_view']['level'] = sanitize_text_field($settings['default_view']['level']);
        }
        if (isset($settings['default_view']['code'])) {
            $settings['default_view']['code'] = sanitize_text_field($settings['default_view']['code']);
        }

        if (isset($settings['badge_thresholds'])) {
            $settings['badge_thresholds']['gold']   = absint($settings['badge_thresholds']['gold'] ?? 3);
            $settings['badge_thresholds']['silver'] = absint($settings['badge_thresholds']['silver'] ?? 2);
            $settings['badge_thresholds']['bronze'] = absint($settings['badge_thresholds']['bronze'] ?? 1);
        }
        
        return $settings;
    }

    private function generate_api_key() {
        // wp_generate_password adalah fungsi WordPress yang aman secara kriptografis
        return 'sig_key_' . wp_generate_password(40, false, false);
    }

    public function regenerate_api_key() {
        $settings = $this->get_settings(); // Ambil semua pengaturan yang ada
        $new_key = $this->generate_api_key();
        $settings['api_key'] = $new_key;
        $this->save_settings($settings);
        return $new_key; // Kembalikan key yang baru saja dibuat
    }
}
