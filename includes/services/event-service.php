<?php

/**
 * Menangani semua operasi data untuk tabel Events.
 */
class EventService
{

    private $wpdb;
    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $this->wpdb->prefix . 'sig_events';
    }

    /**
     * Mencari event berdasarkan nama & tanggal, atau membuatnya jika tidak ada.
     * Mengubah DATE menjadi DATETIME.
     */
    public function find_or_create($event_name, $event_date)
    {
        $event_name = sanitize_text_field($event_name);
        $date_obj = date_create($event_date);
        if (!$date_obj) return false;

        // Atur started_at ke awal hari, end_at ke akhir hari
        $started_at = date_format($date_obj, 'Y-m-d 00:00:00');
        $end_at = date_format($date_obj, 'Y-m-d 23:59:59');

        $existing_id = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE event_name = %s AND DATE(started_at) = %s AND deleted_at IS NULL",
            $event_name,
            date_format($date_obj, 'Y-m-d')
        ));

        if ($existing_id) return (int) $existing_id;

        $success = $this->wpdb->insert($this->table_name, [
            'event_name' => $event_name,
            'started_at' => $started_at,
            'end_at' => $end_at,
        ]);

        return $success ? $this->wpdb->insert_id : false;
    }

    /**
     * Mengambil semua event yang aktif untuk digunakan di dropdown.
     *
     * @return array
     */
    public function get_all_active_events()
    {
        $data = $this->wpdb->get_results(
            "SELECT id, event_name, started_at, end_at FROM {$this->table_name} WHERE deleted_at IS NULL ORDER BY started_at DESC",
            ARRAY_A
        );

        $newData = [];
        if (!empty($data)) {
            foreach ($data as $item) {
                $newData[$item['id']] = $item;
            }
            $data = $newData;
        }

        return $data;
    }

    public function get_recent_completed_events()
    {
        $events_table = $this->table_name;
        $member_events_table = $this->wpdb->prefix . 'sig_member_events';

        $sql = $this->wpdb->prepare(
            "SELECT e.event_name, e.end_at, COUNT(me.id) as total_attendees
             FROM {$events_table} AS e
             LEFT JOIN {$member_events_table} AS me ON e.id = me.event_id AND me.status = 'verified' AND me.deleted_at IS NULL
             WHERE e.status = 0 AND e.deleted_at IS NULL
             GROUP BY e.id
             ORDER BY e.end_at DESC
             LIMIT 3"
        );
        return $this->wpdb->get_results($sql, ARRAY_A);
    }

    /**
     * Mengambil event yang sedang aktif untuk api_form,
     * lengkap dengan daftar member yang statusnya pending.
     */
    public function get_active_api_form_details()
    {
        $event = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE status = 1 AND deleted_at IS NULL LIMIT 1"
            ),
            ARRAY_A
        );

        if ($event) {
            $members_table = $this->wpdb->prefix . 'sig_members';
            $member_events_table = $this->wpdb->prefix . 'sig_member_events';


            $event['pending_members'] = $this->wpdb->get_results(
                "
                SELECT *
                FROM {$members_table}
                WHERE status IN ('pending', 'rejected') 
                  AND deleted_at IS NULL
                ORDER BY created_at DESC",
                ARRAY_A
            );

            $event['pending_attendance'] = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT 
                        m.name, m.phone_number, m.district_id, m.village_id, 
                        me.id as member_event_id, 
                        me.status 
                     FROM {$member_events_table} AS me
                     LEFT JOIN {$members_table} AS m 
                            ON me.member_id = m.id
                           AND m.status = 'verified' 
                     WHERE me.event_id = %d 
                       AND me.status IN ('pending', 'rejected') 
                       AND me.deleted_at IS NULL
                     ORDER BY me.created_at DESC",
                    $event['id']
                ),
                ARRAY_A
            );
        }
        return $event;
    }

    public function update_member_event_status($member_event_id, $status)
    {
        // Validasi status untuk keamanan
        $allowed_statuses = ['pending', 'verified', 'rejected'];
        if (!in_array($status, $allowed_statuses)) {
            return new WP_Error('invalid_status', 'Status tidak valid.', ['status' => 400]);
        }

        $success = $this->wpdb->update(
            $this->wpdb->prefix . 'sig_member_events',
            ['status' => $status, 'updated_at' => current_time('mysql', 1)], // Data baru
            ['id' => $member_event_id] // Kondisi WHERE
        );

        if ($success === false) {
            return new WP_Error('db_update_error', 'Gagal memperbarui status member.', ['status' => 500]);
        }
        return true;
    }

    public function update_member_status($member_event_id, $status)
    {
        // Validasi status untuk keamanan
        $allowed_statuses = ['pending', 'verified', 'rejected'];
        if (!in_array($status, $allowed_statuses)) {
            return new WP_Error('invalid_status', 'Status tidak valid.', ['status' => 400]);
        }

        $success = $this->wpdb->update(
            $this->wpdb->prefix . 'sig_members',
            ['status' => $status, 'updated_at' => current_time('mysql', 1)], // Data baru
            ['id' => $member_event_id] // Kondisi WHERE
        );

        if ($success === false) {
            return new WP_Error('db_update_error', 'Gagal memperbarui status member.', ['status' => 500]);
        }
        return true;
    }

    /**
     * Membuat atau memperbarui event yang aktif untuk api_form.
     */
    public function save_active_api_form_event($event_data)
    {
        $site_timezone = wp_timezone();
        $now = new DateTimeImmutable('now', $site_timezone);
        $start_datetime = new DateTimeImmutable($event_data['started_at'], $site_timezone);
        $end_datetime   = new DateTimeImmutable($event_data['end_at'], $site_timezone);

        // Ambil ID dari data (bisa null jika ini event baru)
        $event_id = $event_data['id'] ?? null;

        // Validasi 1: Waktu berakhir tidak boleh sebelum waktu mulai
        if ($end_datetime < $start_datetime) {
            return new WP_Error('invalid_dates', 'Waktu selesai tidak boleh sebelum waktu mulai.', ['status' => 400]);
        }

        // Validasi 2: Waktu mulai tidak boleh di masa lalu (hanya berlaku saat membuat event BARU)
        if (empty($event_id) && $start_datetime < $now->modify('-5 minutes')) {
            return new WP_Error('past_event', 'Tidak dapat membuat event baru di waktu yang sudah lewat.', ['status' => 400]);
        }

        // Data yang akan disimpan/diperbarui
        $data = [
            'event_name' => sanitize_text_field($event_data['event_name']),
            'started_at' => sanitize_text_field($event_data['started_at']),
            'end_at' => sanitize_text_field($event_data['end_at']),
            'status' => 1, // Pastikan event ini aktif
        ];

        if ($event_id) {
            // --- LOGIKA UPDATE ---
            // Kita sedang mengedit event yang ada.

            // 1. Nonaktifkan semua event aktif LAINNYA (yang BUKAN ID ini)
            $this->wpdb->query(
                $this->wpdb->prepare("UPDATE {$this->table_name} SET status = 0 WHERE status = 1 AND id != %d", $event_id)
            );

            // 2. Perbarui event ini
            $this->wpdb->update($this->table_name, $data, ['id' => $event_id]);

            return ['status' => 'updated', 'id' => $event_id];
        } else {
            // --- LOGIKA CREATE ---
            // Ini adalah event baru.

            // 1. Nonaktifkan semua event aktif yang mungkin ada
            $this->wpdb->update($this->table_name, ['status' => 0], ['status' => 1]);

            // 2. Buat event baru
            $this->wpdb->insert($this->table_name, $data);
            $new_id = $this->wpdb->insert_id;

            return ['status' => 'created', 'id' => $new_id];
        }
    }

    /**
     * Menyelesaikan event: menonaktifkan api_form dan menyetujui semua member pending.
     */
    public function finish_active_event()
    {
        $active_event = $this->get_active_api_form_details();
        if (!$active_event) {
            return new WP_Error('no_active_event', 'Tidak ada event aktif untuk diselesaikan.');
        }

        $event_id = $active_event['id'];

        // Setujui (approve) semua member yang pending untuk event ini
        $this->wpdb->update(
            $this->wpdb->prefix . 'sig_member_events',
            ['status' => 'verified', 'updated_at' => current_time('mysql', 1)],
            ['event_id' => $event_id, 'status' => 'pending', 'deleted_at' => null]
        );

        $this->wpdb->update(
            $this->wpdb->prefix . 'sig_members',
            ['status' => 'verified', 'updated_at' => current_time('mysql', 1)],
            ['deleted_at' => null, 'status' => 'pending']
        );

        // Nonaktifkan event ini dari api_form
        $this->wpdb->update(
            $this->table_name,
            ['status' => 0],
            ['id' => $event_id]
        );

        return true;
    }
}
