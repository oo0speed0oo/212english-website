<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://www.enweby.com/
 * @since      1.0.0
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/public
 */
/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/public
 * @author     Enweby <support@enweby.com>
 */
class Fullscreen_Background_Public {
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
     * @param      string $plugin_name       The name of the plugin.
     * @param      string $version    The version of this plugin.
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
         * defined in Fullscreen_Background_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Fullscreen_Background_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */
        wp_enqueue_style(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'css/fullscreen-background-public.css',
            array(),
            $this->version,
            'all'
        );
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
         * defined in Fullscreen_Background_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Fullscreen_Background_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */
        wp_enqueue_script(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'js/fullscreen-background-public.js',
            array('jquery'),
            $this->version,
            false
        );
    }

    /**
     * Getting Meta Data for post type enwb_fb_settings_meta_single.
     */
    public function get_enwb_fb_settings_meta_single() {
        return $enwb_fb_settings_meta_values = apply_filters( 'enwb_fb_settings_meta_single_filter', get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true ) );
    }

    /**
     * Setting up fullscreen background common overlay.
     */
    public function enweby_setup_fullscreen_background_overlay() {
        $enweby_fullscreen_background_settings = get_option( 'enweby_fullscreen_background_settings', array() );
        $enweby_fb_common_shadow = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] : '2' );
        if ( 1 == $enweby_fb_common_shadow ) {
            ?>
		<div class='enwbfb-overlay'>&nbsp;</div>
		<?php 
        }
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
        $enwb_fb_common_shadow_single = ( isset( $enwb_fb_settings_meta_values['fb-shadow'] ) && '' != $enwb_fb_settings_meta_values['fb-shadow'] ? $enwb_fb_settings_meta_values['fb-shadow'] : '2' );
        if ( isset( $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) && 1 == $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) {
            if ( 1 == $enwb_fb_common_shadow_single ) {
                ?>
		<div class='enwbfb-overlay'>&nbsp;</div>		
		<?php 
            }
        }
    }

    /**
     * Setting up fullscreen background image or color.
     */
    public function enweby_setup_fullscreen_background_styles() {
        $enweby_fullscreen_background_settings = get_option( 'enweby_fullscreen_background_settings', array() );
        // Getting all the admin options values.
        $enweby_fb_display_options = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] : 'home' );
        $enweby_fb_background_type = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] : 'image' );
        $enweby_fb_bg_image = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_bg_image'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_bg_image'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_bg_image'] : '' );
        $enweby_fb_bg_video = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] : '' );
        $enweby_fb_bg_color = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_bg_color'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_bg_color'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_bg_color'] : 'unset' );
        $enweby_fb_background_size = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_size'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_size'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_size'] : 'cover' );
        $enweby_fb_background_position = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_position'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_position'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_position'] : 'center center' );
        $enweby_fb_background_attachment = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_attachment'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_attachment'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_attachment'] : 'fixed' );
        $enweby_fb_overlay_shadow = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_overlay_shadow'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_overlay_shadow'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_overlay_shadow'] : 'yes' );
        $enweby_fb_common_shadow = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_common_shadow'] : '2' );
        $enweby_fb_make_header_transparent = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_make_header_transparent'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_make_header_transparent'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_make_header_transparent'] : '2' );
        $enweby_fb_remove_elements = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_remove_elements_bg'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_remove_elements_bg'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_remove_elements_bg'] : '' );
        //overriding if page/post wise settings is set
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
        // Generating background type for css.
        $bg_fullscreen = '';
        switch ( $enweby_fb_background_type ) {
            case 'image':
                if ( isset( $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) && 1 == $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) {
                } else {
                    if ( enwbfb_fs()->is_free_plan() ) {
                        $bg_fullscreen = "background-image: url( '" . $enweby_fb_bg_image . "' );";
                    }
                }
                break;
            case 'color':
                $bg_fullscreen = 'background-color: ' . $enweby_fb_bg_color . ';';
                break;
            case 'video':
                $bg_fullscreen = '';
                break;
            default:
                $bg_fullscreen = 'background-color: ' . $enweby_fb_bg_color . ';';
        }
        ?>
		<style>
		<?php 
        $fullscreen_background_styles = '.enweby-fullscreen-background { ';
        $fullscreen_background_styles .= $bg_fullscreen;
        if ( 'image' === $enweby_fb_background_type ) {
            $fullscreen_background_styles .= ' background-size: ' . $enweby_fb_background_size . ';';
            $fullscreen_background_styles .= ' background-position: ' . $enweby_fb_background_position . ';';
            $fullscreen_background_styles .= ' background-attachment: ' . $enweby_fb_background_attachment . ';';
        }
        $fullscreen_background_styles .= ' }';
        //make site main content background transparent.
        $fullscreen_background_styles .= '.enweby-fullscreen-background #page, .enweby-fullscreen-background .site,.enweby-fullscreen-background #content,.enweby-fullscreen-background .site-content,.enweby-fullscreen-background .site-main,.enweby-fullscreen-background #content-area,.enweby-fullscreen-background .page-wrapper { background:transparent!important; background:none!important; background-color:unset!important; }';
        if ( 1 == $enweby_fb_make_header_transparent ) {
            $fullscreen_background_styles .= '.enweby-fullscreen-background header,.enweby-fullscreen-background .header,.enweby-fullscreen-background .site-header, .enweby-fullscreen-background .ast-main-header-wrap .main-header-bar{ border:none !important; background:none!important; background-color:unset!important; background:transparent!important;}';
        }
        $enweby_fb_remove_elements_trimmed = trim( $enweby_fb_remove_elements, ',' );
        $fullscreen_background_styles .= $enweby_fb_remove_elements_trimmed . '{ background:transparent!important; background:none!important; background-color:unset!important;}';
        if ( 1 == $enweby_fb_common_shadow ) {
            $fullscreen_background_styles .= '.enweby-fullscreen-background #page,.enweby-fullscreen-background main,.enweby-fullscreen-background #site-content,.enweby-fullscreen-background #site-header, .enweby-fullscreen-background header,.enweby-fullscreen-background footer,.enweby-fullscreen-background #site-footer{position:relative;z-index:0;}';
        }
        echo wp_kses_post( $fullscreen_background_styles );
        ?>
		</style>
		<?php 
    }

    /**
     * Enqueing Slideshow styles
     */
    public function enwbfb_enqueue() {
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
    }

    /**
     * Enqueing custom page/post wise styles
     */
    public function enwbfb_enqueue_custom_css_single() {
        $enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
    }

    /**
     * Enqueing custom page/post wise script before head ends
     */
    public function enwbfb_enqueue_custom_js_single_header() {
        $custom_js_filtered_final = "";
        $enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        echo $custom_js_filtered_final;
    }

    /**
     * Enqueing custom page/post wise script on before body ends
     */
    public function enwbfb_enqueue_custom_js_single_body() {
        $custom_js_filtered_final = "";
        $enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        echo $custom_js_filtered_final;
    }

    /**
     * Backgrond Slideshow
     */
    public function enweby_setup_fullscreen_background_slideshow_global() {
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enweby_fullscreen_background_settings', true );
        $enwb_fb_settings_meta_values = get_option( 'enweby_fullscreen_background_settings', array() );
    }

    /**
     * Backgrond Slideshow
     */
    public function enweby_setup_fullscreen_background_slideshow() {
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
    }

    /**
     * Setting up fullscreen background video.
     */
    public function enweby_setup_fullscreen_background_video() {
        // Getting all the admin options values.
        $enweby_fullscreen_background_settings = get_option( 'enweby_fullscreen_background_settings', array() );
        $enweby_fb_display_options = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] : 'home' );
        $enweby_fb_background_type = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] : '' );
        $enweby_fb_bg_video = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_bg_video'] : '' );
        $enweby_fb_video_background_position = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_position'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_position'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_position'] : 'fixed' );
        $enweby_fb_video_background_fit = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_fit'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_fit'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_video_background_fit'] : 'cover' );
        $enweby_fb_video_loop = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_video_loop'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_video_loop'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_video_loop'] : '2' );
        $enweby_fb_video_loop_final = ( 2 == $enweby_fb_video_loop ? 'loop' : '' );
        // Getting background video.
        $background_video = ( '' !== $enweby_fb_bg_video ? $enweby_fb_bg_video : '' );
        $bg_video_html = '';
        //Gettomg page/post wise settings is set
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
        if ( isset( $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) && 1 == $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) {
        } else {
            if ( 'video' === $enweby_fb_background_type ) {
                if ( '' !== $enweby_fb_bg_video ) {
                    if ( is_front_page() && 'home' === $enweby_fb_display_options ) {
                        ?>
							<style> 
								.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                        echo esc_attr( $enweby_fb_video_background_fit );
                        ?>; position: <?php 
                        echo esc_attr( $enweby_fb_video_background_position );
                        ?> ; }
								#page{position:relative;z-index:99999;}
							</style>
							<div class='enweby-fullscreen-video-background-wrapper'>
								<video playsinline autoplay muted <?php 
                        echo esc_attr( $enweby_fb_video_loop_final );
                        ?> poster='' >
									<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/webm'>
									<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/mp4'>
									Your browser does not support the video tag.
								</video>
							</div>
						<?php 
                    }
                    if ( 'all' === $enweby_fb_display_options ) {
                        ?>
							<style> 
								.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                        echo esc_attr( $enweby_fb_video_background_fit );
                        ?>; position: <?php 
                        echo esc_attr( $enweby_fb_video_background_position );
                        ?> ; }
								#page{position:relative;z-index:99999;}
							</style>
							<div class='enweby-fullscreen-video-background-wrapper'>
								<video playsinline autoplay muted <?php 
                        echo esc_attr( $enweby_fb_video_loop_final );
                        ?> poster=''>
									<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/webm'>
									<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/mp4'>
									Your browser does not support the video tag.
								</video>
							</div>
						<?php 
                    }
                    if ( 'post' === $enweby_fb_display_options ) {
                        $enweby_fb_post_field_id = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] : '' );
                        if ( get_the_id() === (int) $enweby_fb_post_field_id ) {
                            ?>
							<style> 
								.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                            echo esc_attr( $enweby_fb_video_background_fit );
                            ?>; position: <?php 
                            echo esc_attr( $enweby_fb_video_background_position );
                            ?> ; }
								#page{position:relative;z-index:99999;}
							</style>
							<div class='enweby-fullscreen-video-background-wrapper'>
								<video playsinline autoplay muted <?php 
                            echo esc_attr( $enweby_fb_video_loop_final );
                            ?> poster=''>
									<source src='<?php 
                            echo esc_url( $background_video );
                            ?>' type='video/webm'>
									<source src='<?php 
                            echo esc_url( $background_video );
                            ?>' type='video/mp4'>
									Your browser does not support the video tag.
								</video>
							</div>
							<?php 
                        }
                    }
                    if ( 'page' === $enweby_fb_display_options ) {
                        $enweby_fb_page_field_id = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] : '' );
                        if ( get_the_id() === (int) $enweby_fb_page_field_id ) {
                            ?>
							<style> 
								.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                            echo esc_attr( $enweby_fb_video_background_fit );
                            ?>; position: <?php 
                            echo esc_attr( $enweby_fb_video_background_position );
                            ?> ; }
								#page{position:relative;z-index:99999;}
							</style>
							<div class='enweby-fullscreen-video-background-wrapper'>
								<video playsinline autoplay muted <?php 
                            echo esc_attr( $enweby_fb_video_loop_final );
                            ?> poster=''>
									<source src='<?php 
                            echo esc_url( $background_video );
                            ?>' type='video/webm'>
									<source src='<?php 
                            echo esc_url( $background_video );
                            ?>' type='video/mp4'>
									Your browser does not support the video tag.
								</video>
								</div>
							<?php 
                        }
                    }
                }
            }
        }
    }

    /**
     * Setting up fullscreen background.
     *
     * @param  array $classes body classes in array.
     * @return array
     */
    public function fullscreen_background_body_classes( $classes ) {
        $enweby_fullscreen_background_settings = get_option( 'enweby_fullscreen_background_settings', array() );
        $enweby_fb_display_options = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_display_options'] : 'home' );
        $enweby_fb_general_section_fb_background_type = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_background_type'] : 'image' );
        //$enwb_fb_settings_meta_values = get_post_meta( get_the_ID(), 'enwb_fb_settings_meta_single', true );
        $enwb_fb_settings_meta_values = $this->get_enwb_fb_settings_meta_single();
        if ( isset( $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) && 1 == $enwb_fb_settings_meta_values['use-page-wise-fb-settings'] ) {
        } else {
            if ( is_front_page() && 'home' === $enweby_fb_display_options ) {
                $classes[] = 'enweby-fullscreen-background';
                if ( 'video' == $enweby_fb_general_section_fb_background_type ) {
                    $classes[] = 'enweby-fullscreen-background-video';
                }
            }
            if ( 'all' === $enweby_fb_display_options ) {
                $classes[] = 'enweby-fullscreen-background';
                if ( 'video' == $enweby_fb_general_section_fb_background_type ) {
                    $classes[] = 'enweby-fullscreen-background-video';
                }
            }
            if ( 'post' === $enweby_fb_display_options ) {
                $enweby_fb_post_field_id = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_post_field_id'] : '' );
                if ( get_the_id() === (int) $enweby_fb_post_field_id ) {
                    $classes[] = 'enweby-fullscreen-background';
                    if ( 'video' == $enweby_fb_general_section_fb_background_type ) {
                        $classes[] = 'enweby-fullscreen-background-video';
                    }
                }
            }
            if ( 'page' === $enweby_fb_display_options ) {
                $enweby_fb_page_field_id = ( isset( $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] ) && '' != $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] ? $enweby_fullscreen_background_settings['fb_general_section_fb_page_field_id'] : '' );
                if ( get_the_id() === (int) $enweby_fb_page_field_id ) {
                    $classes[] = 'enweby-fullscreen-background';
                    if ( 'video' == $enweby_fb_general_section_fb_background_type ) {
                        $classes[] = 'enweby-fullscreen-background-video';
                    }
                }
            }
        }
        return $classes;
    }

    /**
     * Setting up fullscreen background image or color - deprecated.
     */
    public function enweby_setup_fullscreen_background_styles_depracated() {
        // Getting all the admin options values.
        $enweby_fb_display_options = get_option( 'enweby_fb_display_options', 'home' );
        $enweby_fb_background_type = get_option( 'enweby_fb_background_type', 'image' );
        $enweby_fb_bg_image = get_option( 'enweby_fb_bg_image', '' );
        $enweby_fb_bg_video = get_option( 'enweby_fb_bg_video', '' );
        $enweby_fb_bg_color = get_option( 'enweby_fb_bg_color', '#f8f8f8' );
        $enweby_fb_background_size = get_option( 'enweby_fb_background_size', 'cover' );
        $enweby_fb_background_position = get_option( 'enweby_fb_background_position', 'center center' );
        $enweby_fb_background_attachment = get_option( 'enweby_fb_background_attachment', 'fixed' );
        $enweby_fb_overlay_shadow = get_option( 'enweby_fb_overlay_shadow', 'yes' );
        // Getting background image.
        $background_image = ( '' !== $enweby_fb_bg_image ? wp_get_attachment_image_src( $enweby_fb_bg_image, $size = 'full' ) : '' );
        // Generating background type for css.
        switch ( $enweby_fb_background_type ) {
            case 'image':
                $bg_fullscreen = "background-image: url( ' " . $background_image[0] . " ' );";
                break;
            case 'color':
                $bg_fullscreen = 'background-color: ' . $enweby_fb_bg_color . ';';
                break;
            case 'video':
                $bg_fullscreen = '';
                break;
            default:
                $bg_fullscreen = 'background-color: ' . $enweby_fb_bg_color . ';';
        }
        ?>
		<style>
		<?php 
        $fullscreen_background_styles = '.enweby-fullscreen-background { ';
        $fullscreen_background_styles .= $bg_fullscreen;
        if ( 'image' === $enweby_fb_background_type ) {
            $fullscreen_background_styles .= ' background-size: ' . $enweby_fb_background_size . ';';
            $fullscreen_background_styles .= ' background-position: ' . $enweby_fb_background_position . ';';
            $fullscreen_background_styles .= ' background-attachment: ' . $enweby_fb_background_attachment . ';';
        }
        $fullscreen_background_styles .= ' }';
        echo wp_kses_post( $fullscreen_background_styles );
        ?>
		</style>
		<?php 
    }

    /**
     * Setting up fullscreen background video - deprecated.
     */
    public function enweby_setup_fullscreen_background_video_deprecated() {
        // Getting all the admin options values.
        $enweby_fb_display_options = get_option( 'enweby_fb_display_options', 'home' );
        $enweby_fb_background_type = get_option( 'enweby_fb_background_type', '' );
        $enweby_fb_bg_video = get_option( 'enweby_fb_bg_video', '' );
        $enweby_fb_video_background_position = get_option( 'enweby_fb_video_background_position', 'fixed' );
        $enweby_fb_video_background_fit = get_option( 'enweby_fb_video_background_fit', 'cover' );
        // Getting background video.
        $background_video = ( '' !== $enweby_fb_bg_video ? $enweby_fb_bg_video : '' );
        $bg_video_html = '';
        if ( 'video' === $enweby_fb_background_type ) {
            if ( '' !== $enweby_fb_bg_video ) {
                if ( is_front_page() && 'home' === $enweby_fb_display_options ) {
                    ?>
						<style> 
							.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                    echo esc_attr( $enweby_fb_video_background_fit );
                    ?>; position: <?php 
                    echo esc_attr( $enweby_fb_video_background_position );
                    ?> ; }
							#page{position:relative;z-index:99999;}
						</style>
						<div class='enweby-fullscreen-video-background-wrapper'>
							<video playsinline autoplay muted loop poster=''>
								<source src='<?php 
                    echo esc_url( $background_video );
                    ?>' type='video/webm'>
								<source src='<?php 
                    echo esc_url( $background_video );
                    ?>' type='video/mp4'>
								Your browser does not support the video tag.
							</video>
						</div>
					<?php 
                }
                if ( 'all' === $enweby_fb_display_options ) {
                    ?>
						<style> 
							.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                    echo esc_attr( $enweby_fb_video_background_fit );
                    ?>; position: <?php 
                    echo esc_attr( $enweby_fb_video_background_position );
                    ?> ; }
							#page{position:relative;z-index:99999;}
						</style>
						<div class='enweby-fullscreen-video-background-wrapper'>
							<video playsinline autoplay muted loop poster=''>
								<source src='<?php 
                    echo esc_url( $background_video );
                    ?>' type='video/webm'>
								<source src='<?php 
                    echo esc_url( $background_video );
                    ?>' type='video/mp4'>
								Your browser does not support the video tag.
							</video>
						</div>
					<?php 
                }
                if ( 'post' === $enweby_fb_display_options ) {
                    if ( get_the_id() === (int) get_option( 'enweby_fb_post_field_id', '' ) ) {
                        ?>
						<style> 
							.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                        echo esc_attr( $enweby_fb_video_background_fit );
                        ?>; position: <?php 
                        echo esc_attr( $enweby_fb_video_background_position );
                        ?> ; }
							#page{position:relative;z-index:99999;}
						</style>
						<div class='enweby-fullscreen-video-background-wrapper'>
							<video playsinline autoplay muted loop poster=''>
								<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/webm'>
								<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/mp4'>
								Your browser does not support the video tag.
							</video>
						</div>
						<?php 
                    }
                }
                if ( 'page' === $enweby_fb_display_options ) {
                    if ( get_the_id() === (int) get_option( 'enweby_fb_page_field_id', '' ) ) {
                        ?>
						<style> 
							.enweby-fullscreen-video-background-wrapper video {object-fit: <?php 
                        echo esc_attr( $enweby_fb_video_background_fit );
                        ?>; position: <?php 
                        echo esc_attr( $enweby_fb_video_background_position );
                        ?> ; }
							#page{position:relative;z-index:99999;}
						</style>
						<div class='enweby-fullscreen-video-background-wrapper'>
							<video playsinline autoplay muted loop poster=''>
								<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/webm'>
								<source src='<?php 
                        echo esc_url( $background_video );
                        ?>' type='video/mp4'>
								Your browser does not support the video tag.
							</video>
							</div>
						<?php 
                    }
                }
            }
        }
    }

    /**
     * Setting up fullscreen background - deprecated.
     *
     * @param  array $classes body classes in array.
     * @return array
     */
    public function fullscreen_background_body_classes_deprecated( $classes ) {
        $enweby_fb_display_options = get_option( 'enweby_fb_display_options', 'home' );
        if ( is_front_page() && 'home' === $enweby_fb_display_options ) {
            $classes[] = 'enweby-fullscreen-background';
        }
        if ( 'all' === $enweby_fb_display_options ) {
            $classes[] = 'enweby-fullscreen-background';
        }
        if ( 'post' === $enweby_fb_display_options ) {
            if ( get_the_id() === (int) get_option( 'enweby_fb_post_field_id', '' ) ) {
                $classes[] = 'enweby-fullscreen-background';
            }
        }
        if ( 'page' === $enweby_fb_display_options ) {
            if ( get_the_id() === (int) get_option( 'enweby_fb_page_field_id', '' ) ) {
                $classes[] = 'enweby-fullscreen-background';
            }
        }
        return $classes;
    }

}
