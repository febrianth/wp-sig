<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://github.com/febrianth
 * @since             1.0.0
 * @package           Wp_Sig
 *
 * @wordpress-plugin
 * Plugin Name:       Wordpress SIG
 * Plugin URI:        https://github.com/febrianth/wp-sig
 * Description:       Wordpress Plugin for SIG (Sistem Informasi Geografis)
 * Version:           1.0.0
 * Author:            febrianth
 * Author URI:        https://github.com/febrianth/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wp-sig
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'WP_SIG_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-wp-sig-activator.php
 */
function activate_wp_sig() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wp-sig-activator.php';
	Wp_Sig_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-wp-sig-deactivator.php
 */
function deactivate_wp_sig() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wp-sig-deactivator.php';
	Wp_Sig_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_wp_sig' );
register_deactivation_hook( __FILE__, 'deactivate_wp_sig' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-wp-sig.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_wp_sig() {

	$plugin = new Wp_Sig();
	$plugin->run();

}
run_wp_sig();
