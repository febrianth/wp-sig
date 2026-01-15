<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/member-service.php';

class MemberApiController
{

    private $member_service;

    public function __construct()
    {
        $this->member_service = new MemberService();
    }

    public function register_routes()
    {
        register_rest_route('sig/v1', '/members', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_members'),
            'permission_callback' => array($this, 'admin_permissions_check'),
        ));

        // Rute POST (untuk Create)
        register_rest_route('sig/v1', '/members', [
            'methods' => 'POST',
            'callback' => [$this, 'create_member'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig/v1', '/members/summary', [
            'methods'  => 'GET',
            'callback' => [$this, 'handle_get_member_summary'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig/v1', '/analysis/events', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_analysis_events'],
            // 'permission_callback' => [$this, 'admin_permissions_check'],
        ]);

        register_rest_route('sig/v1', '/analysis/badges', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_analysis_badges'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);


        // Rute untuk satu member (Update & Delete)
        register_rest_route('sig/v1', '/members/(?P<id>\\d+)', [
            [
                'methods' => 'PUT', // atau PATCH
                'callback' => [$this, 'update_member'],
                'permission_callback' => [$this, 'admin_permissions_check'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_member'],
                'permission_callback' => [$this, 'admin_permissions_check'],
            ],
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_member_detail'],
                'permission_callback' => [$this, 'admin_permissions_check'],
            ],
        ]);
    }

    public function handle_get_member_summary(WP_REST_Request $request)
    {
        $eventId = $request->get_param('event_id');
        $eventId = is_numeric($eventId) ? (int) $eventId : null;

        $data = $this->member_service->get_member_summary($eventId);

        return new WP_REST_Response($data, 200);
    }

    /**
     * @return WP_REST_Response
     */
    public function get_members(WP_REST_Request $request)
    {
        $result = $this->member_service->get_paginated_members([
            'page' => $request->get_param('page'),
            'per_page' => $request->get_param('per_page'),
            'event_id' => $request->get_param('event_id'),
            'district_id' => $request->get_param('district_id'),
            'village_id' => $request->get_param('village_id'),
        ]);

        return new WP_REST_Response($result, 200);
    }

    public function get_member_detail(WP_REST_Request $request)
    {
        $id = $request->get_param('id');
        $data = $this->member_service->get_member_details($id);

        if (empty($data)) {
            return new WP_Error('not_found', 'Member tidak ditemukan.', ['status' => 404]);
        }

        $settings = get_option('sig_plugin_settings', []);
        $data['map_data'] = $settings['map_data'] ?? [];

        return new WP_REST_Response($data, 200);
    }

    /**
     * Callback untuk membuat member baru.
     */
    public function create_member(WP_REST_Request $request)
    {
        $data = $request->get_json_params();

        // Admin yang membuat member baru langsung 'verified'
        $data['status'] = 'verified';

        $result = $this->member_service->create($data);
        if (is_wp_error($result)) {
            return new WP_REST_Response(
                ['message' => $result->get_error_message()],
                $result->get_error_data()['status'] ?? 400
            );
        }

        return new WP_REST_Response(
            ['message' => 'Member berhasil dibuat', 'id' => $result],
            201
        );
    }

    /**
     * Callback untuk mengupdate member.
     */
    public function update_member(WP_REST_Request $request)
    {
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        $result = $this->member_service->update($id, $data);
        if (is_wp_error($result)) {
            return new WP_REST_Response(
                ['message' => $result->get_error_message()],
                400
            );
        }
        return new WP_REST_Response(
            ['message' => 'Member berhasil diperbarui'],
            200
        );
    }

    public function handle_analysis_events(WP_REST_Request $request)
    {
        $filters = $request->get_params();
        $data = $this->member_service->top_events($filters);
        return new WP_REST_Response($data, 200);
    }

    public function handle_analysis_badges(WP_REST_Request $request)
    {
        $filters = $request->get_params();
        $data = $this->member_service->badge_distribution($filters);
        return new WP_REST_Response($data, 200);
    }

    /**
     * Callback untuk menghapus (soft delete) member.
     */
    public function delete_member(WP_REST_Request $request)
    {
        $id = $request->get_param('id');
        $result = $this->member_service->softDelete($id);
        if (is_wp_error($result)) {
            return new WP_REST_Response(
                ['message' => $result->get_error_message()],
                400
            );
        }
        return new WP_REST_Response(
            ['message' => 'Member berhasil dihapus'],
            200
        );
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
