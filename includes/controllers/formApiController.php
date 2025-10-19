<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/MemberService.php';
require_once WP_SIG_PLUGIN_PATH . 'includes/services/EventService.php';

class GformApiController
{

    private $member_service;
    private $event_service;

    public function __construct()
    {
        $this->member_service = new MemberService();
        $this->event_service = new EventService();
    }

    public function register_routes()
    {
        register_rest_route('sig/v1', '/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_submission'],
            'permission_callback' => [$this, 'check_api_key'],
        ]);

        register_rest_route('sig/v1', '/wilayah-data', [
            'methods' => 'GET',
            'callback' => [$this, 'get_wilayah_data'],
            'permission_callback' => '__return_true', // Publik
        ]);
    }

    /**
     * Pengecekan izin berbasis API Key.
     */
    public function check_api_key(WP_REST_Request $request)
    {
        // Ambil API key yang tersimpan dari database
        $settings = get_option('sig_plugin_settings', []);
        $stored_key = $settings['api_key'] ?? null;

        // Jika tidak ada key di database, tolak
        if (empty($stored_key)) {
            return new WP_Error('rest_forbidden', 'API Key belum dikonfigurasi oleh Admin.', ['status' => 500]);
        }

        $sent_key = $request->get_header('X-API-KEY');

        // Bandingkan key yang dikirim dengan yang ada di database
        if ($sent_key === $stored_key) {
            return true;
        }

        return new WP_Error('rest_forbidden', 'API Key tidak valid.', ['status' => 401]);
    }

    /**
     * Callback untuk mengambil data wilayah (kamus data).
     */
    public function get_wilayah_data(WP_REST_Request $request)
    {
        $settings = get_option('sig_plugin_settings', []);
        $map_data = $settings['map_data'] ?? ['districts' => [], 'villages' => []];
        return new WP_REST_Response($map_data, 200);
    }

    /**
     * Callback untuk menangani data dari Google Form.
     */
    public function handle_submission(WP_REST_Request $request)
    {
        // ... (Logika lengkap akan kita bangun di langkah selanjutnya) ...
        // 1. Cek event yang aktif
        // 2. Cek apakah dalam rentang waktu
        // 3. Find/Create member
        // 4. Find/Create event
        // 5. Link member ke event dengan status 'pending'

        return new WP_REST_Response(['message' => 'Data diterima.'], 200);
    }
}
