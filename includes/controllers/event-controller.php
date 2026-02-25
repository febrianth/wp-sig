<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/event-service.php';

/**
 * Handles all REST API endpoints related to Events.
 */
class EventApiController {

    private $event_service;

    public function __construct($event_service = null) {
        $this->event_service = $event_service ?? new EventService();
    }

    /**
     * Registers all API routes for events.
     */
    public function register_routes() {
        register_rest_route('sig/v1', '/events', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_events'],
            'permission_callback' => [$this, 'admin_permissions_check'],
        ]);
    }

    /**
     * Callback function to fetch all active events.
     * It calls the service, which does the actual database work.
     *
     * @param WP_REST_Request $request The request object.
     * @return WP_REST_Response The response object with the event data.
     */
    public function get_events(WP_REST_Request $request) {
        $events = $this->event_service->get_all_active_events();
        return new WP_REST_Response($events, 200);
    }

    /**
     * Permission check: administrators only.
     *
     * @return bool
     */
    public function admin_permissions_check() {
        return current_user_can('manage_options');
    }
}