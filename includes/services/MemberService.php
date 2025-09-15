<?php
class MemberService {
    
    private $wpdb;
    private $table_name;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $this->wpdb->prefix . 'sig_members';
    }
    
    public function get_all() {
        return $this->wpdb->get_results( "SELECT * FROM {$this->table_name} WHERE deleted_at IS NULL ORDER BY id DESC", ARRAY_A );
    }
}