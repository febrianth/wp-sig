<?php
class MemberService
{

    private $wpdb;
    private $table_members;
    private $table_member_events;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_members = $this->wpdb->prefix . 'sig_members';
        $this->table_member_events = $this->wpdb->prefix . 'sig_member_events';
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
            FROM 
                {$this->table_members} AS m
            INNER JOIN 
                {$this->table_member_events} AS me 
                    ON m.id = me.member_id 
                   AND me.status = 'verified'
                   AND me.deleted_at IS NULL
            WHERE 
                m.deleted_at IS NULL
            GROUP BY 
                m.id
            ORDER BY 
                event_count DESC
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

    public function find_or_create($name, $phone_number, $additional_data = [])
    {
        $name = sanitize_text_field($name);
        $phone_number = sanitize_text_field($phone_number);

        $existing_id = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->table_members} WHERE name = %s AND phone_number = %s AND deleted_at IS NULL",
            $name,
            $phone_number
        ));

        if ($existing_id) {
            return (int) $existing_id;
        }

        $data_to_insert = array_merge(['name' => $name, 'phone_number' => $phone_number], $additional_data);
        $success = $this->wpdb->insert($this->table_members, $data_to_insert);

        return $success ? $this->wpdb->insert_id : false;
    }

    /**
     * Menambahkan catatan partisipasi event untuk seorang member.
     */
    public function add_event_to_member($member_id, $event_id, $status = 'verified')
    {
        $table = $this->wpdb->prefix . 'sig_member_events';

        // Cek agar tidak ada duplikat
        $exists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$table} WHERE member_id = %d AND event_id = %d",
            $member_id,
            $event_id
        ));

        if ($exists) {
            return true; // Sudah terdaftar
        }

        return $this->wpdb->insert($table, [
            'member_id' => $member_id,
            'event_id' => $event_id,
            'status' => $status
        ]);
    }

    public function create(array $data)
    {
        // 1. Pisahkan data member dari data event
        $event_ids = $data['event_ids'] ?? [];
        unset($data['event_ids']); // Hapus dari array data member

        // 2. Sanitasi data member
        $formatted_data = [
            'name'         => sanitize_text_field($data['name']),
            'full_address' => sanitize_textarea_field($data['full_address']),
            'phone_number' => sanitize_text_field($data['phone_number']),
            'district_id'  => sanitize_text_field($data['district_id']),
            'village_id'   => sanitize_text_field($data['village_id']),
        ];

        $success = $this->wpdb->insert($this->table_members, $formatted_data);
        if (!$success) {
            return new WP_Error('db_insert_error', 'Gagal menyimpan data member.', ['status' => 500]);
        }

        $member_id = $this->wpdb->insert_id;

        // 3. Hubungkan event-event
        $this->sync_events($member_id, $event_ids);

        return $member_id;
    }

    /**
     * Memperbarui data member yang ada.
     */
    public function update(int $id, array $data)
    {
        // 1. Pisahkan data member dari data event
        $event_ids = $data['event_ids'] ?? [];
        unset($data['event_ids']); // Hapus dari array data member

        // 2. Sanitasi data member
        $formatted_data = [
            'name'         => sanitize_text_field($data['name']),
            'full_address' => sanitize_textarea_field($data['full_address']),
            'phone_number' => sanitize_text_field($data['phone_number']),
            'district_id'  => sanitize_text_field($data['district_id']),
            'village_id'   => sanitize_text_field($data['village_id']),
        ];

        $success = $this->wpdb->update($this->table_members, $formatted_data, ['id' => $id]);
        if ($success === false) {
            return new WP_Error('db_update_error', 'Gagal memperbarui data member.', ['status' => 500]);
        }

        // 3. Sinkronkan (hapus semua yang lama, tambah semua yang baru)
        $this->sync_events($id, $event_ids);

        return true;
    }

    /**
     * Method baru untuk sinkronisasi event (Private).
     * Ini menghapus semua event lama dan menambahkan semua event baru dari array.
     */
    private function sync_events(int $member_id, array $event_ids)
    {
        // 1. Hapus semua koneksi event yang ada untuk member ini
        $this->wpdb->delete($this->table_member_events, ['member_id' => $member_id]);

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
        // Asumsi nama properti tabel event Anda adalah $this->table_member_events
        $success_events = $this->wpdb->update(
            $this->table_member_events,
            ['deleted_at' => $now],
            ['member_id' => $id] // Targetkan semua event yang dimiliki member_id ini
        );

        // 4. Cek jika salah satu query gagal
        if ($success_member === false || $success_events === false) {
            return new WP_Error('db_delete_error', 'Gagal menghapus data member atau data event terkait.', ['status' => 500]);
        }

        return true;
    }
}
