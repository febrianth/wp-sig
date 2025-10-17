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
        return $this->wpdb->get_results(
            "SELECT id, event_name, event_date FROM {$this->table_name} WHERE deleted_at IS NULL ORDER BY event_date DESC",
            ARRAY_A
        );
    }
}
