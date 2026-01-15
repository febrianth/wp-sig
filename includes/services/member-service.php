<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/event-service.php';
require_once WP_SIG_PLUGIN_PATH . 'includes/services/setting-service.php';

class MemberService
{

    private $wpdb;

    private $table_members;
    private $table_member_events;
    private $table_events;

    private $event_service;
    private $setting_service;

    public function __construct()
    {
        global $wpdb;

        $this->wpdb = $wpdb;

        $this->table_members = $this->wpdb->prefix . 'sig_members';
        $this->table_member_events = $this->wpdb->prefix . 'sig_member_events';
        $this->table_events = $this->wpdb->prefix . 'sig_events';
        
        $this->event_service = new EventService();
        $this->setting_service = new SettingsService();
    }

    public function get_member_summary(?int $eventId): array
    {
        return [
            'meta' => $this->get_meta($eventId),
            'by_district' => $this->by_district($eventId),
            'by_village' => $this->by_village($eventId),
        ];
    }

    public function get_meta(?int $eventId): array
    {
        $whereEvent = '';
        $params = [];

        if ($eventId !== null) {
            $whereEvent = "
                AND EXISTS (
                    SELECT 1
                    FROM {$this->table_member_events} me
                    WHERE me.member_id = m.id
                      AND me.event_id = %d
                      AND me.status = 'verified'
                      AND me.deleted_at IS NULL
                )
            ";
            $params[] = $eventId;
        }

        $sql = "
            SELECT
                COUNT(*) AS total_members,
                SUM(m.is_outside_region = 0) AS inside_region,
                SUM(m.is_outside_region = 1) AS outside_region
            FROM {$this->table_members} m
            WHERE m.deleted_at IS NULL
              AND m.status = 'verified'
            {$whereEvent}
        ";

        if (!empty($params)) {
            $sql = $this->wpdb->prepare($sql, ...$params);
        }

        return (array) $this->wpdb->get_row($sql, ARRAY_A);
    }

    public function by_district(?int $eventId): array
    {
        $whereEvent = '';
        $params = [];

        if ($eventId !== null) {
            $whereEvent = "
            AND EXISTS (
                SELECT 1
                FROM {$this->table_member_events} me
                WHERE me.member_id = m.id
                  AND me.event_id = %d
                  AND me.status = 'verified'
                  AND me.deleted_at IS NULL
            )
        ";
            $params[] = $eventId;
        }

        $sql = "
            SELECT
                m.district_id,
                COUNT(*) AS total
            FROM {$this->table_members} m
            WHERE m.deleted_at IS NULL
              AND m.status = 'verified'
              AND m.district_id IS NOT NULL
            {$whereEvent}
            GROUP BY m.district_id
            ORDER BY total DESC
        ";

        if (!empty($params)) {
            $sql = $this->wpdb->prepare($sql, ...$params);
        }

        return $this->wpdb->get_results($sql, ARRAY_A);
    }

    public function by_village(?int $eventId): array
    {
        $whereEvent = '';
        $params = [];

        if ($eventId !== null) {
            $whereEvent = "
            AND EXISTS (
                SELECT 1
                FROM {$this->table_member_events} me
                WHERE me.member_id = m.id
                  AND me.event_id = %d
                  AND me.status = 'verified'
                  AND me.deleted_at IS NULL
            )
        ";
            $params[] = $eventId;
        }

        $sql = "
            SELECT
                m.village_id,
                m.district_id,
                COUNT(*) AS total
            FROM {$this->table_members} m
            WHERE m.deleted_at IS NULL
              AND m.status = 'verified'
              AND m.village_id IS NOT NULL
            {$whereEvent}
            GROUP BY m.village_id, m.district_id
            ORDER BY total DESC
        ";

        if (!empty($params)) {
            $sql = $this->wpdb->prepare($sql, ...$params);
        }

        return $this->wpdb->get_results($sql, ARRAY_A);
    }

    public function get_paginated_members(array $args): array
    {
        $page = max(1, (int) ($args['page'] ?? 1));
        $perPage = min(50, max(10, (int) ($args['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = ["m.deleted_at IS NULL", "m.status = 'verified'"];
        $params = [];

        // Filter event
        if (!empty($args['event_id'])) {
            $where[] = "
            EXISTS (
                SELECT 1
                FROM {$this->table_member_events} me
                WHERE me.member_id = m.id
                  AND me.event_id = %d
                  AND me.status = 'verified'
                  AND me.deleted_at IS NULL
            )
        ";
            $params[] = (int) $args['event_id'];
        }

        // Filter district
        if (!empty($args['district_id'])) {
            $where[] = "m.district_id = %s";
            $params[] = $args['district_id'];
        }

        // Filter village
        if (!empty($args['village_id'])) {
            $where[] = "m.village_id = %s";
            $params[] = $args['village_id'];
        }

        $whereSql = implode(' AND ', $where);

        // DATA QUERY
        $sql = "
        SELECT
            m.*
        FROM {$this->table_members} m
        WHERE {$whereSql}
        ORDER BY m.created_at DESC
        LIMIT %d OFFSET %d
    ";

        $params[] = $perPage;
        $params[] = $offset;

        $dataSql = $this->wpdb->prepare($sql, ...$params);
        $data = $this->wpdb->get_results($dataSql, ARRAY_A);

        // COUNT QUERY (TANPA LIMIT)
        $countSql = "
        SELECT COUNT(*)
        FROM {$this->table_members} m
        WHERE {$whereSql}
    ";

        $countSql = $this->wpdb->prepare($countSql, ...array_slice($params, 0, -2));
        $total = (int) $this->wpdb->get_var($countSql);

        return [
            'data' => $data,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage),
            ]
        ];
    }

    public function top_events(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;

        $where = "m.status = 'verified' AND me.status = 'verified'";
        $params = [];

        if (!empty($filters['event_id'])) {
            $where .= " AND me.event_id = %d";
            $params[] = $filters['event_id'];
        }

        if (!empty($filters['region_level']) && !empty($filters['region_code'])) {
            if ($filters['region_level'] === 'district') {
                $where .= " AND m.district_id = %s";
                $params[] = $filters['region_code'];
            } elseif ($filters['region_level'] === 'village') {
                $where .= " AND m.village_id = %s";
                $params[] = $filters['region_code'];
            }
        }

        $sql = "
            SELECT
                e.event_name AS label,
                COUNT(DISTINCT m.id) AS value
            FROM {$this->table_member_events} me
            JOIN {$this->table_members} m ON m.id = me.member_id
            JOIN {$this->table_events} e ON e.id = me.event_id
            WHERE {$where}
            GROUP BY me.event_id
            ORDER BY value DESC
            LIMIT {$limit}
        ";

        return $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$params),
            ARRAY_A
        );
    }

    // ============================
    // BADGE DISTRIBUTION
    // ============================
    public function badge_distribution(array $filters = []): array
    {
        $where = "m.status = 'verified'";
        $params = [];

        if (!empty($filters['region_level']) && !empty($filters['region_code'])) {
            if ($filters['region_level'] === 'district') {
                $where .= " AND m.district_id = %s";
                $params[] = $filters['region_code'];
            } elseif ($filters['region_level'] === 'village') {
                $where .= " AND m.village_id = %s";
                $params[] = $filters['region_code'];
            }
        }

        $settings = $this->setting_service->get_settings();

        $gold = $settings['badge_thresholds']['gold'];
        $silver = $settings['badge_thresholds']['silver'];
        $bronze = $settings['badge_thresholds']['bronze'];

       $sql = "
            SELECT
                label,
                COUNT(*) AS value
            FROM (
                SELECT
                    m.id,
                    CASE
                        WHEN COUNT(me.id) >= {$gold} THEN 'Gold'
                        WHEN COUNT(me.id) >= {$silver} THEN 'Silver'
                        WHEN COUNT(me.id) >= {$bronze} THEN 'Bronze'
                        ELSE 'New'
                    END AS label
                FROM {$this->table_members} m
                LEFT JOIN {$this->table_member_events} me
                    ON me.member_id = m.id
                    AND me.status = 'verified'
                WHERE {$where}
                GROUP BY m.id
            ) t
            GROUP BY label
        ";
        // die(var_dump($filters));

        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$params),
            ARRAY_A
        );

        $total = array_sum(array_column($rows, 'value'));

        return [
            'total' => $total,
            'data' => array_map(function ($row) use ($total) {
                return [
                    'label' => $row['label'],
                    'value' => (int)$row['value'],
                    'percentage' => $total > 0 ? round(($row['value'] / $total) * 100, 2) : 0
                ];
            }, $rows)
        ];
    }

    /**
     * Mengambil semua data member dari database, lengkap dengan jumlah event yang diikuti.
     * @return array
     */
    public function get_all()
    {
        $sql = "
            SELECT 
                m.*, 
                COUNT(DISTINCT me.id) as event_count,
                GROUP_CONCAT(DISTINCT me.event_id SEPARATOR ',') as event_ids
            FROM {$this->table_members} AS m
            LEFT JOIN {$this->table_member_events} AS me 
                   ON m.id = me.member_id 
                  AND me.status = 'verified'
                  AND me.deleted_at IS NULL
            WHERE m.deleted_at IS NULL
              AND m.status = 'verified'
            GROUP BY m.id
            ORDER BY event_count DESC
        ";

        $results = $this->wpdb->get_results($sql, ARRAY_A);

        foreach ($results as &$result) {
            $result['event_count'] = (int) $result['event_count'];

            if ($result['event_ids']) {
                $result['event_ids'] = explode(',', $result['event_ids']);
            } else {
                $result['event_ids'] = [];
            }
        }

        return $results;
    }

    public function get_member_details($id)
    {
        $member = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_members} WHERE id = %d AND deleted_at IS NULL",
                $id
            ),
            ARRAY_A
        );

        if (!$member) {
            return null; // Member tidak ditemukan
        }

        // 2. Ambil riwayat event untuk member ini
        $events_table = $this->wpdb->prefix . 'sig_events';
        $member_events_table = $this->wpdb->prefix . 'sig_member_events';

        $events = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT e.event_name, e.started_at, me.status
                 FROM {$member_events_table} AS me
                 LEFT JOIN {$events_table} AS e ON me.event_id = e.id
                 WHERE me.member_id = %d AND me.deleted_at IS NULL
                 ORDER BY e.started_at DESC",
                $id
            ),
            ARRAY_A
        );

        $member['events'] = $events;

        $member['event_count'] = count(array_filter($events, function ($e) {
            return $e['status'] === 'verified';
        }));

        return $member;
    }

    public function find_or_create($name, $phone_number, $additional_data = [])
    {
        $name = sanitize_text_field($name);
        $phone_number = sanitize_text_field($phone_number);

        $existing_id = $this->get_by_phone_number($phone_number)['id'] ?? null;

        $data_to_insert = array_merge(['name' => $name, 'phone_number' => $phone_number], $additional_data);

        if ($existing_id) {
            $this->update($existing_id, $data_to_insert);
            return (int) $existing_id;
        }

        $success = $this->create($data_to_insert);

        return $success ? $this->wpdb->insert_id : false;
    }

    public function get_by_phone_number($phone_number)
    {
        $phone_number = sanitize_text_field($phone_number);

        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->table_members} WHERE phone_number = %s AND deleted_at IS NULL",
            $phone_number
        ), ARRAY_A);

        return $result ?: null;
    }

    public function get_by_id($id)
    {
        $id = sanitize_text_field($id);

        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->table_members} WHERE id = %d AND deleted_at IS NULL",
            $id
        ), ARRAY_A);

        return $result ?: null;
    }

    public function check_double_checkin($member_id, $event_id)
    {
        $existing_entry = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->table_member_events} WHERE member_id = %d AND event_id = %d AND deleted_at IS NULL",
            $member_id,
            $event_id
        ));

        return $existing_entry ? true : false;
    }

    /**
     * Menambahkan catatan partisipasi event untuk seorang member.
     */
    public function add_event_to_member($member_id, $event_id, $status = 'verified')
    {
        // Cek agar tidak ada duplikat
        $existing_entry = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->table_member_events} WHERE member_id = %d AND event_id = %d",
            $member_id,
            $event_id
        ));

        if ($existing_entry) {
            // Jika sudah ada, cukup perbarui statusnya (misal, dari 'pending'/'rejected' menjadi 'verified')
            $this->wpdb->update(
                $this->table_member_events,
                ['status' => $status, 'updated_at' => current_time('mysql', 1)],
                ['id' => $existing_entry]
            );
            return $existing_entry;
        } else {
            // Jika belum ada sama sekali, buat entri baru
            $this->wpdb->insert($this->table_member_events, [
                'member_id' => $member_id,
                'event_id' => $event_id,
                'status' => $status
            ]);
            return $this->wpdb->insert_id;
        }
    }

    public function validate_active_events()
    {
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

        return true;
    }

    public function create(array $data)
    {
        // Sanitasi data
        $name = sanitize_text_field($data['name']);
        $phone_number = sanitize_text_field($data['phone_number']);
        $status = $data['status'] ?? 'pending';

        // Validasi Wajib
        if (empty($name) || empty($phone_number)) {
            return new WP_Error(
                'missing_data',
                'Nama dan Nomor Telepon wajib diisi.',
                ['status' => 400]
            );
        }

        // Cek Keunikan Nomor Telepon
        $existing_id = $this->get_by_phone_number($phone_number)['id'] ?? null;
        if ($existing_id) {
            return new WP_Error(
                'duplicate_phone',
                'Nomor telepon ini sudah terdaftar.',
                ['status' => 409]
            ); // 409 Conflict
        }

        if ($data['is_outside_region'] == 1) {
            $data['district_id'] = null;
            $data['village_id'] = null;
        } else {
            if (empty($data['district_id']) || empty($data['village_id'])) {
                return new WP_Error(
                    'missing_region_data',
                    'Data wilayah (kecamatan dan desa) wajib diisi untuk peserta dari dalam wilayah.',
                    ['status' => 400]
                );
            }
        }

        $formatted_data = [
            'name'                => $name,
            'phone_number'        => $phone_number,
            'status'              => $status,
            'full_address'        => sanitize_textarea_field($data['full_address']),
            'district_id'         => sanitize_text_field($data['district_id']),
            'village_id'          => sanitize_text_field($data['village_id']),
            'is_outside_region'   => sanitize_text_field($data['is_outside_region']),
        ];

        $success = $this->wpdb->insert($this->table_members, $formatted_data);
        if (!$success) {
            return new WP_Error('db_insert_error', 'Gagal menyimpan data ke database.', ['status' => 500]);
        }

        // Sinkronkan (hapus semua yang lama, tambah semua yang baru)
        if (!empty($data['event_ids'])) {
            $this->sync_events($this->wpdb->insert_id, $data['event_ids']);
        }
        return $this->wpdb->insert_id;
    }

    /**
     * Memperbarui data member yang ada.
     */
    public function update(int $id, array $data)
    {
        // Pisahkan data member dari data event
        $event_ids = $data['event_ids'] ?? [];
        unset($data['event_ids']); // Hapus dari array data member

        if ($data['is_outside_region'] == 1) {
            $data['district_id'] = null;
            $data['village_id'] = null;
        } else {
            if (empty($data['district_id']) || empty($data['village_id'])) {
                return new WP_Error(
                    'missing_region_data',
                    'Data wilayah (kecamatan dan desa) wajib diisi untuk peserta dari dalam wilayah.',
                    ['status' => 400]
                );
            }
        }

        // 2. Sanitasi data member
        $formatted_data = [
            'name'                => sanitize_text_field($data['name']),
            'full_address'        => sanitize_textarea_field($data['full_address']),
            'district_id'         => sanitize_text_field($data['district_id']),
            'phone_number'        => sanitize_text_field($data['phone_number']),
            'village_id'          => sanitize_text_field($data['village_id']),
            'is_outside_region'   => sanitize_text_field($data['is_outside_region']),
        ];

        $success = $this->wpdb->update($this->table_members, $formatted_data, ['id' => $id]);
        if ($success === false) {
            return new WP_Error(
                'db_update_error',
                'Gagal memperbarui data member.',
                ['status' => 500]
            );
        }

        // Sinkronkan (hapus semua yang lama, tambah semua yang baru)
        if (!empty($event_ids)) {
            $this->sync_events($id, $event_ids);
        }

        return true;
    }

    /**
     * Ini menghapus semua event lama dan menambahkan semua event baru dari array.
     */
    private function sync_events(int $member_id, array $event_ids)
    {
        $now = current_time('mysql', 1);
        // 1. Hapus semua koneksi event yang ada untuk member ini
        $this->wpdb->update(
            $this->table_member_events,
            ['deleted_at' => $now],
            ['member_id' => $member_id]
        );

        // 2. Tambahkan kembali koneksi untuk event yang baru dipilih
        if (!empty($event_ids)) {
            foreach ($event_ids as $event_id) {
                $this->add_event_to_member($member_id, (int)$event_id, 'verified');
            }
        }
    }

    /**
     * Melakukan soft delete pada member.
     */
    /**
     * Melakukan soft delete pada member dan semua data event terkait.
     */
    public function softDelete(int $id)
    {
        // 1. Set waktu saat ini
        $now = current_time('mysql', 1); // Waktu GMT

        // 2. Soft delete data di tabel member
        $success_member = $this->wpdb->update(
            $this->table_members, // Asumsi nama properti Anda adalah table_members
            ['deleted_at' => $now],
            ['id' => $id]
        );

        // 3. Soft delete semua data di tabel member_events
        $success_events = $this->wpdb->update(
            $this->table_member_events,
            ['deleted_at' => $now],
            ['member_id' => $id] // Targetkan semua event yang dimiliki member_id ini
        );

        // 4. Cek jika salah satu query gagal
        if ($success_member === false || $success_events === false) {
            return new WP_Error(
                'db_delete_error',
                'Gagal menghapus data member atau data event terkait.',
                ['status' => 500]
            );
        }

        return true;
    }
}
