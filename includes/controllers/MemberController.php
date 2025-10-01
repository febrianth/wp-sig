<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/MemberService.php';

class MemberApiController {

    private $member_service;

    public function __construct() {
        $this->member_service = new MemberService();
    }

    public function register_routes() {
        register_rest_route( 'sig/v1', '/members', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_members' ),
            'permission_callback' => array( $this, 'admin_permissions_check' ),
        ) );
        // Nanti rute POST, PUT, DELETE untuk member akan kita tambahkan di sini.
    }

    /**
     * @return WP_REST_Response
     */
    public function get_members() {
        $data = $this->member_service->get_all();
        return new WP_REST_Response( $data, 200 );
    }

    /**
     * Only Admin.
     * @return bool
     */
    public function admin_permissions_check() {
        return current_user_can( 'manage_options' );
    }

    /**
     * Logged in Users.
     * @return bool
     */
    public function logged_in_permissions_check() {
        return is_user_logged_in();
    }

    /**
     * Public.
     * @return bool
     */
    public function public_permissions_check() {
        return true;
    }
}