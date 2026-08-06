<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://www.enweby.com/
 * @since      1.0.0
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/admin
 */
/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/admin
 * @author     Enweby <support@enweby.com>
 */
class Fullscreen_Background_Admin {
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
     * Setting admin settings
     *
     * @var array.
     */
    private $enweby_admin_settings;

    /**
     * Setting admin settings functions
     *
     */
    private $enweby_setting_functions;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string $plugin_name       The name of this plugin.
     * @param      string $version    The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
        $this->add_setting_framework_init();
        //$this->add_setting_framework();
        $this->enwbfb_get_setting_functions();
        $this->process_version_based_settings();
        $this->load_notices_files();
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Fullscreen_Background_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Fullscreen_Background_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */
        wp_enqueue_style(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'css/fullscreen-background-admin.css',
            array(),
            $this->version,
            'all'
        );
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts() {
        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Fullscreen_Background_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Fullscreen_Background_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */
        wp_enqueue_script(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'js/fullscreen-background-admin.js',
            array('jquery'),
            $this->version,
            false
        );
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }

    /**
     * Load core files.
     */
    public function load_notices_files() {
        if ( is_admin() ) {
            require_once plugin_dir_path( __DIR__ ) . 'admin/lib/enwb-notices/class-enwb-fb-notices.php';
        }
        include_once plugin_dir_path( __FILE__ ) . 'class-enwb-fb-admin-notices.php';
    }

    /**
     * Loading wp media to fix upload button not working in admin.
     */
    function enwbfb_load_wp_media() {
        wp_enqueue_media();
    }

    /**
     * Process version based initial settings.
     *
     */
    public function process_version_based_settings() {
        if ( '1.0.4' <= $this->get_version() ) {
            if ( is_admin() ) {
                // Getting all the admin options values.
                $enweby_fb_post_field_id = (int) get_option( 'enweby_fb_post_field_id', '' );
                $enweby_fb_page_field_id = (int) get_option( 'enweby_fb_page_field_id', '' );
                $enweby_fb_display_options = get_option( 'enweby_fb_display_options', 'home' );
                $enweby_fb_background_type = get_option( 'enweby_fb_background_type', 'image' );
                $enweby_fb_bg_image = get_option( 'enweby_fb_bg_image', '' );
                $enweby_fb_bg_video = get_option( 'enweby_fb_bg_video', '' );
                $enweby_fb_bg_color = get_option( 'enweby_fb_bg_color', '#f8f8f8' );
                $enweby_fb_background_size = get_option( 'enweby_fb_background_size', 'cover' );
                $enweby_fb_background_position = get_option( 'enweby_fb_background_position', 'center center' );
                $enweby_fb_background_attachment = get_option( 'enweby_fb_background_attachment', 'fixed' );
                $enweby_fb_overlay_shadow = get_option( 'enweby_fb_overlay_shadow', 'yes' );
                $enweby_fb_video_background_position = get_option( 'enweby_fb_video_background_position', 'fixed' );
                $enweby_fb_video_background_fit = get_option( 'enweby_fb_video_background_fit', 'cover' );
                $background_image = ( '' !== $enweby_fb_bg_image ? wp_get_attachment_image_src( $enweby_fb_bg_image, $size = 'full' ) : '' );
                /*$enweby_fb_bg_image = $background_image[0];*/
                //converting image id to image  url
                $enweby_fb_bg_image = ( is_array( $background_image ) ? $background_image[0] : '' );
                //converting image id to image  url
                $enweby_fb_global_settings_data_array = array(
                    'fb_general_section_fb_post_field_id'             => $enweby_fb_post_field_id,
                    'fb_general_section_fb_page_field_id'             => $enweby_fb_page_field_id,
                    'fb_general_section_fb_display_options'           => $enweby_fb_display_options,
                    'fb_general_section_fb_background_type'           => $enweby_fb_background_type,
                    'fb_general_section_fb_bg_image'                  => $enweby_fb_bg_image,
                    'fb_general_section_fb_bg_video'                  => $enweby_fb_bg_video,
                    'fb_general_section_fb_bg_color'                  => $enweby_fb_bg_color,
                    'fb_general_section_fb_background_size'           => $enweby_fb_background_size,
                    'fb_general_section_fb_background_position'       => $enweby_fb_background_position,
                    'fb_general_section_fb_background_attachment'     => $enweby_fb_background_attachment,
                    'fb_general_section_fb_overlay_shadow'            => $enweby_fb_overlay_shadow,
                    'fb_general_section_fb_video_background_position' => $enweby_fb_video_background_position,
                    'fb_general_section_fb_video_background_fit'      => $enweby_fb_video_background_fit,
                );
                if ( !get_option( 'enweby_fullscreen_background_settings' ) ) {
                    add_option( 'enweby_fullscreen_background_settings', $enweby_fb_global_settings_data_array );
                }
            }
        }
    }

    /**
     * Initialize admin settings framework.
     *
     * @since    2.0.3
     */
    public function add_setting_framework_init() {
        add_action( 'init', array($this, 'add_setting_framework') );
        add_action( 'admin_footer', array($this, 'add_custom_js') );
    }

    /**
     * Including admin settings framework.
     *
     * @since    1.0.0
     */
    public function add_setting_framework() {
        require_once plugin_dir_path( __FILE__ ) . 'admin-framework/framework/class-wp-settings-framework.php';
        $this->enweby_admin_settings = new \Enwbfb\Enweby\SettingsFramework\WordPressSettingsFramework(plugin_dir_path( __FILE__ ) . 'admin-framework/admin-settings.php', ENWEBY_FB_FWAS);
    }

    /**
     * Including admin js based on some condition.
     *
     * @since    1.0.0
     */
    public function add_custom_js() {
        $enweby_fullscreen_background_settings = get_option( 'enweby_fullscreen_background_settings', array() );
        $fb_general_section_fb_disable_global_settings = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_disable_global_settings'] ) ? $enweby_fullscreen_background_settings['fb_general_section_fb_disable_global_settings'] : 0 );
        if ( 1 == $fb_general_section_fb_disable_global_settings ) {
            ?>
			<script>
			jQuery(function($){
					if ($('#fb_general_section_fb_disable_global_settings').is(':checked') ) {
						$('.wpsf-section.wpsf-tabless .form-table').before('<div class="overlay-dbl-gbl-settings">&nbsp;</div>');
					} else{
						$('.overlay-dbl-gbl-settings').remove();
					}	
				
			});
			</script>
			<?php 
        }
    }

    /**
     * Getting common functions.
     */
    public function enwbfb_get_setting_functions() {
        require_once plugin_dir_path( __FILE__ ) . 'admin-framework/admin-settings-functions.php';
        $this->enweby_setting_functions = new \Enwbfb\Enweby\SettingsFunctions\Setting_Functions();
    }

    /**
     * Validate settings.
     *
     * @param  array $input input value.
     * @return mixed.
     */
    public function enwbfb_validate_settings( $input ) {
        // Do your settings validation here.
        // Same as $sanitize_callback from http://codex.wordpress.org/Function_Reference/register_setting.
        foreach ( $input as $key => $value ) {
            $field_type_array = $this->get_field_type( $key );
            $field_type = $field_type_array['field_type'];
            $input[$key] = $this->enweby_setting_functions->process_validate_settings( $field_type, $value );
        }
        return $input;
    }

    /**
     * Getting field type.
     *
     * @param str $input_key input_key.
     * @return mixed.
     */
    public function get_field_type( $input_key ) {
        $fields_array = array();
        $field_type = array();
        // default type.
        $admin_settings_array = (array) $this->enweby_admin_settings;
        foreach ( $admin_settings_array as $item ) {
            if ( isset( $item['sections'] ) ) {
                foreach ( $item['sections'] as $field_part ) {
                    foreach ( $field_part['fields'] as $field ) {
                        // phpcs:disable
                        if ( $input_key == $field_part['tab_id'] . '_' . $field_part['section_id'] . '_' . $field['id'] ) {
                            $field_type = array(
                                'field_type' => $field['type'],
                                'field'      => $field_part['tab_id'] . '_' . $field_part['section_id'] . '_' . $field['id'],
                            );
                        }
                        // phpcs:enable
                    }
                }
            } else {
                if ( isset( $item['tabless_settings'] ) ) {
                    foreach ( $item['tabless_settings']['fields'] as $field ) {
                        if ( $input_key == $item['tabless_settings']['section_id'] . '_' . $field['id'] ) {
                            $field_type = array(
                                'field_type' => $field['type'],
                                'field'      => $item['tabless_settings']['section_id'] . '_' . $field['id'],
                            );
                        }
                    }
                }
            }
        }
        return $field_type;
    }

    /**
     * Repositioning menu page in admin left sidebar.
     */
    public function wpsf_menu_reposition() {
        return 60;
    }

    /**
     * Repositioning menu page in admin left sidebar.
     */
    public function wpsf_menu_icon_replacement() {
        return 'dashicons-format-image';
    }

    /**
     * Remove_all admin notices on plugin page.
     */
    public function remove_admin_notices_derecated() {
        $screen = get_current_screen();
        if ( in_array( $screen->id, array('toplevel_page_enweby-fullscreen-background-settings'), true ) ) {
            remove_all_actions( 'admin_notices' );
        }
    }

    /**
     * Admin Settings.
     */
    public function add_settings_page() {
        $this->enweby_admin_settings->add_settings_page( array(
            'page_title' => __( 'Enweby Full Screen Background', 'fullscreen-background' ),
            'menu_title' => __( 'Full Screen Background', 'fullscreen-background' ),
            'capability' => 'manage_options',
        ) );
        //Adding submenu page
        $this->enweby_admin_settings->add_settings_page( array(
            'parent_slug' => __( 'enweby-fullscreen-background-settings' ),
            'page_title'  => __( 'Enweby Full Screen Background', 'fullscreen-background' ),
            'menu_title'  => __( 'Global Settings', 'fullscreen-background' ),
            'capability'  => 'manage_options',
        ) );
    }

    function add_fb_plugin_documentation_menu_link() {
        add_submenu_page(
            'enweby-fullscreen-background-settings',
            'Plugin Documentation',
            'Plugin Documentation',
            'manage_options',
            'https://www.enweby.com/documentation/fullscreen-background-documentation/',
            '',
            100
        );
    }

    /**
     * To add Plugin Menu and Settings page.
     */
    public function plugin_menu_settings() {
        // Main Menu Item.
        add_menu_page(
            'Enweby Full Screen Background Settings',
            'Full Screen Background',
            'manage_options',
            'fullscreen-background',
            array($this, 'fullscreen_background_main_menu'),
            'dashicons-format-image',
            60
        );
    }

    /**
     * Admin Page Display.
     */
    public function fullscreen_background_upsell_section() {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/fb-admin-display.php';
    }

    /**
     * Admin Page Display.
     */
    public function fullscreen_background_main_menu() {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/fb-main-menu.php';
    }

    /**
     * Setting plugin menu element.
     */
    public function menu_settings_using_helper() {
        require_once FULLSCREEN_BACKGROUND_DIR . 'vendor/boo/boo-settings-helper/class-boo-settings-helper.php';
        $fullscreen_background_settings = array(
            'tabs'     => true,
            'prefix'   => 'enweby_',
            'menu'     => array(
                'slug'       => $this->plugin_name,
                'page_title' => __( 'fullscreen-background', 'fullscreen-background' ),
                'menu_title' => __( 'Full Screen Background', 'fullscreen-background' ),
                'parent'     => 'admin.php?page=fullscreen-background',
                'submenu'    => true,
            ),
            'sections' => array(
                // General Section.
                array(
                    'id'    => 'fb_general_section',
                    'title' => __( 'Fullscreen Background', 'fullscreen-background' ),
                ),
            ),
            'fields'   => array(
                'fb_general_section' => array(
                    array(
                        'id'      => 'fb_display_options',
                        'label'   => __( 'Display on', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'home' => __( 'Home Page Only', 'fullscreen-background' ),
                            'all'  => __( 'All Pages', 'fullscreen-background' ),
                            'page' => __( 'Specific Page', 'fullscreen-background' ),
                            'post' => __( 'Specific post', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_page_field_id',
                        'label'   => __( 'Select Page', 'fullscreen-background' ),
                        'type'    => 'pages',
                        'options' => array(
                            'post_type' => 'page',
                        ),
                    ),
                    array(
                        'id'      => 'fb_post_field_id',
                        'label'   => __( 'Select Post', 'fullscreen-background' ),
                        'type'    => 'posts',
                        'options' => array(
                            'post_type' => 'post',
                        ),
                    ),
                    array(
                        'id'      => 'fb_background_type',
                        'label'   => __( 'Set Full Screen Background as', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'image' => __( 'Image', 'fullscreen-background' ),
                            'video' => __( 'Video', 'fullscreen-background' ),
                            'color' => __( 'Color', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_bg_image',
                        'label'   => __( 'Add/Edit Background Image', 'fullscreen-background' ),
                        'desc'    => __( 'Add/Edit Background Image', 'fullscreen-background' ),
                        'type'    => 'media',
                        'default' => '',
                        'options' => array(
                            'btn'       => 'Add Media',
                            'max_width' => 150,
                        ),
                    ),
                    array(
                        'id'      => 'fb_bg_video',
                        'label'   => __( 'Add/Edit Background Video', 'fullscreen-background' ),
                        'desc'    => __( 'Add/Edit Background Video here', 'fullscreen-background' ),
                        'type'    => 'file',
                        'default' => '',
                        'options' => array(
                            'btn' => 'Add Video',
                        ),
                    ),
                    array(
                        'id'    => 'fb_bg_color',
                        'label' => __( 'Select Background Color', 'fullscreen-background' ),
                        'type'  => 'color',
                    ),
                    array(
                        'id'      => 'fb_video_background_position',
                        'label'   => __( 'Background Attachment', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'fixed'    => __( 'Fixed', 'fullscreen-background' ),
                            'relative' => __( 'Relative', 'fullscreen-background' ),
                            'inherit'  => __( 'Inherit', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_video_background_fit',
                        'label'   => __( 'Video Object Fit', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'cover'   => __( 'Cover', 'fullscreen-background' ),
                            'contain' => __( 'Contain', 'fullscreen-background' ),
                            'inherit' => __( 'Inherit', 'fullscreen-background' ),
                            'initial' => __( 'Initial', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_background_size',
                        'label'   => __( 'Background Size', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'cover'   => __( 'Cover', 'fullscreen-background' ),
                            'contain' => __( 'Contain', 'fullscreen-background' ),
                            'inherit' => __( 'Inherit', 'fullscreen-background' ),
                            'initial' => __( 'Initial', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_background_position',
                        'label'   => __( 'Background Position', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'center center' => __( 'Center Center', 'fullscreen-background' ),
                            'center top'    => __( 'Center Top', 'fullscreen-background' ),
                            'center bottom' => __( 'Center Bottom', 'fullscreen-background' ),
                            'left top'      => __( 'Left Top', 'fullscreen-background' ),
                            'left center'   => __( 'Left Center', 'fullscreen-background' ),
                            'left bottom'   => __( 'Left Bottom', 'fullscreen-background' ),
                            'right top'     => __( 'Right Top', 'fullscreen-background' ),
                            'right center'  => __( 'Right Center', 'fullscreen-background' ),
                            'right bottom'  => __( 'Right Bottom', 'fullscreen-background' ),
                        ),
                    ),
                    array(
                        'id'      => 'fb_background_attachment',
                        'label'   => __( 'Background Attachment', 'fullscreen-background' ),
                        'type'    => 'select',
                        'options' => array(
                            'fixed'   => __( 'Fixed', 'fullscreen-background' ),
                            'scroll'  => __( 'Scroll', 'fullscreen-background' ),
                            'local'   => __( 'Local', 'fullscreen-background' ),
                            'inherit' => __( 'Inherit', 'fullscreen-background' ),
                            'initial' => __( 'Initial', 'fullscreen-background' ),
                        ),
                    )
                ),
            ),
        );
        new Boo_Settings_Helper($fullscreen_background_settings);
    }

    /**
     * Action links for admin.
     *
     * @param  array $links Array of action links.
     * @return array
     */
    public function plugin_action_links( $links ) {
        $settings_link = esc_url( add_query_arg( array(
            'page' => 'enweby-fullscreen-background-settings',
        ), admin_url( 'admin.php' ) ) );
        $new_links['settings'] = sprintf( '<a href="%1$s" title="%2$s">%2$s</a>', $settings_link, esc_attr__( 'Settings', 'fullscreen-background' ) );
        // phpcs:disable
        /*
        		if ( ! class_exists( 'Fullscreen_Background_Pro' ) ){
        			$pro_link = esc_url( add_query_arg( array( 'utm_source' => 'wp-admin-plugins', 'utm_medium' => 'go	-pro', 'utm_campaign' => 'fullscreen-background' ), 'https://www.enweby.com/shop/wordpress-plugins/fullscreen-background-pro/' ) );
        			$new_links[ 'go-pro' ] = sprintf( '<a target="_blank" style="color: #45b450; font-weight: bold;" href="%1$s" title="%2$s">%2$s</a>', $pro_link, esc_attr__('Go Pro', 'fullscreen-background' ) );
        		}*/
        // phpcs:enable
        return array_merge( $links, $new_links );
    }

    /**
     * Plugin row meta.
     *
     * @param  array  $links array of row meta.
     * @param  string $file  plugin base name.
     * @return array
     */
    public function plugin_row_meta( $links, $file ) {
        // phpcs:ignore
        if ( $file === FULLSCREEN_BACKGROUND_BASE_NAME ) {
            $report_url = add_query_arg( array(
                'utm_source'   => 'wp-admin-plugins',
                'utm_medium'   => 'row-meta-link',
                'utm_campaign' => 'fullscreen-background',
            ), 'https://www.enweby.com/product/fullscreen-background#support/' );
            $documentation_url = add_query_arg( array(
                'utm_source'   => 'wp-admin-plugins',
                'utm_medium'   => 'row-meta-link',
                'utm_campaign' => 'fullscreen-background',
            ), 'https://www.enweby.com/documentation/fullscreen-background-documentation/' );
            $row_meta['documentation'] = sprintf( '<a target="_blank" href="%1$s" title="%2$s">%2$s</a>', esc_url( $documentation_url ), esc_html__( 'Documentation', 'fullscreen-background' ) );
            // phpcs:ignore
            $row_meta['issues'] = sprintf(
                '%2$s <a target="_blank" href="%1$s">%3$s</a>',
                esc_url( $report_url ),
                esc_html__( '', 'fullscreen-background' ),
                '<span style="color: #45b450;font-weight:bold;">' . esc_html__( 'Get Support', 'fullscreen-background' ) . '</span>'
            );
            return array_merge( $links, $row_meta );
        }
        return (array) $links;
    }

}
