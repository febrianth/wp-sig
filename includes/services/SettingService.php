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
        return get_option($this->option_name, []);
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

    /**
     * Handles the upload of a GeoJSON file.
     */
    public function handle_geojson_upload($file, $file_type)
    {
        if (!function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        // 1. Dapatkan pengaturan saat ini SEBELUM upload
        $current_settings = $this->get_settings();
        $old_file_url = $current_settings['map_files'][$file_type] ?? null;

        // Tambah/Hapus filter mime type (tetap sama)
        add_filter('upload_mimes', [$this, 'add_geojson_mime_type']);
        $movefile = wp_handle_upload($file, ['test_form' => false]);
        remove_filter('upload_mimes', [$this, 'add_geojson_mime_type']);

        if ($movefile && !isset($movefile['error'])) {
            // 2. JIKA upload file baru BERHASIL, HAPUS file lama
            if ($old_file_url) {
                // Ubah URL file lama menjadi path server absolut
                $old_file_path = str_replace(content_url(), WP_CONTENT_DIR, $old_file_url);
                if (file_exists($old_file_path)) {
                    @unlink($old_file_path); // Hapus file lama dari server
                }
            }

            // 3. Simpan URL file yang baru
            $current_settings['map_files'][$file_type] = $movefile['url'];
            $this->save_settings($current_settings);

            return ['success' => true, 'url' => $movefile['url']];
        } else {
            $error = isset($movefile['error']) ? $movefile['error'] : 'Unknown upload error.';

            return [
                'success' => false,
                'error'   => $error
            ];
        }
    }

    public function save_map_settings($file_urls, $key_mappings)
    {
        // Dapatkan pengaturan yang sudah ada
        $settings = $this->get_settings();

        // Simpan path ke KEDUA file peta
        $settings['map_files']['districts'] = esc_url_raw($file_urls['districts'] ?? '');
        $settings['map_files']['villages'] = esc_url_raw($file_urls['villages'] ?? '');

        // Simpan pemetaan properti
        $settings['map_keys'] = $key_mappings;

        // Simpan semua pengaturan yang sudah diperbarui ke database
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
        return $settings;
    }
}
