<?php

// phpcs:ignoreFile
/**
 * WordPress Settings Framework
 *
 * @link       https://www.enweby.com/
 * @since      1.0.0
 *
 * @package    Enweby_Variation_Swatches_For_Woocommerce
 * @subpackage Enweby_Variation_Swatches_For_Woocommerce/admin
 */
namespace Enwbfb\Enweby\SettingsFramework;

/**
 * WordPressSettingsFramework class
 */
class WordPressSettingsFramework {
    /**
     * Setting  wrapper var.
     *
     * @access private
     * @var array
     */
    private $settings_wrapper;

    /**
     *
     * Setting  array.
     *
     * @access private
     * @var array
     */
    private $settings;

    /**
     * Tabs array.
     *
     * @access private
     * @var array
     */
    private $tabs;

    /**
     *
     * Option group.
     *
     * @access private
     * @var string
     */
    private $option_group;

    /**
     * Setting array.
     *
     * @access private
     * @var array
     */
    private $settings_page = array();

    /**
     * Option path.
     *
     * @access private
     * @var string
     */
    private $options_path;

    /**
     * Option url.
     *
     * @access private
     * @var string
     */
    private $options_url;

    /**
     *
     * @access protected
     * @var array
     */
    protected $setting_defaults = array(
        'id'          => 'default_field',
        'title'       => 'Default Field',
        'desc'        => '',
        'std'         => '',
        'type'        => 'text',
        'placeholder' => '',
        'choices'     => array(),
        'class'       => '',
        'subfields'   => array(),
    );

    /**
     * WordPressSettingsFramework constructor.
     *
     * @param null|string $settings_file Path to a settings file, or null if you pass the option_group manually and construct your settings with a filter.
     * @param bool|string $option_group  Option group name, usually a short slug.
     */
    public function __construct( $settings_file = null, $option_group = false ) {
        $this->option_group = $option_group;
        if ( $settings_file ) {
            if ( !is_file( $settings_file ) ) {
                return;
            }
            require_once $settings_file;
            if ( !$this->option_group ) {
                $this->option_group = preg_replace( '/[^a-z0-9]+/i', '', basename( $settings_file, '.php' ) );
            }
        }
        if ( empty( $this->option_group ) ) {
            return;
        }
        $this->options_path = plugin_dir_path( __FILE__ );
        $this->options_url = plugin_dir_url( __FILE__ );
        $this->construct_settings();
        if ( is_admin() ) {
            global $pagenow;
            add_action( 'admin_init', array($this, 'admin_init') );
            add_action( 'wpsf_do_settings_sections_' . $this->option_group, array($this, 'do_tabless_settings_sections'), 10 );
            if ( isset( $_GET['page'] ) && $_GET['page'] === $this->settings_page['slug'] ) {
                if ( $pagenow !== 'options-general.php' ) {
                    add_action( 'admin_notices', array($this, 'admin_notices') );
                }
                add_action( 'admin_enqueue_scripts', array($this, 'admin_enqueue_scripts') );
            }
            if ( $this->has_tabs() ) {
                add_action( 'wpsf_before_settings_' . $this->option_group, array($this, 'tab_links') );
                remove_action( 'wpsf_do_settings_sections_' . $this->option_group, array($this, 'do_tabless_settings_sections'), 10 );
                add_action( 'wpsf_do_settings_sections_' . $this->option_group, array($this, 'do_tabbed_settings_sections'), 10 );
            }
            add_action( 'wp_ajax_wpsf_export_settings', array($this, 'export_settings') );
            add_action( 'wp_ajax_wpsf_import_settings', array($this, 'import_settings') );
        }
    }

    /**
     * Construct Settings.
     */
    public function construct_settings() {
        $this->settings_wrapper = apply_filters( 'wpsf_register_settings_' . $this->option_group, array() );
        if ( !is_array( $this->settings_wrapper ) ) {
            return new WP_Error('broke', esc_html__( 'WPSF settings must be an array', 'wpsf' ));
        }
        // If "sections" is set, this settings group probably has tabs.
        if ( isset( $this->settings_wrapper['sections'] ) ) {
            $this->tabs = ( isset( $this->settings_wrapper['tabs'] ) ? $this->settings_wrapper['tabs'] : array() );
            $this->settings = $this->settings_wrapper['sections'];
            // If not, it's probably just an array of settings.
        } else {
            $this->settings = $this->settings_wrapper;
        }
        $this->settings_page['slug'] = sprintf( '%s-settings', str_replace( '_', '-', $this->option_group ) );
    }

    /**
     * Get the option group for this instance.
     *
     * @return string the "option_group"
     */
    public function get_option_group() {
        return $this->option_group;
    }

    /**
     * Registers the internal WordPress settings.
     */
    public function admin_init() {
        register_setting( $this->option_group, $this->option_group . '_settings', array($this, 'settings_validate') );
        $this->process_settings();
    }

    /**
     * Add Settings Page.
     *
     * @param array $args arguments.
     */
    public function add_settings_page( $args ) {
        $defaults = array(
            'parent_slug' => false,
            'page_slug'   => '',
            'page_title'  => '',
            'menu_title'  => '',
            'capability'  => 'manage_options',
        );
        $args = wp_parse_args( $args, $defaults );
        $this->settings_page['title'] = $args['page_title'];
        $this->settings_page['capability'] = $args['capability'];
        if ( $args['parent_slug'] ) {
            add_submenu_page(
                $args['parent_slug'],
                $this->settings_page['title'],
                $args['menu_title'],
                $args['capability'],
                $this->settings_page['slug'],
                array($this, 'settings_page_content')
            );
        } else {
            add_menu_page(
                $this->settings_page['title'],
                $args['menu_title'],
                $args['capability'],
                $this->settings_page['slug'],
                array($this, 'settings_page_content'),
                apply_filters( 'wpsf_menu_icon_url_' . $this->option_group, '' ),
                apply_filters( 'wpsf_menu_position_' . $this->option_group, null )
            );
        }
    }

    /**
     * Settings Page Content.
     */
    public function settings_page_content() {
        if ( !current_user_can( $this->settings_page['capability'] ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'wpsf' ) );
        }
        ?>
			<div class="wpsf-settings wpsf-settings--<?php 
        echo esc_attr( $this->option_group );
        ?>">
			<?php 
        $this->settings_header();
        ?>
				<div class="wpsf-settings__content">
				<?php 
        $this->settings();
        ?>
				</div>
			</div>
			<?php 
    }

    /**
     * Settings Header.
     */
    public function settings_header() {
        ?>
			<div class="wpsf-settings__header">
				<h2><?php 
        echo esc_html( apply_filters( 'wpsf_title_' . $this->option_group, $this->settings_page['title'] ) );
        ?></h2>
			<?php 
        do_action( 'wpsf_after_title_' . $this->option_group );
        ?>
			</div>
			<?php 
    }

    /**
     * Displays any errors from the WordPress settings API.
     */
    public function admin_notices() {
        settings_errors();
    }

    /**
     * Enqueue scripts and styles.
     */
    public function admin_enqueue_scripts() {
        // scripts.
        /*wp_register_script( 'jquery-ui-timepicker', $this->options_url . 'assets/vendor/jquery-timepicker/jquery.ui.timepicker.js', array( 'jquery', 'jquery-ui-core' ), false, true );*/
        /* rf enweby edited */
        wp_register_script(
            'wpsf',
            $this->options_url . 'assets/js/main.js',
            array('jquery'),
            false,
            true
        );
        wp_enqueue_script( 'jquery' );
        wp_enqueue_style( 'wp-color-picker' );
        //uncomment to enable disable this color picker rf enweby edited
        wp_enqueue_script( 'wp-color-picker' );
        //uncomment to enable disable this color picker  rf enweby edited
        //wp_enqueue_script( 'farbtastic' ); //uncomment to enable disaqble this color picker rf enweby edited
        wp_enqueue_script( 'media-upload' );
        wp_enqueue_script( 'thickbox' );
        wp_enqueue_script( 'jquery-ui-core' );
        wp_enqueue_script( 'jquery-ui-datepicker' );
        wp_enqueue_script( 'jquery-ui-timepicker' );
        wp_enqueue_script( 'wpsf' );
        $data = array(
            'select_file'          => esc_html__( 'Please select a file to import', 'wpsf' ),
            'invalid_file'         => esc_html__( 'Invalid file', 'wpsf' ),
            'something_went_wrong' => esc_html__( 'Something went wrong', 'wpsf' ),
        );
        wp_localize_script( 'wpsf', 'wpsf_vars', $data );
        // styles.
        wp_register_style( 'jquery-ui-timepicker', $this->options_url . 'assets/vendor/jquery-timepicker/jquery.ui.timepicker.css' );
        wp_register_style( 'wpsf', $this->options_url . 'assets/css/main.css' );
        // phpcs:ignore
        /*wp_register_style( 'jquery-ui-css', '//ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/themes/ui-darkness/jquery-ui.css' );*/
        /** rf enweby edited **/
        wp_enqueue_style( 'farbtastic' );
        wp_enqueue_style( 'thickbox' );
        wp_enqueue_style( 'jquery-ui-timepicker' );
        wp_enqueue_style( 'jquery-ui-css' );
        wp_enqueue_style( 'wpsf' );
    }

    /**
     * Adds a filter for settings validation.
     *
     * @param  array $input  input array.
     * @return array         filtered array.
     */
    public function settings_validate( $input ) {
        return apply_filters( $this->option_group . '_settings_validate', $input );
    }

    /**
     * Displays the "section_description" if specified in $this->settings.
     *
     * @param array callback args from add_settings_section()
     */
    public function section_intro( $args ) {
        if ( !empty( $this->settings ) ) {
            foreach ( $this->settings as $section ) {
                if ( $section['section_id'] == $args['id'] ) {
                    $renderClass = '';
                    $renderClass .= self::add_show_hide_classes( $section );
                    if ( $renderClass ) {
                        echo '<span class="' . esc_attr( $renderClass ) . '"></span>';
                    }
                    if ( isset( $section['section_description'] ) && $section['section_description'] ) {
                        echo '<div class="wpsf-section-description wpsf-section-description--' . esc_attr( $section['section_id'] ) . '">' . esc_attr( $section['section_description'] ) . '</div>';
                    }
                    break;
                }
            }
        }
    }

    /**
     * Processes $this->settings and adds the sections and fields via the WordPress settings API.
     */
    private function process_settings() {
        if ( !empty( $this->settings ) ) {
            usort( $this->settings, array($this, 'sort_array') );
            foreach ( $this->settings as $section ) {
                if ( isset( $section['section_id'] ) && $section['section_id'] && isset( $section['section_title'] ) ) {
                    $page_name = ( $this->has_tabs() ? sprintf( '%s_%s', $this->option_group, $section['tab_id'] ) : $this->option_group );
                    add_settings_section(
                        $section['section_id'],
                        $section['section_title'],
                        array($this, 'section_intro'),
                        $page_name
                    );
                    if ( isset( $section['fields'] ) && is_array( $section['fields'] ) && !empty( $section['fields'] ) ) {
                        foreach ( $section['fields'] as $field ) {
                            if ( isset( $field['id'] ) && $field['id'] && isset( $field['title'] ) ) {
                                $tooltip = '';
                                if ( isset( $field['link'] ) && is_array( $field['link'] ) ) {
                                    $link_url = ( isset( $field['link']['url'] ) ? esc_html( $field['link']['url'] ) : '' );
                                    $link_text = ( isset( $field['link']['text'] ) ? esc_html( $field['link']['text'] ) : esc_html__( 'Learn More', 'wpsf' ) );
                                    $link_external = ( isset( $field['link']['external'] ) ? (bool) $field['link']['external'] : true );
                                    $link_type = ( isset( $field['link']['type'] ) ? esc_attr( $field['link']['type'] ) : 'tooltip' );
                                    $link_target = ( $link_external ? ' target="_blank"' : '' );
                                    if ( 'tooltip' === $link_type ) {
                                        $link_text = sprintf( '<i class="dashicons dashicons-info wpsf-link-icon" title="%s"><span class="screen-reader-text">%s</span></i>', $link_text, $link_text );
                                    }
                                    $link = ( $link_url ? sprintf(
                                        '<a class="wpsf-link" href="%s"%s>%s</a>',
                                        $link_url,
                                        $link_target,
                                        $link_text
                                    ) : '' );
                                    if ( $link && 'tooltip' === $link_type ) {
                                        $tooltip = $link;
                                    } elseif ( $link ) {
                                        $field['subtitle'] .= ( empty( $field['subtitle'] ) ? $link : sprintf( '<br/><br/>%s', $link ) );
                                    }
                                }
                                $title = ( !empty( $field['subtitle'] ) ? sprintf(
                                    '%s %s<span class="wpsf-subtitle">%s</span>',
                                    $field['title'],
                                    $tooltip,
                                    $field['subtitle']
                                ) : sprintf( '%s %s', $field['title'], $tooltip ) );
                                add_settings_field(
                                    $field['id'],
                                    $title,
                                    array($this, 'generate_setting'),
                                    $page_name,
                                    $section['section_id'],
                                    array(
                                        'section' => $section,
                                        'field'   => $field,
                                        'class'   => $field['id'],
                                    )
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Usort callback. Sorts $this->settings by "section_order".
     *
     * @param array $a Sortable Array.
     * @param array $b Sortable Array.
     *
     * @return array
     */
    public function sort_array( $a, $b ) {
        if ( !isset( $a['section_order'] ) ) {
            return 0;
        }
        return ( $a['section_order'] > $b['section_order'] ? 1 : 0 );
    }

    /**
     * Generates the HTML output of the settings fields.
     *
     * @param array $args callback args from add_settings_field()
     */
    public function generate_setting( $args ) {
        $section = $args['section'];
        $this->setting_defaults = apply_filters( 'wpsf_defaults_' . $this->option_group, $this->setting_defaults );
        $args = wp_parse_args( $args['field'], $this->setting_defaults );
        $options = get_option( $this->option_group . '_settings' );
        $args['id'] = ( $this->has_tabs() ? sprintf(
            '%s_%s_%s',
            $section['tab_id'],
            $section['section_id'],
            $args['id']
        ) : sprintf( '%s_%s', $section['section_id'], $args['id'] ) );
        $args['value'] = ( isset( $options[$args['id']] ) ? $options[$args['id']] : (( isset( $args['default'] ) ? $args['default'] : '' )) );
        $args['name'] = $this->generate_field_name( $args['id'] );
        $args['class'] .= self::add_show_hide_classes( $args );
        do_action( 'wpsf_before_field_' . $this->option_group );
        do_action( 'wpsf_before_field_' . $this->option_group . '_' . $args['id'] );
        $this->do_field_method( $args );
        do_action( 'wpsf_after_field_' . $this->option_group );
        do_action( 'wpsf_after_field_' . $this->option_group . '_' . $args['id'] );
    }

    /**
     * Do field method, if it exists.
     *
     * @param array $args
     */
    public function do_field_method( $args ) {
        $generate_field_method = sprintf( 'generate_%s_field', $args['type'] );
        if ( method_exists( $this, $generate_field_method ) ) {
            $this->{$generate_field_method}( $args );
        }
    }

    /**
     * Displays a pages select box. rf Enweby Custom function added.
     *
     * @param array $args settings field args
     */
    function generate_pages_field( $args ) {
        $css_classes = $args['class'];
        $dropdown_args = array(
            'selected'         => $args['value'],
            'name'             => $args['name'],
            'id'               => $args['id'],
            'echo'             => 1,
            'show_option_none' => '-- ' . __( 'Select Page' ) . ' --',
            'class'            => 'regular-text ' . esc_attr( $args['class'] ) . '',
        );
        return wp_dropdown_pages( $dropdown_args );
    }

    /**
     * Retreiving all posts. rf Enweby function.
     */
    function get_available_posts() {
        $default_args = array(
            'post_type'   => 'post',
            'numberposts' => -1,
        );
        $posts_args = wp_parse_args( $default_args );
        $posts = get_posts( $posts_args );
        $options = array(
            '' => '-- ' . __( 'Select Post' ) . ' --',
        );
        foreach ( $posts as $post ) {
            setup_postdata( $post );
            $options[$post->ID] = esc_html( $post->post_title );
            wp_reset_postdata();
        }
        // free memory
        unset($posts, $posts_args, $default_args);
        //$this->callback_select( $args );
        return $options;
    }

    /**
     * Display pages dropdown. rf Enweby function.
     *
     */
    function get_dropdown_posts(
        $name,
        $id,
        $class,
        $selected_page
    ) {
        $all_posts = $this->get_available_posts();
        $slected_page_value = $selected_page;
        ?>
		<select id='<?php 
        echo $id;
        ?>' name='<?php 
        echo $name;
        ?>' class='<?php 
        echo $class;
        ?>' >
		<?php 
        foreach ( $all_posts as $key => $label ) {
            ?>
		<option value='<?php 
            echo $key;
            ?>' <?php 
            selected( $slected_page_value, $key );
            ?> ><?php 
            echo $label;
            ?></option>
		<?php 
        }
        ?>
		</select>
		<?php 
    }

    /**
     * Displays a post select box. rf Enweby Custom function added.
     *
     * @param array $args settings field args
     */
    function generate_posts_field( $args ) {
        return $this->get_dropdown_posts(
            $args['name'],
            $args['id'],
            'regular-text ' . esc_attr( $args['class'] ) . '',
            $args['value']
        );
    }

    /**
     * Generate: Text field.
     *
     * @param array $args
     */
    public function generate_text_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        echo '<input type="text" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" class="regular-text ' . esc_attr( $args['class'] ) . '" />';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Hidden field.
     *
     * @param array $args
     */
    public function generate_hidden_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        echo '<input type="hidden" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '"  class="hidden-field ' . esc_attr( $args['class'] ) . '" />';
    }

    /**
     * Generate: Number field.
     *
     * @param array $args
     */
    public function generate_number_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        echo '<input type="number" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" class="regular-text ' . esc_attr( $args['class'] ) . '" />';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Time field.
     *
     * @param array $args
     */
    public function generate_time_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $timepicker = ( !empty( $args['timepicker'] ) ? htmlentities( json_encode( $args['timepicker'] ) ) : null );
        echo '<input type="text" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '" class="timepicker regular-text ' . esc_attr( $args['class'] ) . '" data-timepicker="' . esc_attr( $timepicker ) . '" />';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Date field.
     *
     * @param array $args
     */
    public function generate_date_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $datepicker = ( !empty( $args['datepicker'] ) ? htmlentities( json_encode( $args['datepicker'] ) ) : null );
        echo '<input type="text" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '" class="datepicker regular-text ' . esc_attr( $args['class'] ) . '" data-datepicker="' . esc_attr( $datepicker ) . '" />';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate Export Field.
     *
     * @param array $args Arguments.
     */
    public function generate_export_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $args['value'] = ( empty( $args['value'] ) ? esc_html__( 'Export Settings', 'wpsf' ) : $args['value'] );
        $option_group = $this->option_group;
        $export_url = site_url() . '/wp-admin/admin-ajax.php?action=wpsf_export_settings&_wpnonce=' . wp_create_nonce( 'wpsf_export_settings' ) . '&option_group=' . $option_group;
        echo '<a target=_blank href="' . esc_url( $export_url ) . '" class="button" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '">' . esc_attr( $args['value'] ) . '</a>';
        $options = get_option( $option_group . '_settings' );
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate Import Field.
     *
     * @param array $args Arguments.
     */
    public function generate_import_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $args['value'] = ( empty( $args['value'] ) ? esc_html__( 'Import Settings', 'wpsf' ) : $args['value'] );
        $option_group = $this->option_group;
        echo sprintf(
            '
				<div class="wpsf-import">
					<div class="wpsf-import__false_btn">
						<input type="file" name="wpsf-import-field" class="wpsf-import__file_field" id="%s" accept=".json"/>
						<button type="button" name="wpsf_import_button" class="button wpsf-import__button" id="%s">%s</button>
						<input type="hidden" class="wpsf_import_nonce" value="%s"></input>
						<input type="hidden" class="wpsf_import_option_group" value="%s"></input>
					</div>
					<span class="spinner"></span>
				</div>',
            esc_attr( $args['id'] ),
            esc_attr( $args['id'] ),
            esc_attr( $args['value'] ),
            esc_attr( wp_create_nonce( 'wpsf_import_settings' ) ),
            esc_attr( $this->option_group )
        );
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Group field.
     *
     * Generates a table of subfields, and a javascript template for create new repeatable rows.
     *
     * @param array $args
     */
    public function generate_group_field( $args ) {
        $value = (array) $args['value'];
        $row_count = ( !empty( $value ) ? count( $value ) : 1 );
        echo '<table class="widefat wpsf-group" cellspacing="0">';
        echo '<tbody>';
        for ($row = 0; $row < $row_count; $row++) {
            echo wp_kses( $this->generate_group_row_template( $args, false, $row ) );
        }
        echo '</tbody>';
        echo '</table>';
        printf( '<script type="text/html" id="%s_template">%s</script>', esc_attr( $args['id'] ), wp_kses( $this->generate_group_row_template( $args, true ) ) );
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate Image Checkboxes.
     *
     * @param array $args Arguments.
     *
     * @return void
     */
    public function generate_image_checkboxes_field( $args ) {
        echo '<input type="hidden" name="' . esc_attr( $args['name'] ) . '" value="0" />';
        echo '<ul class="wpsf-visual-field wpsf-visual-field--image-checkboxes wpsf-visual-field--grid wpsf-visual-field--cols">';
        foreach ( $args['choices'] as $value => $choice ) {
            $field_id = sprintf( '%s_%s', $args['id'], $value );
            $is_checked = is_array( $args['value'] ) && in_array( $value, $args['value'] );
            $checked_class = ( $is_checked ? 'wpsf-visual-field__item--checked' : '' );
            echo sprintf(
                '<li class="wpsf-visual-field__item %s">
						<label>
							<div class="wpsf-visual-field-image-radio__img_wrap">
								<img src="%s">
							</div>
							<div class="wpsf-visual-field__item-footer">
								<input type="checkbox" name="%s[]" id="%s" value="%s" class="%s" %s>
								<span class="wpsf-visual-field__item-text">%s</span>
							</div>
						</label>
					</li>',
                esc_attr( $checked_class ),
                esc_url( $choice['image'] ),
                esc_attr( $args['name'] ),
                esc_attr( $field_id ),
                esc_attr( $value ),
                esc_attr( $args['class'] ),
                checked( true, $is_checked, false ),
                esc_attr( $choice['text'] )
            );
        }
        echo '</ul>';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Image Radio field
     *
     * @param array $args Arguments.
     */
    public function generate_image_radio_field( $args ) {
        $args['value'] = esc_html( esc_attr( $args['value'] ) );
        $count = count( $args['choices'] );
        echo sprintf( '<ul class="wpsf-visual-field wpsf-visual-field--image-radio wpsf-visual-field--grid wpsf-visual-field--cols wpsf-visual-field--col-%s ">', esc_attr( $count ) );
        foreach ( $args['choices'] as $value => $choice ) {
            $field_id = sprintf( '%s_%s', $args['id'], $value );
            $checked = ( $value == $args['value'] ? 'checked="checked"' : '' );
            // phpcs:ignore
            echo sprintf(
                '<li class="wpsf-visual-field__item %s">				
						<label>
							<div class="wpsf-visual-field-image-radio__img_wrap">
								<img src="%s">
							</div>
							<div class="wpsf-visual-field__item-footer">
								<input type="radio" name="%s" id="%s" value="%s" class="%s" %s>
								<span class="wpsf-visual-field__item-text">%s</span>
							</div>
						</label>
					</li>',
                ( $checked ? 'wpsf-visual-field__item--checked' : '' ),
                esc_attr( $choice['image'] ),
                esc_attr( $args['name'] ),
                esc_attr( $field_id ),
                esc_attr( $value ),
                esc_attr( $args['class'] ),
                esc_attr( $checked ),
                esc_attr( $choice['text'] )
            );
        }
        echo '</ul>';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate group row template
     *
     * @param array $args  Field arguments.
     * @param bool  $blank Blank values.
     * @param int   $row   Iterator.
     *
     * @return string|bool
     */
    public function generate_group_row_template( $args, $blank = false, $row = 0 ) {
        $row_template = false;
        $row_id = ( !empty( $args['value'][$row]['row_id'] ) ? $args['value'][$row]['row_id'] : $row );
        $row_id_value = ( $blank ? '' : $row_id );
        if ( $args['subfields'] ) {
            $row_class = ( $row % 2 == 0 ? 'alternate' : '' );
            // phpcs:ignore
            $row_template .= sprintf( '<tr class="wpsf-group__row %s">', $row_class );
            $row_template .= sprintf( '<td class="wpsf-group__row-index"><span>%d</span></td>', $row );
            $row_template .= '<td class="wpsf-group__row-fields">';
            $row_template .= '<input type="hidden" class="wpsf-group__row-id" name="' . sprintf( '%s[%d][row_id]', esc_attr( $args['name'] ), esc_attr( $row ) ) . '" value="' . esc_attr( $row_id_value ) . '" />';
            foreach ( $args['subfields'] as $subfield ) {
                $subfield = wp_parse_args( $subfield, $this->setting_defaults );
                $subfield['value'] = ( $blank ? '' : (( isset( $args['value'][$row][$subfield['id']] ) ? $args['value'][$row][$subfield['id']] : '' )) );
                $subfield['name'] = sprintf(
                    '%s[%d][%s]',
                    $args['name'],
                    $row,
                    $subfield['id']
                );
                $subfield['id'] = sprintf(
                    '%s_%d_%s',
                    $args['id'],
                    $row,
                    $subfield['id']
                );
                $class = sprintf( 'wpsf-group__field-wrapper--%s', $subfield['type'] );
                $row_template .= sprintf( '<div class="wpsf-group__field-wrapper %s">', $class );
                $row_template .= sprintf( '<label for="%s" class="wpsf-group__field-label">%s</label>', $subfield['id'], $subfield['title'] );
                ob_start();
                $this->do_field_method( $subfield );
                $row_template .= ob_get_clean();
                $row_template .= '</div>';
            }
            $row_template .= '</td>';
            $row_template .= '<td class="wpsf-group__row-actions">';
            $row_template .= sprintf( '<a href="javascript: void(0);" class="wpsf-group__row-add" data-template="%s_template"><span class="dashicons dashicons-plus-alt"></span></a>', $args['id'] );
            $row_template .= '<a href="javascript: void(0);" class="wpsf-group__row-remove"><span class="dashicons dashicons-trash"></span></a>';
            $row_template .= '</td>';
            $row_template .= '</tr>';
        }
        return $row_template;
    }

    /**
     * Generate: Select field.
     *
     * @param array $args Arguments.
     */
    public function generate_select_field( $args ) {
        $args['value'] = esc_html( esc_attr( $args['value'] ) );
        echo '<select name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( $args['class'] ) . '">';
        foreach ( $args['choices'] as $value => $text ) {
            if ( is_array( $text ) ) {
                echo sprintf( '<optgroup label="%s">', esc_html( $value ) );
                foreach ( $text as $group_value => $group_text ) {
                    $selected = ( $group_value === $args['value'] ? 'selected="selected"' : '' );
                    echo sprintf(
                        '<option value="%s" %s>%s</option>',
                        esc_attr( $group_value ),
                        esc_html( $selected ),
                        esc_html( $group_text )
                    );
                }
                echo '</optgroup>';
                continue;
            }
            $selected = ( strval( $value ) === $args['value'] ? 'selected="selected"' : '' );
            echo sprintf(
                '<option value="%s" %s>%s</option>',
                esc_attr( $value ),
                esc_html( $selected ),
                esc_html( $text )
            );
        }
        echo '</select>';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Password field.
     *
     * @param array $args
     */
    public function generate_password_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        echo '<input type="password" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . esc_attr( $args['value'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" class="regular-text ' . esc_attr( $args['class'] ) . '" />';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Textarea field.
     *
     * @param array $args
     */
    public function generate_textarea_field( $args ) {
        $args['value'] = esc_html( esc_attr( $args['value'] ) );
        echo '<textarea name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" rows="5" cols="60" class="' . esc_attr( $args['class'] ) . '">' . esc_html( $args['value'] ) . '</textarea>';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Radio field.
     *
     * @param array $args
     */
    public function generate_radio_field( $args ) {
        $args['value'] = esc_html( esc_attr( $args['value'] ) );
        foreach ( $args['choices'] as $value => $text ) {
            $field_id = sprintf( '%s_%s', $args['id'], $value );
            $checked = ( $value == $args['value'] ? 'checked="checked"' : '' );
            echo sprintf(
                '<label><input type="radio" name="%s" id="%s" value="%s" class="%s" %s> %s</label><br />',
                esc_attr( $args['name'] ),
                esc_attr( $field_id ),
                esc_attr( $value ),
                esc_attr( $args['class'] ),
                esc_attr( $checked ),
                esc_attr( $text )
            );
        }
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Checkbox field.
     *
     * @param array $args
     */
    public function generate_checkbox_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $checked = ( $args['value'] ? 'checked="checked"' : '' );
        echo '<input type="hidden" name="' . esc_attr( $args['name'] ) . '" value="0" />';
        echo '<label><input type="checkbox" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="1" class="' . esc_attr( $args['class'] ) . '" ' . esc_attr( $checked ) . '> ' . esc_attr( $args['desc'] ) . '</label>';
    }

    /**
     * Generate: Toggle field.
     *
     * @param array $args
     */
    public function generate_toggle_field( $args ) {
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        $checked = ( $args['value'] ? 'checked="checked"' : '' );
        echo '<input type="hidden" name="' . esc_attr( $args['name'] ) . '" value="0" />';
        echo '<label class="switch"><input type="checkbox" name="' . esc_attr( $args['name'] ) . '" id="' . esc_attr( $args['id'] ) . '" value="1" class="' . esc_attr( $args['class'] ) . '" ' . esc_attr( $checked ) . '> ' . esc_html( $args['desc'] ) . '<span class="slider"></span></label>';
    }

    /**
     * Generate: Checkboxes field.
     *
     * @param array $args
     */
    public function generate_checkboxes_field( $args ) {
        echo '<input type="hidden" name="' . esc_attr( $args['name'] ) . '" value="0" />';
        echo '<ul class="wpsf-list wpsf-list--checkboxes">';
        foreach ( $args['choices'] as $value => $text ) {
            $checked = ( is_array( $args['value'] ) && in_array( strval( $value ), array_map( 'strval', $args['value'] ), true ) ? 'checked="checked"' : '' );
            $field_id = sprintf( '%s_%s', $args['id'], $value );
            echo sprintf(
                '<li><label><input type="checkbox" name="%s[]" id="%s" value="%s" class="%s" %s> %s</label></li>',
                esc_attr( $args['name'] ),
                esc_attr( $field_id ),
                esc_attr( $value ),
                esc_attr( $args['class'] ),
                esc_attr( $checked ),
                esc_html( $text )
            );
        }
        echo '</ul>';
        $this->generate_description( esc_html( $args['desc'] ) );
    }

    /**
     * Generate: Color field. farbtastic color picker. rf enweby edited commented . 
     *
     * @param array $args
     */
    /*public function generate_color_field( $args ) {
    		$color_picker_id = sprintf( '%s_cp', $args['id'] );
    		$args['value']   = esc_attr( stripslashes( $args['value'] ) );
    
    		echo '<div style="position:relative;">';
    
    		echo sprintf( '<input type="text" name="%s" id="%s" value="%s" class="%s">', esc_attr( $args['name'] ), esc_attr( $args['id'] ), esc_attr( $args['value'] ), esc_attr( $args['class'] ) );
    
    		echo sprintf( '<div id="%s" style="position:absolute;top:0;left:190px;background:#fff;z-index:9999;"></div>', esc_attr( $color_picker_id ) );
    
    		$this->generate_description( esc_html( $args['desc'] ) );
    
    		echo '<script type="text/javascript">
                    jQuery(document).ready(function($){
                        var colorPicker = $("#' . esc_attr( $color_picker_id ) . '");
                        colorPicker.farbtastic("#' . esc_attr( $args['id'] ) . '");
                        colorPicker.hide();
                        $("#' . esc_attr( $args['id'] ) . '").on("focus", function(){
                            colorPicker.show();
                        });
                        $("#' . ( esc_attr( $args['id'] ) ) . '").on("blur", function(){
                            colorPicker.hide();
                            if($(this).val() == "") $(this).val("#");
                        });
                    });
                    </script>';
    
    		echo '</div>';
    	}*/
    /**
     * Generate: Color Picker field rf Enweby function.
     *
     * @param array $args
     */
    public function generate_color_field( $args ) {
        $color_picker_id = sprintf( '%s_cp', $args['id'] );
        $args['value'] = esc_attr( stripslashes( $args['value'] ) );
        /* echo sprintf( '<input type="text" class="%1$s-text wp-color-picker-field" data-alpha="true" id="%2$s[%3$s]" name="%6$s" value="%4$s" data-default-color="%5$s" />', $args['id'], $args['value'], $args['default'], $args['name'] );*/
        echo '<div style="position:relative;">';
        echo sprintf(
            '<input type="text" name="%s" id="%s" value="%s" class="%s wp-color-picker-field" data-alpha="true" data-default-color="#fff">',
            $args['name'],
            $args['id'],
            $args['value'],
            $args['class']
        );
        /* echo sprintf( '<div id="%s" style="position:absolute;top:0;left:190px;background:#fff;z-index:9999;"></div>', $color_picker_id );*/
        $this->generate_description( $args['desc'] );
        echo '<script type="text/javascript">
			jQuery(document).ready(function($){
			  if ($(".wp-color-picker-field").length > 0) {
					$(".wp-color-picker-field").wpColorPicker();
				}
				
			});
			</script>';
        echo '</div>';
    }

    /**
     * Generate: image field.
     *
     * @param array $args
     */
    public function generate_image_field( $args ) {
        if ( enwbfb_fs()->is_free_plan() ) {
            $args['value'] = esc_attr( $args['value'] );
            $button_id = sprintf( '%s_button', esc_attr( $args['id'] ) );
            $img_preview_class = ( '' != $args['value'] ? 'fb_image_preview' : 'no-image-preview' );
            echo sprintf(
                '<input style="float:left; margin:0 5px; display:none;" type="text" name="%s" id="%s" value="%s" class="regular-text %s">',
                esc_attr( $args['name'] ),
                esc_attr( $args['id'] ),
                esc_attr( $args['value'] ),
                esc_attr( $args['class'] )
            );
            echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Upload Image" />', esc_attr( $button_id ) );
            $args_val_exploaded = explode( ',', $args['value'] );
            //print_r($args_val_exploaded);
            if ( !is_numeric( $args_val_exploaded[0] ) ) {
                $args_value = $args['value'];
            } else {
                $args_value = '';
            }
            if ( '' != $args['value'] ) {
                echo sprintf( '<img class="' . $img_preview_class . '" style="float:left; margin:0 5px;width:120px;" src="' . $args_value . '" id="img_preview_%s" /><span title="remove" rel="' . esc_attr( $args['id'] ) . '" class="img-remove-global-single">X</span> ', esc_attr( $button_id ) );
                // enweby edited
            } else {
                echo sprintf( '<img class="' . $img_preview_class . '" style="float:left; margin:0 5px;width:120px;" src="' . $args_value . '" id="img_preview_%s" />', esc_attr( $button_id ) );
                // enweby edited
            }
            ?>
			<script type='text/javascript'>
				jQuery( document ).ready( function( $ ) {

					// Uploading files
					var file_frame;
					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
					var set_to_post_id = 0;

					jQuery( document.body ).on('click', '#<?php 
            echo esc_attr( $button_id );
            ?>', function( event ){

						event.preventDefault();

						// If the media frame already exists, reopen it.
						if ( file_frame ) {
							// Set the post ID to what we want
							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
							// Open frame
							file_frame.open();
							return;
						} else {
							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
							wp.media.model.settings.post.id = set_to_post_id;
						}

						// Create the media frame.
						file_frame = wp.media.frames.file_frame = wp.media({
							title: '<?php 
            echo esc_html__( 'Select a image to upload', 'wpsf' );
            ?>',
							/*button: {
								text: '<?php 
            echo esc_html__( 'Use this image', 'wpsf' );
            ?>',
							},*/
							library : { type : 'image'},
							multiple: false	// Set to true to allow multiple files to be selected
						});

						// When an image is selected, run a callback.
						file_frame.on( 'select', function() {
							// We set multiple to false so only get one image from the uploader
							attachment = file_frame.state().get('selection').first().toJSON();

							// Do something with attachment.id and/or attachment.url here
							$( '#img_preview_<?php 
            echo esc_attr( $button_id );
            ?>' ).attr( 'src', attachment.url ).css( 'width', '90' ); // enweby edited
							$(".img-remove-global-single").remove();
							$( '#img_preview_<?php 
            echo esc_attr( $button_id );
            ?>' ).after( "<span rel='<?php 
            echo esc_attr( $args['id'] );
            ?>' class='img-remove-global-single'>X</span>" ); // enweby edited
							$( '#image_attachment_id' ).val( attachment.id );
							$( '#<?php 
            echo esc_attr( $args['id'] );
            ?>' ).val( attachment.url );
							
							$( '#img_preview_<?php 
            echo esc_attr( $button_id );
            ?>' ).removeClass('no-image-preview');
							// Restore the main post ID
							wp.media.model.settings.post.id = wp_media_post_id;
						});

						// Finally, open the modal
						file_frame.open();
					});

					// Restore the main ID when the add media button is pressed
					jQuery( 'a.add_media' ).on( 'click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
				</script>
			<?php 
        }
    }

    /**
     * Generate: file field.
     *
     * @param array $args
     */
    public function generate_file_field( $args ) {
        if ( enwbfb_fs()->is_free_plan() ) {
            $args['value'] = esc_attr( $args['value'] );
            $button_id = sprintf( '%s_button', esc_attr( $args['id'] ) );
            $img_preview_class = ( '' != $args['value'] ? 'fb_image_preview' : 'no-image-preview' );
            $args_val_exploaded = explode( ',', $args['value'] );
            if ( !is_numeric( $args_val_exploaded[0] ) ) {
                $args_value = $args['value'];
            } else {
                $args_value = '';
            }
            echo sprintf(
                '<input style="float:left; margin:0 5px;" type="text" name="%s" id="%s" value="%s" class="regular-text %s"> ',
                esc_attr( $args['name'] ),
                esc_attr( $args['id'] ),
                esc_attr( $args_value ),
                esc_attr( $args['class'] )
            );
            if ( '' != $args['value'] ) {
                echo sprintf( '<span rel="' . esc_attr( $args['id'] ) . '" title="remove" class="vid-remove-global-single">X</span><input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Upload Video" />', esc_attr( $button_id ) );
            } else {
                echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Upload Video" />', esc_attr( $button_id ) );
            }
            ?>
			<script type='text/javascript'>
				jQuery( document ).ready( function( $ ) {

					// Uploading files
					var file_frame;
					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
					var set_to_post_id = 0;

					jQuery( document.body ).on('click', '#<?php 
            echo esc_attr( $button_id );
            ?>', function( event ){

						event.preventDefault();

						// If the media frame already exists, reopen it.
						if ( file_frame ) {
							// Set the post ID to what we want
							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
							// Open frame
							file_frame.open();
							return;
						} else {
							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
							wp.media.model.settings.post.id = set_to_post_id;
						}

						// Create the media frame.
						file_frame = wp.media.frames.file_frame = wp.media({
							title: '<?php 
            echo esc_html__( 'Select Video to upload', 'wpsf' );
            ?>',
							/*button: {
								text: '<?php 
            echo esc_html__( 'Use this video', 'wpsf' );
            ?>',
							},*/
							library : { type : 'video'},
							multiple: false	// Set to true to allow multiple files to be selected
						});

						// When an image is selected, run a callback.
						file_frame.on( 'select', function() {
							// We set multiple to false so only get one image from the uploader
							attachment = file_frame.state().get('selection').first().toJSON();

							// Do something with attachment.id and/or attachment.url here
							
							$( '#image_attachment_id' ).val( attachment.id );
							$( '#<?php 
            echo esc_attr( $args['id'] );
            ?>' ).val( attachment.url );
							$(".vid-remove-global-single").remove();
							$( '#<?php 
            echo esc_attr( $args['id'] );
            ?>' ).after( "<span rel='<?php 
            echo esc_attr( $args['id'] );
            ?>' class='vid-remove-global-single'>X</span>" ); // enweby edited
							// Restore the main post ID
							wp.media.model.settings.post.id = wp_media_post_id;
						});

						// Finally, open the modal
						file_frame.open();
					});

					// Restore the main ID when the add media button is pressed
					jQuery( 'a.add_media' ).on( 'click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
				</script>
			<?php 
        }
    }

    /**
     * Generate: File field.
     *
     * @param array $args
     */
    /*public function generate_file_field_2( $args ) {
    		if ( enwbfb_fs()->is_free_plan() ) {
    		$args['value'] = esc_attr( $args['value'] );
    		$button_id     = sprintf( '%s_button', esc_attr( $args['id'] ) );
    
    		echo sprintf( '<input style="float:left; margin:0 5px;" type="text" name="%s" id="%s" value="%s" class="regular-text %s"> ', esc_attr( $args['name'] ), esc_attr( $args['id'] ), esc_attr( $args['value'] ), esc_attr( $args['class'] ) );
    
    		echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Browse" />', esc_attr( $button_id ) );
    	
    		?>
    			<script type='text/javascript'>
    				jQuery( document ).ready( function( $ ) {
    
    					// Uploading files
    					var file_frame;
    					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
    					var set_to_post_id = 0;
    
    					jQuery( document.body ).on('click', '#<?php echo esc_attr( $button_id ); ?>', function( event ){
    
    						event.preventDefault();
    					
    						// If the media frame already exists, reopen it.
    						if ( file_frame ) {
    							// Set the post ID to what we want
    							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
    							// Open frame
    							file_frame.open();
    							return;
    						} else {
    							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
    							wp.media.model.settings.post.id = set_to_post_id;
    						}
    
    						// Create the media frame.
    						file_frame = wp.media.frames.file_frame = wp.media({
    							title: '<?php echo esc_html__( 'Select a file to upload', 'wpsf' ); ?>',
    							button: {
    								text: '<?php echo esc_html__( 'Use this file', 'wpsf' ); ?>',
    							},
    							library : { type : 'video'},
    							multiple: false	// Set to true to allow multiple files to be selected
    						});
    
    						// When an image is selected, run a callback.
    						file_frame.on( 'select', function() {
    							// We set multiple to false so only get one image from the uploader
    							attachment = file_frame.state().get('selection').first().toJSON();
    
    							// Do something with attachment.id and/or attachment.url here
    							$( '#img_preview_<?php echo esc_attr( $button_id ); ?>' ).attr( 'src', attachment.url ).css( 'width', 'auto' ); // enweby edited
    							$( '#image_attachment_id' ).val( attachment.id );
    							$( '#<?php echo esc_attr( $args['id'] ); ?>' ).val( attachment.url );
    							
    							// Restore the main post ID
    							wp.media.model.settings.post.id = wp_media_post_id;
    						});
    
    						// Finally, open the modal
    						file_frame.open();
    					});
    
    					// Restore the main ID when the add media button is pressed
    					jQuery( 'a.add_media' ).on( 'click', function() {
    						wp.media.model.settings.post.id = wp_media_post_id;
    					});
    				});
    				</script>
    			<?php
    		}
    		
    		if ( enwbfb_fs()->can_use_premium_code__premium_only() ) {
    
    		$args['value'] = esc_attr( $args['value'] );
    		$button_id     = sprintf( '%s_button', esc_attr( $args['id'] ) );
    
    		echo sprintf( '<input style="float:left; margin:0 5px;" type="text" name="%s" id="%s" value="%s" class="regular-text %s"> ', esc_attr( $args['name'] ), esc_attr( $args['id'] ), esc_attr( $args['value'] ), esc_attr( $args['class'] ) );
    
    		echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Browse" />', esc_attr( $button_id ) );
    	
    		?>
    			<script type='text/javascript'>
    				jQuery( document ).ready( function( $ ) {
    
    					// Uploading files
    					var file_frame;
    					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
    					var set_to_post_id = 0;
    
    					jQuery( document.body ).on('click', '#<?php echo esc_attr( $button_id ); ?>', function( event ){
    
    						event.preventDefault();
    						var allow_multiple_file = ( 'undefined' !==  typeof enwbfb_config_var && 1 == enwbfb_config_var.enwbfb_multi_upload ) ? true : false;
    						// If the media frame already exists, reopen it.
    						if ( file_frame ) {
    							// Set the post ID to what we want
    							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
    							// Open frame
    							file_frame.open();
    							return;
    						} else {
    							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
    							wp.media.model.settings.post.id = set_to_post_id;
    						}
    
    						// Create the media frame.
    						file_frame = wp.media.frames.file_frame = wp.media({
    							title: '<?php echo esc_html__( 'Select a file to upload', 'wpsf' ); ?>',
    							button: {
    								text: '<?php echo esc_html__( 'Use this file', 'wpsf' ); ?>',
    							},
    							library : { type : 'video'},
    							multiple: allow_multiple_file	// Set to true to allow multiple files to be selected
    						});
    
    						// When an image is selected, run a callback.
    						file_frame.on( 'select', function() {
    							// We set multiple to false so only get one image from the uploader
    							attachment = file_frame.state().get('selection').first().toJSON();
    
    							// Do something with attachment.id and/or attachment.url here
    							$( '#img_preview_<?php echo esc_attr( $button_id ); ?>' ).attr( 'src', attachment.url ).css( 'width', 'auto' ); // enweby edited
    							$( '#image_attachment_id' ).val( attachment.id );
    							$( '#<?php echo esc_attr( $args['id'] ); ?>' ).val( attachment.url );
    							
    							// Restore the main post ID
    							wp.media.model.settings.post.id = wp_media_post_id;
    						});
    
    						// Finally, open the modal
    						file_frame.open();
    					});
    
    					// Restore the main ID when the add media button is pressed
    					jQuery( 'a.add_media' ).on( 'click', function() {
    						wp.media.model.settings.post.id = wp_media_post_id;
    					});
    				});
    				</script>
    			<?php
    		}
    		
    	}*/
    /**
     * Generate: image field.
     *
     * @param array $args
     */
    public function generate_image_field_deprecated( $args ) {
        $args['value'] = esc_attr( $args['value'] );
        $button_id = sprintf( '%s_button', esc_attr( $args['id'] ) );
        $img_preview_class = ( '' != $args['value'] ? 'fb_image_preview' : 'no-image-preview' );
        echo sprintf(
            '<input style="float:left; margin:0 5px;" type="text" name="%s" id="%s" value="%s" class="regular-text %s"> ',
            esc_attr( $args['name'] ),
            esc_attr( $args['id'] ),
            esc_attr( $args['value'] ),
            esc_attr( $args['class'] )
        );
        echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Browse" />', esc_attr( $button_id ) );
        echo sprintf( '<img class="' . $img_preview_class . '" style="float:left; margin:0 5px;width:90px;" src="' . $args['value'] . '" id="img_preview_%s" />', esc_attr( $button_id ) );
        // enweby edited
        ?>
			<script type='text/javascript'>
				jQuery( document ).ready( function( $ ) {

					// Uploading files
					var file_frame;
					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
					var set_to_post_id = 0;

					jQuery( document.body ).on('click', '#<?php 
        echo esc_attr( $button_id );
        ?>', function( event ){

						event.preventDefault();

						// If the media frame already exists, reopen it.
						if ( file_frame ) {
							// Set the post ID to what we want
							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
							// Open frame
							file_frame.open();
							return;
						} else {
							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
							wp.media.model.settings.post.id = set_to_post_id;
						}

						// Create the media frame.
						file_frame = wp.media.frames.file_frame = wp.media({
							title: '<?php 
        echo esc_html__( 'Select a image to upload', 'wpsf' );
        ?>',
							button: {
								text: '<?php 
        echo esc_html__( 'Use this image', 'wpsf' );
        ?>',
							},
							multiple: false	// Set to true to allow multiple files to be selected
						});

						// When an image is selected, run a callback.
						file_frame.on( 'select', function() {
							// We set multiple to false so only get one image from the uploader
							attachment = file_frame.state().get('selection').first().toJSON();

							// Do something with attachment.id and/or attachment.url here
							$( '#img_preview_<?php 
        echo esc_attr( $button_id );
        ?>' ).attr( 'src', attachment.url ).css( 'width', '90' ); // enweby edited
							$( '#image_attachment_id' ).val( attachment.id );
							$( '#<?php 
        echo esc_attr( $args['id'] );
        ?>' ).val( attachment.url );
							
							$( '#img_preview_<?php 
        echo esc_attr( $button_id );
        ?>' ).removeClass('no-image-preview');
							// Restore the main post ID
							wp.media.model.settings.post.id = wp_media_post_id;
						});

						// Finally, open the modal
						file_frame.open();
					});

					// Restore the main ID when the add media button is pressed
					jQuery( 'a.add_media' ).on( 'click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
				</script>
			<?php 
    }

    /**
     * Generate: File field.
     *
     * @param array $args
     */
    public function generate_file_field_deprecated( $args ) {
        $args['value'] = esc_attr( $args['value'] );
        $button_id = sprintf( '%s_button', esc_attr( $args['id'] ) );
        echo sprintf(
            '<input style="float:left; margin:0 5px;" type="text" name="%s" id="%s" value="%s" class="regular-text %s"> ',
            esc_attr( $args['name'] ),
            esc_attr( $args['id'] ),
            esc_attr( $args['value'] ),
            esc_attr( $args['class'] )
        );
        echo sprintf( '<input style="float:left; margin:0 5px;" type="button" class="button wpsf-browse" id="%s" value="Browse" />', esc_attr( $button_id ) );
        ?>
			<script type='text/javascript'>
				jQuery( document ).ready( function( $ ) {

					// Uploading files
					var file_frame;
					var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id.
					var set_to_post_id = 0;

					jQuery( document.body ).on('click', '#<?php 
        echo esc_attr( $button_id );
        ?>', function( event ){

						event.preventDefault();

						// If the media frame already exists, reopen it.
						if ( file_frame ) {
							// Set the post ID to what we want
							file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
							// Open frame
							file_frame.open();
							return;
						} else {
							// Set the wp.media post id so the uploader grabs the ID we want when initialised.
							wp.media.model.settings.post.id = set_to_post_id;
						}

						// Create the media frame.
						file_frame = wp.media.frames.file_frame = wp.media({
							title: '<?php 
        echo esc_html__( 'Select a file to upload', 'wpsf' );
        ?>',
							button: {
								text: '<?php 
        echo esc_html__( 'Use this file', 'wpsf' );
        ?>',
							},
							library : { type : 'video'},
							multiple: false	// Set to true to allow multiple files to be selected
						});

						// When an image is selected, run a callback.
						file_frame.on( 'select', function() {
							// We set multiple to false so only get one image from the uploader
							attachment = file_frame.state().get('selection').first().toJSON();

							// Do something with attachment.id and/or attachment.url here
							$( '#img_preview_<?php 
        echo esc_attr( $button_id );
        ?>' ).attr( 'src', attachment.url ).css( 'width', 'auto' ); // enweby edited
							$( '#image_attachment_id' ).val( attachment.id );
							$( '#<?php 
        echo esc_attr( $args['id'] );
        ?>' ).val( attachment.url );
							
							// Restore the main post ID
							wp.media.model.settings.post.id = wp_media_post_id;
						});

						// Finally, open the modal
						file_frame.open();
					});

					// Restore the main ID when the add media button is pressed
					jQuery( 'a.add_media' ).on( 'click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
				</script>
			<?php 
    }

    /**
     * Generate: Editor field.
     *
     * @param array $args
     */
    public function generate_editor_field( $args ) {
        wp_editor( $args['value'], $args['id'], array(
            'textarea_name' => $args['name'],
        ) );
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Code editor field.
     *
     * @param array $args
     */
    public function generate_code_editor_field( $args ) {
        printf(
            '<textarea
					name="%s"
					id="%s"
					placeholder="%s"
					rows="5"
					cols="60"
					class="%s"
				>%s</textarea>',
            esc_attr( $args['name'] ),
            esc_attr( $args['id'] ),
            esc_attr( $args['placeholder'] ),
            esc_attr( $args['class'] ),
            esc_html( $args['value'] )
        );
        $settings = wp_enqueue_code_editor( array(
            'type' => esc_attr( $args['mimetype'] ),
        ) );
        wp_add_inline_script( 'code-editor', sprintf( 'jQuery( function() { wp.codeEditor.initialize( "%s", %s ); } );', esc_attr( $args['id'] ), wp_json_encode( $settings ) ) );
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Custom field.
     *
     * @param array $args
     */
    public function generate_custom_field( $args ) {
        if ( isset( $args['output'] ) && is_callable( $args['output'] ) ) {
            call_user_func( $args['output'], $args );
            return;
        }
        // Rf commented this line changed to below becuase of wpcs error.
        /*echo ( isset( $args['output'] ) ) ? esc_attr( $args['output'] ) : esc_attr( $args['default'] ); */
        $args_val = ( isset( $args['output'] ) ? esc_attr( $args['output'] ) : esc_attr( $args['default'] ) );
        echo esc_attr( $args_val );
    }

    /**
     * Generate: Multi Inputs field.
     *
     * @param array $args
     */
    public function generate_multiinputs_field( $args ) {
        $field_titles = array_keys( $args['default'] );
        $values = array_values( $args['value'] );
        echo '<div class="wpsf-multifields">';
        $i = 0;
        while ( $i < count( $values ) ) {
            $field_id = sprintf( '%s_%s', $args['id'], $i );
            $value = esc_attr( stripslashes( $values[$i] ) );
            echo '<div class="wpsf-multifields__field">';
            echo '<input type="text" name="' . esc_attr( $args['name'] ) . '[]" id="' . esc_attr( $field_id ) . '" value="' . esc_attr( $value ) . '" class="regular-text ' . esc_attr( $args['class'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" />';
            echo '<br><span>' . esc_attr( $field_titles[$i] ) . '</span>';
            echo '</div>';
            $i++;
        }
        echo '</div>';
        $this->generate_description( $args['desc'] );
    }

    /**
     * Generate: Field ID.
     *
     * @param mixed $id
     *
     * @return string
     */
    public function generate_field_name( $id ) {
        return sprintf( '%s_settings[%s]', $this->option_group, esc_attr( $id ) );
    }

    /**
     * Generate: Description
     *
     * @param mixed $description.
     */
    public function generate_description( $description ) {
        if ( $description && $description !== '' ) {
            echo '<p class="description">' . esc_attr( $description ) . '</p>';
        }
    }

    /**
     * Output the settings form.
     */
    public function settings() {
        do_action( 'wpsf_before_settings_' . $this->option_group );
        $if_paid_version = 'enwb-fb-free-class';
        ?>
			<form action="options.php" method="post" novalidate enctype="multipart/form-data" class="<?php 
        echo $if_paid_version;
        ?>" >
			<?php 
        do_action( 'wpsf_before_settings_fields_' . $this->option_group );
        ?>
			<?php 
        settings_fields( $this->option_group );
        ?>

			<?php 
        do_action( 'wpsf_do_settings_sections_' . $this->option_group );
        ?>

			<?php 
        if ( apply_filters( 'wpsf_show_save_changes_button_' . $this->option_group, true ) ) {
            ?>
					<p class="submit">
						<input type="submit" class="button-primary" value="<?php 
            esc_html_e( 'Save Changes' );
            ?>" />
					</p>
				<?php 
        }
        ?>
			</form>
			<?php 
        do_action( 'wpsf_after_settings_' . $this->option_group );
    }

    /**
     * Helper: Get Settings.
     *
     * @return array
     */
    public function get_settings() {
        $settings_name = $this->option_group . '_settings';
        static $settings = array();
        if ( isset( $settings[$settings_name] ) ) {
            return $settings[$settings_name];
        }
        $saved_settings = get_option( $this->option_group . '_settings' );
        $settings[$settings_name] = array();
        foreach ( $this->settings as $section ) {
            if ( empty( $section['fields'] ) ) {
                continue;
            }
            foreach ( $section['fields'] as $field ) {
                if ( !empty( $field['default'] ) && is_array( $field['default'] ) ) {
                    $field['default'] = array_values( $field['default'] );
                }
                $setting_key = ( $this->has_tabs() ? sprintf(
                    '%s_%s_%s',
                    $section['tab_id'],
                    $section['section_id'],
                    $field['id']
                ) : sprintf( '%s_%s', $section['section_id'], $field['id'] ) );
                if ( isset( $saved_settings[$setting_key] ) ) {
                    $settings[$settings_name][$setting_key] = $saved_settings[$setting_key];
                } else {
                    $settings[$settings_name][$setting_key] = ( isset( $field['default'] ) ? $field['default'] : false );
                }
            }
        }
        return $settings[$settings_name];
    }

    /**
     * Tabless Settings sections.
     */
    public function do_tabless_settings_sections() {
        ?>
			<div class="wpsf-section wpsf-tabless">
			<?php 
        do_settings_sections( $this->option_group );
        ?>
			</div>
			<?php 
    }

    /**
     * Tabbed Settings sections.
     */
    public function do_tabbed_settings_sections() {
        $i = 0;
        foreach ( $this->tabs as $tab_data ) {
            ?>
				<div id="tab-<?php 
            echo esc_attr( $tab_data['id'] );
            ?>" class="wpsf-section wpsf-tab wpsf-tab--<?php 
            echo esc_attr( $tab_data['id'] );
            ?> <?php 
            if ( $i == 0 ) {
                echo 'wpsf-tab--active';
            }
            ?>
				">
					<div class="postbox">
					<?php 
            do_settings_sections( sprintf( '%s_%s', $this->option_group, $tab_data['id'] ) );
            ?>
					</div>
				</div>
				<?php 
            $i++;
        }
    }

    /**
     * Output the tab links.
     */
    public function tab_links() {
        if ( !apply_filters( 'wpsf_show_tab_links_' . $this->option_group, true ) ) {
            return;
        }
        do_action( 'wpsf_before_tab_links_' . $this->option_group );
        ?>
			<ul class="wpsf-nav">
			<?php 
        $i = 0;
        foreach ( $this->tabs as $tab_data ) {
            if ( !$this->tab_has_settings( $tab_data['id'] ) ) {
                continue;
            }
            if ( !isset( $tab_data['class'] ) ) {
                $tab_data['class'] = '';
            }
            $tab_data['class'] .= self::add_show_hide_classes( $tab_data );
            $active = ( $i == 0 ? 'wpsf-nav__item--active' : '' );
            ?>
					<li class="wpsf-nav__item <?php 
            echo esc_attr( $active );
            ?>">
						<a class="wpsf-nav__item-link <?php 
            echo esc_attr( $tab_data['class'] );
            ?>" href="#tab-<?php 
            echo esc_attr( $tab_data['id'] );
            ?>"><?php 
            echo esc_attr( $tab_data['title'] );
            ?></a>
					</li>
					<?php 
            $i++;
        }
        ?>
				<li class="wpsf-nav__item wpsf-nav__item--last">
					<input type="submit" class="button-primary wpsf-button-submit" value="<?php 
        esc_attr_e( 'Save Changes' );
        ?>">
				</li>
			</ul>

			<?php 
        // Add this here so notices are moved.
        ?>
			<div class="wrap wpsf-notices"><h2>&nbsp;</h2></div>
			<?php 
        do_action( 'wpsf_after_tab_links_' . $this->option_group );
    }

    /**
     * Does this tab have settings?
     *
     * @param string $tab_id.
     *
     * @return bool
     */
    public function tab_has_settings( $tab_id ) {
        if ( empty( $this->settings ) ) {
            return false;
        }
        foreach ( $this->settings as $settings_section ) {
            if ( $tab_id !== $settings_section['tab_id'] ) {
                continue;
            }
            return true;
        }
        return false;
    }

    /**
     * Check if this settings instance has tabs.
     */
    public function has_tabs() {
        if ( !empty( $this->tabs ) ) {
            return true;
        }
        return false;
    }

    /**
     * Add Show Hide Classes.
     */
    public static function add_show_hide_classes( $args, $type = 'show_if' ) {
        $class = '';
        $slug = ' ' . str_replace( '_', '-', $type );
        if ( isset( $args[$type] ) && is_array( $args[$type] ) ) {
            $class .= $slug;
            foreach ( $args[$type] as $condition ) {
                if ( isset( $condition['field'] ) && $condition['value'] ) {
                    $value_string = '';
                    foreach ( $condition['value'] as $value ) {
                        if ( !empty( $value_string ) ) {
                            $value_string .= '||';
                        }
                        $value_string .= $value;
                    }
                    if ( !empty( $value_string ) ) {
                        $class .= $slug . '--' . $condition['field'] . '===' . $value_string;
                    }
                } else {
                    $and_string = '';
                    foreach ( $condition as $and_condition ) {
                        if ( !isset( $and_condition['field'] ) || !isset( $and_condition['value'] ) ) {
                            continue;
                        }
                        if ( !empty( $and_string ) ) {
                            $and_string .= '&&';
                        }
                        $value_string = '';
                        foreach ( $and_condition['value'] as $value ) {
                            if ( !empty( $value_string ) ) {
                                $value_string .= '||';
                            }
                            $value_string .= $value;
                        }
                        if ( !empty( $value_string ) ) {
                            $and_string .= $and_condition['field'] . '===' . $value_string;
                        }
                    }
                    if ( !empty( $and_string ) ) {
                        $class .= $slug . '--' . $and_string;
                    }
                }
            }
        }
        // Run the function again with hide if.
        if ( 'hide_if' !== $type ) {
            $class .= self::add_show_hide_classes( $args, 'hide_if' );
        }
        return $class;
    }

    /**
     * Handle export settings action.
     */
    public static function export_settings() {
        $_wpnonce = filter_input( INPUT_GET, '_wpnonce' );
        $option_group = filter_input( INPUT_GET, 'option_group' );
        if ( empty( $_wpnonce ) || !wp_verify_nonce( $_wpnonce, 'wpsf_export_settings' ) ) {
            wp_die( esc_html__( 'Action failed.', 'wpsf' ) );
        }
        if ( empty( $option_group ) ) {
            wp_die( esc_html__( 'No option group specified.', 'wpsf' ) );
        }
        $options = get_option( $option_group . '_settings' );
        $options = wp_json_encode( $options );
        // output the file contents to the browser.
        header( 'Content-Type: text/json; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename=wpsf-settings-' . $option_group . '.json' );
        echo esc_attr( $options );
        exit;
    }

    /**
     * Import settings.
     */
    public function import_settings() {
        $_wpnonce = filter_input( INPUT_POST, '_wpnonce' );
        $option_group = filter_input( INPUT_POST, 'option_group' );
        $settings = filter_input( INPUT_POST, 'settings' );
        if ( $option_group !== $this->option_group ) {
            return;
        }
        // verify nonce.
        if ( empty( $_wpnonce ) || !wp_verify_nonce( $_wpnonce, 'wpsf_import_settings' ) ) {
            wp_send_json_error();
        }
        // check if $settings is a valid json.
        if ( !is_string( $settings ) || !is_array( json_decode( $settings, true ) ) ) {
            wp_send_json_error();
        }
        $settings_data = json_decode( $settings, true );
        update_option( $option_group . '_settings', $settings_data );
        wp_send_json_success();
    }

}
