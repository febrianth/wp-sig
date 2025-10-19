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

    // includes/services/MemberService.php

    /**
     * Mengambil semua data member dari database, lengkap dengan jumlah event yang diikuti.
     * @return array
     */
    public function get_all()
    {
        $sql = "
            SELECT 
                m.*, 
                COUNT(me.id) as event_count
            FROM 
                {$this->table_members} AS m
            LEFT JOIN 
                {$this->table_member_events} AS me ON m.id = me.member_id
            WHERE 
                m.deleted_at IS NULL
            GROUP BY 
                m.id
            ORDER BY 
                m.id DESC
        ";

        $results = $this->wpdb->get_results($sql, ARRAY_A);

        // Pastikan event_count adalah angka (integer)
        foreach ($results as &$result) {
            $result['event_count'] = (int) $result['event_count'];
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
        // Sanitasi data sebelum insert
        $formatted_data = [
            'name'         => sanitize_text_field($data['name']),
            'full_address' => sanitize_textarea_field($data['full_address']),
            'phone_number' => sanitize_text_field($data['phone_number']),
            'district_id'  => sanitize_text_field($data['district_id']),
            'village_id'   => sanitize_text_field($data['village_id']),
            'latitude'     => sanitize_text_field($data['latitude']),
            'longitude'    => sanitize_text_field($data['longitude']),
        ];

        $success = $this->wpdb->insert($this->table_members, $formatted_data);

        if (!$success) {
            return new WP_Error('db_insert_error', 'Gagal menyimpan data ke database.', ['status' => 500]);
        }
        return $this->wpdb->insert_id;
    }

    /**
     * Memperbarui data member yang ada.
     */
    public function update(int $id, array $data)
    {
        // Sanitasi data
        $formatted_data = [
            'name'         => sanitize_text_field($data['name']),
            'full_address' => sanitize_textarea_field($data['full_address']),
            'phone_number' => sanitize_text_field($data['phone_number']),
            'district_id'  => sanitize_text_field($data['district_id']),
            'village_id'   => sanitize_text_field($data['village_id']),
            'latitude'     => sanitize_text_field($data['latitude']),
            'longitude'    => sanitize_text_field($data['longitude']),
        ];

        $success = $this->wpdb->update($this->table_members, $formatted_data, ['id' => $id]);

        if ($success === false) {
            return new WP_Error('db_update_error', 'Gagal memperbarui data.', ['status' => 500]);
        }
        return true;
    }

    /**
     * Melakukan soft delete pada member.
     */
    public function softDelete(int $id)
    {
        $success = $this->wpdb->update(
            $this->table_members,
            ['deleted_at' => current_time('mysql', 1)], // Set deleted_at ke waktu saat ini (GMT)
            ['id' => $id]
        );

        if (!$success) {
            return new WP_Error('db_delete_error', 'Gagal menghapus data.', ['status' => 500]);
        }
        return true;
    }
}
