<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://www.enweby.com/
 * @since             1.0.0
 * @package           Fullscreen_Background
 *
 * @wordpress-plugin
 * Plugin Name: 	  Fullscreen Background
 * Plugin URI:        https://www.enweby.com/product/fullscreen-background/
 * Description:       Lightweight plugin to add Fullscreen Background image or video on your WordPress site by Enweby.
 * Version:           2.0.6
 * Author:            Enweby
 * Author URI:        https://www.enweby.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       fullscreen-background
 * Domain Path:       /languages
 */
// If this file is called directly, abort.
if ( !defined( 'WPINC' ) ) {
    die;
}
if ( !defined( 'ABSPATH' ) ) {
    exit;
}
if ( function_exists( 'enwbfb_fs' ) ) {
    enwbfb_fs()->set_basename( false, __FILE__ );
} else {
    if ( !function_exists( 'enwbfb_fs' ) ) {
        // Create a helper function for easy SDK access.
        function enwbfb_fs() {
            global $enwbfb_fs;
            if ( !isset( $enwbfb_fs ) ) {
                // Include Freemius SDK.
                require_once dirname( __FILE__ ) . '/vendor/freemius/start.php';
                $enwbfb_fs = fs_dynamic_init( array(
                    'id'             => '12796',
                    'slug'           => 'fullscreen-background',
                    'type'           => 'plugin',
                    'public_key'     => 'pk_ca8aa1c35ac32fc7d44933d812781',
                    'is_premium'     => false,
                    'premium_suffix' => 'premium',
                    'has_addons'     => false,
                    'has_paid_plans' => true,
                    'menu'           => array(
                        'slug'    => 'enweby-fullscreen-background-settings',
                        'support' => false,
                    ),
                    'anonymous_mode' => true,
                    'is_live'        => true,
                ) );
            }
            return $enwbfb_fs;
        }

        // Init Freemius.
        enwbfb_fs();
        // remove a permission from persmission list from optin screen
        enwbfb_fs()->add_filter( 'permission_list', 'enwbfb_remove_extensions_permission' );
        // Not like register_uninstall_hook(), you do NOT have to use a static function.
        enwbfb_fs()->add_action( 'after_uninstall', 'enwbfb_fs_uninstall_cleanup' );
        // Signal that SDK was initiated.
        do_action( 'enwbfb_fs_loaded' );
    }
    /***.. Your plugin's main file logic starts here...*/
    if ( !function_exists( 'enwbfb_fs_uninstall_cleanup' ) ) {
        /**
         * Uninstall Cleanup
         */
        function enwbfb_fs_uninstall_cleanup() {
        }

    }
    /**
     * Removing extension info permission from optin screen
     *
     * @since    1.0.2
     */
    function enwbfb_remove_extensions_permission(  $permissions  ) {
        foreach ( $permissions as $key => $val ) {
            if ( $val['id'] !== 'extensions' ) {
                continue;
            }
            unset($permissions[$key]);
            break;
        }
        return $permissions;
    }

    /**
     * Currently plugin version.
     * Start at version 1.0.0 and use SemVer - https://semver.org
     * Rename this for your plugin and update it as you release new versions.
     */
    define( 'FULLSCREEN_BACKGROUND_VERSION', '2.0.6' );
    /**
     * Plugin base name.
     * used to locate plugin resources primarily code files
     * Start at version 1.0.0
     */
    define( 'FULLSCREEN_BACKGROUND_BASE_NAME', plugin_basename( __FILE__ ) );
    /**
     * Plugin name.
     * used to get plugin dashed name.
     */
    define( 'FULLSCREEN_BACKGROUND_PLUGIN_NAME', 'fullscreen-background' );
    /**
     * Plugin base dir path.
     * used to locate plugin resources primarily code files
     * Start at version 1.0.0
     */
    defined( 'FULLSCREEN_BACKGROUND_DIR' ) || define( 'FULLSCREEN_BACKGROUND_DIR', plugin_dir_path( __FILE__ ) );
    /**
     * To add admin settings in the admmin and to fetch in the frontend later
     */
    define( 'ENWEBY_FB_FWAS', 'enweby_fullscreen_background' );
    /**
     * The code that runs during plugin activation.
     * This action is documented in includes/class-fullscreen-background-activator.php
     */
    function activate_fullscreen_background() {
        require_once plugin_dir_path( __FILE__ ) . 'includes/class-fullscreen-background-activator.php';
        Fullscreen_Background_Activator::activate();
    }

    /**
     * The code that runs during plugin deactivation.
     * This action is documented in includes/class-fullscreen-background-deactivator.php
     */
    function deactivate_fullscreen_background() {
        require_once plugin_dir_path( __FILE__ ) . 'includes/class-fullscreen-background-deactivator.php';
        Fullscreen_Background_Deactivator::deactivate();
    }

    register_activation_hook( __FILE__, 'activate_fullscreen_background' );
    register_deactivation_hook( __FILE__, 'deactivate_fullscreen_background' );
    /**
     * The core plugin class that is used to define internationalization,
     * admin-specific hooks, and public-facing site hooks.
     */
    require plugin_dir_path( __FILE__ ) . 'includes/class-fullscreen-background.php';
    /**
     * Begins execution of the plugin.
     *
     * Since everything within the plugin is registered via hooks,
     * then kicking off the plugin from this point in the file does
     * not affect the page life cycle.
     *
     * @since    1.0.0
     */
    function run_fullscreen_background() {
        $plugin = new Fullscreen_Background();
        $plugin->run();
    }

    run_fullscreen_background();
}