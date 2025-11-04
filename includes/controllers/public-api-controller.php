<?php
// includes/controllers/PublicApiController.php

require_once WP_SIG_PLUGIN_PATH . 'includes/services/member-service.php';

class PublicApiController {
    private $member_service;

    public function __construct() {
        $this->member_service = new MemberService();
    }

    public function register_routes() {
        register_rest_route('sig/v1', '/public-register', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_registration'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('sig/v1', '/wilayah-data', [
            'methods' => 'GET',
            'callback' => [$this, 'get_wilayah_data'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function get_wilayah_data(WP_REST_Request $request) {
        $settings = get_option('sig_plugin_settings', []);
        $map_data = $settings['map_data'] ?? ['districts' => [], 'villages' => []];
        return new WP_REST_Response($map_data, 200);
    }

    public function handle_registration(WP_REST_Request $request) {
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('rest_forbidden', 'Nonce tidak valid.', ['status' => 401]);
        }
        
        $data = $request->get_json_params();
        $data['status'] = 'pending'; // Pendaftaran publik selalu 'pending'

        $result = $this->member_service->create($data);

        if (is_wp_error($result)) {
            $status = $result->get_error_data()['status'] ?? 400;
            return new WP_REST_Response(['message' => $result->get_error_message()], $status);
        }

        return new WP_REST_Response(['message' => 'Registrasi berhasil!', 'member_id' => $result], 201);
    }
}