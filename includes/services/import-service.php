<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/member-service.php';
require_once WP_SIG_PLUGIN_PATH . 'includes/services/event-service.php';

class ImportService
{

    private $member_service;
    private $event_service;

    public function __construct()
    {
        $this->member_service = new MemberService();
        $this->event_service = new EventService(); // Inisialisasi service untuk event
    }

    /**
     * Memproses file Excel yang diunggah, dengan asumsi formatnya sesuai template.
     * @param string $file_path Path sementara ke file Excel.
     * @return array Ringkasan hasil impor.
     */
    public function import_from_excel($file_path)
    {
        require_once WP_SIG_PLUGIN_PATH . 'vendor/autoload.php';
        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file_path);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            //filter empty rows
            $rows = array_filter($rows, fn($row) => count(array_filter($row)) > 0);
            $header = array_map('strtolower', array_shift($rows));
            
            $success_count = 0;
            $failure_count = 0;
            $errors = [];
            
            foreach ($rows as $index => $row) {
                $row_data = array_combine($header, $row);

                $member_name = $row_data['name'] ?? null;
                $phone_number = $row_data['phone_number'] ?? null;
                $event_name = $row_data['event_name'] ?? null;
                $event_date = $row_data['event_date'] ?? null;
                $is_outside_region = $row_data['is_outside_region'] ?? null;

                if (empty($is_outside_region)) {
                    $combined_village_id = $row_data['village_id'];
                } else {
                    $combined_village_id = null;
                }

                $district_id = null;
                $village_id = null; // This will store the full combined ID

                if (!empty($combined_village_id) && strpos($combined_village_id, '.') !== false) {
                    // 1. Store the full combined ID in the village_id variable
                    $village_id = $combined_village_id;

                    // 2. Extract only the first part for the district_id
                    $parts = explode('.', $combined_village_id, 2);
                    $district_id = $parts[0];
                }

                // Validasi wajib hanya untuk nama & no. telepon
                if (empty($member_name) || empty($phone_number)) {
                    $failure_count++;
                    $errors[] = "Baris " . ($index + 2) . ": Nama & No. Telepon wajib diisi.";
                    continue;
                }

                // Siapkan data untuk member baru, termasuk ID yang sudah diparsing
                $member_details = [
                    'full_address'          => $row_data['full_address'] ?? '',
                    'district_id'           => $district_id,
                    'village_id'            => $village_id,
                    'is_outside_region'     => $is_outside_region,
                    'status'                => 'verified',
                ];
                $member_id = $this->member_service->find_or_create($member_name, $phone_number, $member_details);

                if ($member_id && !empty($event_name) && !empty($event_date)) {
                    $event_id = $this->event_service->find_or_create($event_name, $event_date);
                    if ($event_id) {
                        $this->member_service->add_event_to_member($member_id, $event_id, 'verified');
                    }
                }

                $success_count++;
            }
            return [
                'success' => true,
                'summary' => [
                    'total' => count($rows),
                    'successful' => $success_count,
                    'failed' => $failure_count,
                    'errors' => array_slice($errors, 0, 5)
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
