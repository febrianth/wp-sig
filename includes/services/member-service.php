<?php
require_once WP_SIG_PLUGIN_PATH . 'includes/services/event-service.php';

class MemberService
{

    private $wpdb;
    private $table_members;
    private $table_member_events;
    private $event_service;


    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_members = $this->wpdb->prefix . 'sig_members';
        $this->table_member_events = $this->wpdb->prefix . 'sig_member_events';
        $this->event_service = new EventService();
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
