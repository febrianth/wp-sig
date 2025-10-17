<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/ImportService.php';

class ImportApiController
{

    private $import_service;

    public function __construct()
    {
        $this->import_service = new ImportService();
    }

    public function register_routes()
    {
        register_rest_route('sig/v1', '/import-excel', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_import'],
            'permission_callback' => [$this, 'permissions_check'],
        ]);
    }

    public function handle_import(WP_REST_Request $request)
    {
        $files = $request->get_file_params();

        if (empty($files['excel_file'])) {
            return new WP_REST_Response(['error' => 'File Excel tidak ditemukan.'], 400);
        }

        $file_path = $files['excel_file']['tmp_name'];
        // Panggil service tanpa parameter mappings
        $result = $this->import_service->import_from_excel($file_path);

        if ($result['success']) {
            return new WP_REST_Response($result['summary'], 200);
        } else {
            return new WP_REST_Response(['error' => $result['error']], 500);
        }
    }

    public function permissions_check()
    {
        return current_user_can('manage_options');
    }
}
