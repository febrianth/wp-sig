<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://github.com/febrianth
 * @since      1.0.0
 *
 * @package    Wp_Sig
 * @subpackage Wp_Sig/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    Wp_Sig
 * @subpackage Wp_Sig/public
 * @author     febrianth <febriantrihardiyanto@gmail.com>
 */
class Wp_Sig_Public {

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
	 * @param      string    $plugin_name       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

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

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/wp-sig-public.css', array(), $this->version, 'all' );
	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

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

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/wp-sig-public.js', array( 'jquery' ), $this->version, false );
		wp_enqueue_script('jquery'); 

		global $post;
        
        // Cek apakah postingan ada dan memiliki shortcode kita
        if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'sig_registration_form' ) ) {
            
            // Tentukan path ke file aset yang di-generate oleh Webpack
            $script_asset_path = WP_SIG_PLUGIN_PATH . 'build/public-form.asset.php';

            if ( ! file_exists( $script_asset_path ) ) {
                // Beri pesan error jika file build tidak ada
                wp_die( 'File "public-form.asset.php" tidak ditemukan. Jalankan npm run build.' );
            }

            $script_asset = require( $script_asset_path );

            wp_enqueue_script(
                'wp-sig-public-form', // Nama handle unik
                WP_SIG_PLUGIN_URL . 'build/public-form.js',
                $script_asset['dependencies'],
                $script_asset['version'],
                true // Muat di footer
            );
            
            // Muat file CSS yang di-generate oleh build
            wp_enqueue_style(
                'wp-sig-public-form-style',
                WP_SIG_PLUGIN_URL . 'build/public-form.css',
                [],
                $script_asset['version']
            );
            
            // Kirim data dari PHP ke JavaScript
            wp_localize_script(
                'wp-sig-public-form',
                'sig_public_data',
                [
                    'api_url' => esc_url_raw( rest_url( 'sig/v1/' ) ),
                    'nonce'   => wp_create_nonce( 'wp_rest' ), // Nonce untuk keamanan
                ]
            );
        }
	}

	/**
     * METHOD BARU: Mendaftarkan shortcode.
     */
    public function register_shortcodes() {
        add_shortcode( 'sig_registration_form', [ $this, 'render_registration_form_shortcode' ] );
    }

    /**
     * METHOD BARU: Callback untuk shortcode.
     * Ini hanya merender div target untuk React.
     */
    public function render_registration_form_shortcode() {
        return '<div id="sig-public-form-root"></div>';
    }

}
