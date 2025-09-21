<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://github.com/febrianth
 * @since      1.0.0
 *
 * @package    Wp_Sig
 * @subpackage Wp_Sig/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Wp_Sig
 * @subpackage Wp_Sig/admin
 * @author     febrianth <febriantrihardiyanto@gmail.com>
 */

class Wp_Sig_Admin
{

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct($plugin_name, $version)
	{

		$this->plugin_name = $plugin_name;
		$this->version = $version;
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles($hook_suffix)
	{

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Wp_Sig_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Wp_Sig_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		$target_hook = 'toplevel_page_sig_plugin_main';

		if ( $hook_suffix !== $target_hook ) {
			return;
		}

		wp_enqueue_style('dashicons');
		wp_enqueue_style($this->plugin_name, WP_SIG_PLUGIN_URL . 'admin/css/wp-sig-admin.css', array(), $this->version, 'all');
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts($hook_suffix)
	{

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Wp_Sig_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Wp_Sig_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		// only load in this plugins
		if ( $hook_suffix !== 'toplevel_page_sig_plugin_main' ) {
			return;
		}

		$asset_file = include( WP_SIG_PLUGIN_PATH . 'build/index.asset.php');

		wp_enqueue_script(
			$this->plugin_name . '-spa-app',
			WP_SIG_PLUGIN_URL . 'build/index.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);
		// Muat juga CSS hasil build jika ada
		wp_enqueue_style(
			$this->plugin_name . '-spa-app-styles',
			WP_SIG_PLUGIN_URL . 'build/index.css',
			array(),
			$asset_file['version']
		);

		wp_localize_script(
			$this->plugin_name . '-spa-app', // Handle dari script React kita
			'sig_plugin_data',  // Nama objek JavaScript yang akan dibuat
			array(
				'api_url' => esc_url_raw( rest_url( 'sig/v1/' ) ), // URL dasar API kita
				'nonce'   => wp_create_nonce( 'wp_rest' )       // Kunci keamanan (KTP)
			)
		);
	}

	public function add_admin_menu()
	{
		add_menu_page(
			'SIG Plugin', // page title
			'SIG Plugin', // menu title
			'manage_options', // capability
			'sig_plugin_main', // menu slug
			[$this, 'render_spa_shell'], // callback function
			'dashicons-location-alt', // icon URL
			25 // position
		);
	}

	public function render_spa_shell() {
		echo '<div class="wrap"><div id="sig-app-root"></div></div>';
	}

	public function change_admin_footer_text( $footer_text ) {
        // Cek apakah kita berada di halaman admin plugin SIG
        $screen = get_current_screen();
        if ( isset( $screen->id ) && $screen->id === 'toplevel_page_sig_plugin_main' ) {
            return 'Terima kasih telah menggunakan <strong>SIG Plugin</strong>.';
        }
        
        return $footer_text;
    }
}
