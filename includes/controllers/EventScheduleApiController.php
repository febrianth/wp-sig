<?php
// Pastikan path ke service Anda benar
require_once WP_SIG_PLUGIN_PATH . 'includes/services/EventService.php';

class EventScheduleApiController {

    private $event_service;

    public function __construct() {
        $this->event_service = new EventService();
    }

    public function register_routes() {
        // Endpoint untuk MENGAMBIL data event aktif & member pending
        register_rest_route('sig/v1', '/event-schedule', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_active_event_details'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        // Endpoint untuk MENYIMPAN/MEMPERBARUI event aktif
        register_rest_route('sig/v1', '/event-schedule', [
            'methods'             => 'POST',
            'callback'            => [$this, 'save_active_event'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        // Endpoint untuk MENYELESAIKAN event
        register_rest_route('sig/v1', '/event-schedule/finish', [
            'methods'             => 'POST',
            'callback'            => [$this, 'finish_active_event'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig/v1', '/events/history', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_history'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        // --- RUTE BARU UNTUK REJECT/PENDING MEMBER ---
        register_rest_route('sig/v1', '/member-event/status', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_member_status_update'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);
    }

    public function handle_member_status_update(WP_REST_Request $request) {
        $params = $request->get_json_params();
        $member_event_id = $params['member_event_id'] ?? null;
        $status = $params['status'] ?? null;

        if (!$member_event_id || !$status) {
            return new WP_Error('missing_params', 'ID pendaftaran atau status tidak ada.', ['status' => 400]);
        }
        
        $result = $this->event_service->update_member_event_status($member_event_id, $status);

        if (is_wp_error($result)) {
            return $result;
        }

        // Kembalikan data event terbaru agar UI bisa sinkron
        $new_data = $this->event_service->get_active_api_form_details();
        return new WP_REST_Response($new_data, 200);
    }

    public function get_active_event_details(WP_REST_Request $request) {
        $data = $this->event_service->get_active_api_form_details();
        return new WP_REST_Response($data, 200);
    }

    public function get_history(WP_REST_Request $request) {
        $data = $this->event_service->get_recent_completed_events();
        return new WP_REST_Response($data, 200);
    }

    public function save_active_event(WP_REST_Request $request) {
        $params = $request->get_json_params();

        // Ambil data dari frontend
        $event_data = [
            'id'         => $params['id'] ?? null, // Frontend HARUS mengirimkan 'id' jika sedang mengedit
            'event_name' => $params['event_name'] ?? null,
            'started_at' => $params['started_at'] ?? null,
            'end_at'     => $params['end_at'] ?? null
        ];

        if (empty($event_data['event_name']) || empty($event_data['started_at']) || empty($event_data['end_at'])) {
            return new WP_Error('missing_params', 'Nama, Tanggal Mulai, dan Tanggal Selesai wajib diisi.', ['status' => 400]);
        }
        
        $result = $this->event_service->save_active_api_form_event($event_data);

        // Jika service mengembalikan error (misal, validasi gagal)
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Ambil data terbaru (termasuk member pending) untuk dikirim kembali ke frontend
        $new_data = $this->event_service->get_active_api_form_details();
        
        // Tambahkan status 'created' atau 'updated' ke respons
        $new_data['action_status'] = $result['status']; 
        
        return new WP_REST_Response($new_data, 200);
    }

    public function finish_active_event(WP_REST_Request $request) {
        $result = $this->event_service->finish_active_event();
        if (is_wp_error($result)) {
            return $result;
        }
        return new WP_REST_Response(['message' => 'Event berhasil diselesaikan.'], 200);
    }

    public function admin_permissions_check() {
        return current_user_can('manage_options');
    }
}