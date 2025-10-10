<?php
class MemberService
{

    private $wpdb;
    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $this->wpdb->prefix . 'sig_members';
    }

    public function get_all()
    {
        return $this->wpdb->get_results("SELECT * FROM {$this->table_name} WHERE deleted_at IS NULL ORDER BY updated_at DESC", ARRAY_A);
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

        $success = $this->wpdb->insert($this->table_name, $formatted_data);

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

        $success = $this->wpdb->update($this->table_name, $formatted_data, ['id' => $id]);

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
            $this->table_name,
            ['deleted_at' => current_time('mysql', 1)], // Set deleted_at ke waktu saat ini (GMT)
            ['id' => $id]
        );

        if (!$success) {
            return new WP_Error('db_delete_error', 'Gagal menghapus data.', ['status' => 500]);
        }
        return true;
    }
}
