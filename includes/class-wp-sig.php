<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://github.com/febrianth
 * @since      1.0.0
 *
 * @package    Wp_Sig
 * @subpackage Wp_Sig/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Wp_Sig
 * @subpackage Wp_Sig/includes
 * @author     febrianth <febriantrihardiyanto@gmail.com>
 */
class Wp_Sig
{

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Wp_Sig_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct()
	{
		if (defined('WP_SIG_VERSION')) {
			$this->version = WP_SIG_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'wp-sig';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Wp_Sig_Loader. Orchestrates the hooks of the plugin.
	 * - Wp_Sig_i18n. Defines internationalization functionality.
	 * - Wp_Sig_Admin. Defines all hooks for the admin area.
	 * - Wp_Sig_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies()
	{

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-wp-sig-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-wp-sig-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'admin/class-wp-sig-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'public/class-wp-sig-public.php';

		/**
		 * The class responsible for defining the controller Members
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/controllers/MemberController.php';

		/**
		 * The class responsible for defining the controller Settings
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/controllers/SettingController.php';

		/**
		 * The class responsible for defining the controller import excel
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/controllers/ImportController.php';

		/**
		 * The class responsible for defining the controller event
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/controllers/EventController.php';

		/**
		 * The class responsible for defining the controller event schedule API
		 * side of the site.
		 */
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/controllers/EventScheduleApiController.php';
		
		/**
		 * The class responsible for defining the controller event form API
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/controllers/formApiController.php';

		$this->loader = new Wp_Sig_Loader();
	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Wp_Sig_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale()
	{

		$plugin_i18n = new Wp_Sig_i18n();

		$this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');
	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks()
	{

		$plugin_admin = new Wp_Sig_Admin($this->get_plugin_name(), $this->get_version());

		$this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles');
		$this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts');

		$this->loader->add_action('admin_menu', $plugin_admin, 'add_admin_menu');

		$this->loader->add_filter('admin_footer_text', $plugin_admin, 'change_admin_footer_text', 11);

		$member_api_controller = new MemberApiController();
		$this->loader->add_action('rest_api_init', $member_api_controller, 'register_routes');

		$settings_api_controller = new SettingsApiController();
		$this->loader->add_action('rest_api_init', $settings_api_controller, 'register_routes');

		$event_api_controller = new EventApiController();
		$this->loader->add_action('rest_api_init', $event_api_controller, 'register_routes');

		$import_api_controller = new ImportApiController();
		$this->loader->add_action('rest_api_init', $import_api_controller, 'register_routes');

		$event_schedule_controller = new EventScheduleApiController();
		$this->loader->add_action('rest_api_init', $event_schedule_controller, 'register_routes');

		$form_api_controller = new formApiController();
		$this->loader->add_action('rest_api_init', $form_api_controller, 'register_routes');
	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks()
	{

		$plugin_public = new Wp_Sig_Public($this->get_plugin_name(), $this->get_version());

		$this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
		$this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts');
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run()
	{
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name()
	{
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    Wp_Sig_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader()
	{
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version()
	{
		return $this->version;
	}
}
