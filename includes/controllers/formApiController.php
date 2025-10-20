<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/MemberService.php';
require_once WP_SIG_PLUGIN_PATH . 'includes/services/EventService.php';

class formApiController
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
            'permission_callback' => [$this, 'check_api_key_permission'],
        ]);

        // Endpoint publik untuk mengambil kamus data wilayah
        register_rest_route('sig/v1', '/wilayah-data', [
            'methods' => 'GET',
            'callback' => [$this, 'get_wilayah_data'],
            'permission_callback' => '__return_true', // Terbuka untuk publik
        ]);
    }

    /**
     * Pengecekan izin berbasis API Key.
     */
    public function check_api_key_permission(WP_REST_Request $request)
    {
        $settings = get_option('sig_plugin_settings', []);
        $stored_key = $settings['api_key'] ?? null;

        if (empty($stored_key)) {
            return new WP_Error('rest_forbidden', 'API Key belum dikonfigurasi oleh Admin.', ['status' => 500]);
        }

        $sent_key = $request->get_header('X-API-KEY');

        if (hash_equals($stored_key, $sent_key)) { // Gunakan hash_equals untuk perbandingan yang aman
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
     * Alur: Cek Event -> Cek Waktu -> Cari/Buat Member -> Hubungkan ke Event
     */
    public function handle_submission(WP_REST_Request $request)
    {
        // 1. Cek event yang aktif
        // Kita panggil service untuk melihat apakah ada event yang ditandai 'status'
        $active_event = $this->event_service->get_active_api_form_details();

        if (!$active_event) {
            return new WP_Error(
                'no_active_event',
                'Pendaftaran ditutup. Tidak ada event yang sedang dibuka.',
                ['status' => 403] // 403 Forbidden
            );
        }

        // 2. Cek apakah dalam rentang waktu
        $site_timezone = wp_timezone();

        // 2. Buat semua objek waktu menggunakan zona waktu yang SAMA
        $now = new DateTimeImmutable('now', $site_timezone);
        $start_datetime = new DateTimeImmutable($active_event['started_at'], $site_timezone);
        $end_datetime   = new DateTimeImmutable($active_event['end_at'], $site_timezone);

        $localized_format = 'l, j F Y \P\u\k\u\l H:i';

        // 3. Cek jika event belum dimulai (TOO EARLY)
        if ($now < $start_datetime) {
            $formatted_start = wp_date($localized_format, $start_datetime->getTimestamp());

            return new WP_Error(
                'event_not_started',
                'Pendaftaran untuk ' . $active_event['event_name'] . ' belum dibuka. Dibuka pada: ' . $formatted_start,
                ['status' => 403]
            );
        }

        // 4. Cek jika event sudah berakhir (TOO LATE)
        if ($now > $end_datetime) {
            $formatted_end = wp_date($localized_format, $end_datetime->getTimestamp());

            return new WP_Error(
                'event_ended',
                'Pendaftaran untuk ' . $active_event['event_name'] . ' sudah ditutup. Berakhir pada: ' . $formatted_end,
                ['status' => 403]
            );
        }
        // 3. Find/Create member
        $data = $request->get_json_params();

        // Ambil data wajib
        $member_name = $data['name'] ?? null;
        $phone_number = $data['phone_number'] ?? null;
        $district_id = $data['district_id'] ?? null;
        $village_id = $data['village_id'] ?? null;
        // die(var_dump($data));

        if (empty($member_name) || empty($phone_number || empty($district_id) || empty($village_id))) {
            return new WP_Error(
                'missing_data',
                'Data tidak lengkap. semua wajib diisi.',
                ['status' => 400] // 400 Bad Request
            );
        }

        // Siapkan data tambahan (opsional)
        $member_details = [
            'full_address' => $data['full_address'] ?? '-',
            'district_id'  => $district_id,
            'village_id'   => $village_id
        ];

        // Panggil service untuk mencari atau membuat member
        $member_id = $this->member_service->find_or_create($member_name, $phone_number, $member_details);

        if (!$member_id || is_wp_error($member_id)) {
            return new WP_Error(
                'member_create_failed',
                'Gagal memproses data member.',
                ['status' => 500]
            );
        }

        // 4. Dapatkan ID Event (sudah kita dapatkan dari langkah 1)
        $event_id = $active_event['id'];

        // 5. Link member ke event dengan status 'pending'
        // Kita panggil service yang sudah kita buat
        $result = $this->member_service->add_event_to_member($member_id, $event_id, 'pending');

        if (!$result || is_wp_error($result)) {
            return new WP_Error(
                'link_failed',
                'Gagal mendaftarkan member ke event. Mungkin sudah terdaftar.',
                ['status' => 500]
            );
        }

        // Jika semua berhasil
        return new WP_REST_Response(['message' => 'Pendaftaran berhasil. Data Anda akan diverifikasi oleh admin.'], 201); // 201 Created
    }
}
