<?php
/**
 * Enwb Fb Admin Notices.
 *
 * @package Fullscreen_Background
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
/**
 * Class Enwb_Fb_Admin_Notices.
 */
class Enwb_Fb_Admin_Notices {

	/**
	 * Instance
	 *
	 * @access private
	 * @var object Class object.
	 * @since 1.0.0
	 */
	private static $instance;

	/**
	 * Initiator
	 *
	 * @since 1.0.0
	 * @return object initialized object of class.
	 */
	public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_head', array( $this, 'remove_admin_notices' ), 20 );
			
		add_action( 'admin_init', array( $this, 'show_admin_notices' ), 30 );
		//add_action( 'wpsf_before_settings_'.ENWEBY_FB_FWAS, array( $this, 'enwb_optin_popup') );
		
		add_action( 'wp_ajax_enwb_optin_proceed', array( $this, 'enwb_optin_proceed' ) );
		add_action( 'wp_ajax_nopriv_enwb_optin_proceed', array( $this, 'enwb_optin_proceed' ) );

		add_action( 'wp_ajax_enwb_optin_skipped', array( $this, 'enwb_optin_skipped' ) );
		add_action( 'wp_ajax_nopriv_enwb_optin_skipped', array( $this, 'enwb_optin_skipped' ) );
	}

	/**
     * Remove_all admin notices on plugin page.
     */
    public function remove_admin_notices()
    {
        $screen = get_current_screen();
        if ( in_array( $screen->id, array( 'toplevel_page_enweby-fullscreen-background-settings' ), true ) ) {           
			?>
			<style>
			.notice{display:none!important;}
			.enwb-notice-wrapper, #wpbody-content #setting-error-settings_updated{display:block!important;}
			</style>
			<?php
        }		
    }
	
	/**
	 *  Show admin notices.
	 */
	public function show_admin_notices() {
		
		$image_path = esc_url( plugin_dir_url( __dir__ ) . 'admin/images/plugin-icon.png' );
		$review_url = esc_url( apply_filters( 'enwb_fb_plugin_review_url', 'https://wordpress.org/support/plugin/fullscreen-background/reviews/?filter=5#new-post' ) );


		Enwb_Fb_Notices::add_notice(
			array(
				'id'                   => 'enwb-fb-5-star-notice',
				'type'                 => 'info',
				'class'                => 'enwb-fb-5-star',
				'show_if'              => true,
				/* translators: %1$s white label plugin name and %2$s deactivation link */
				'message'              => sprintf(
					'<div class="notice-image" style="display: flex;">
                        <img src="%1$s" class="custom-logo" alt="Icon" itemprop="logo" style="max-width: 90px;"></div>
                        <div class="notice-content">
                            <div class="notice-heading">
                                %2$s
                            </div>
                            %3$s<br />
                            <div class="enwb-review-notice-container">
                                <a href="%4$s" class="enwb-notice-close enwb-review-notice button-primary" target="_blank">
                                %5$s
                                </a>
                            <span style="color:#665;" class="dashicons dashicons-info-outline"></span>
                                <a href="#" data-repeat-notice-after="%6$s" class="enwb-notice-close enwb-review-notice">
                                %7$s
                                </a>
                            <span class="dashicons dashicons-smiley"></span>
                                <a href="#" class="enwb-notice-close enwb-review-notice">
                                %8$s
                                </a>
                            </div>
                        </div>',
					$image_path,
					__( 'Hi! Seems like you are enjoying our plugin <b>Full Screen Background</b>. &mdash; Thanks a ton!', 'fullscreen-background' ),
					__( 'Could you please do us a BIG favor and give it a 5-star rating on WordPress? This would boost our motivation and help other users make a comfortable decision while choosing the Full Screen Background plugin.<br><span class="team-text"><strong>- Team Enweby</strong></span>', 'fullscreen-background' ),
					$review_url,
					__( 'Ok, you deserve it', 'fullscreen-background' ),
					MONTH_IN_SECONDS, // this one is being used for js file
					__( 'Nope, maybe later', 'fullscreen-background' ),
					__( 'I already did', 'fullscreen-background' )
				),
				'repeat-notice-after'  => MONTH_IN_SECONDS,
				'display-notice-after' => ( 2 * WEEK_IN_SECONDS ), // Display notice after 2 weeks installation or running this code.				
			)
		);
	}

	public function enwb_optin_popup() {
		$screen = get_current_screen();
        if ( in_array( $screen->id, array( 'toplevel_page_enweby-fullscreen-background-settings' ), true ) ) {
			if ( 'optin-dismissed' !== get_user_meta( get_current_user_id(), FULLSCREEN_BACKGROUND_PLUGIN_NAME.'-optin-screen' , true ) && 'optin-success' !== get_user_meta( get_current_user_id(), FULLSCREEN_BACKGROUND_PLUGIN_NAME.'-optin-screen' , true ) ) {
				if ( enwbfb_fs()->is_free_plan() ) {
					wp_enqueue_style( 'enwb-optin-screen', plugin_dir_url( __FILE__ ) . 'css/enwb-optin-screen.css', array(), FULLSCREEN_BACKGROUND_VERSION );
					wp_enqueue_script( 'enwb-optin-screen', plugin_dir_url( __FILE__ ) . 'js/enwb-optin-screen.js', array( 'jquery' ), FULLSCREEN_BACKGROUND_VERSION, true );
					wp_localize_script( 'enwb-optin-screen', 'ajax_object', array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce('enwb-optin-nonce') ) );

					$current_user = wp_get_current_user();
					$html ='<div class="enwb-optin-div">';
					
					$html .='<div class="enwb-optin-form">
							<div class="form-row">
							<h3 class="align-center">Never miss any important update or notification </h3>
							<p><span class="dashicons dashicons-yes"></span> Get notification earlier for upcoming important updates. </p>
							<p><span class="dashicons dashicons-yes"></span> Get free upgrade to Pro version, which we provide time to time to selected users. </p>
							<p><span class="dashicons dashicons-yes"></span> Get notification for ongoing discounts & offers. </p>
							<p><span class="dashicons dashicons-yes"></span> Priority support for registered Members.</p>
							<p><span class="dashicons dashicons-bell"></span> Dont worry about your information, it is safe with us. We dont share our users\' info to any third party site. </p>
						</div>
						<div class="form-row">
							<label>Name: *</label><br>
							<input type="hidden" class="enwb-optin-frm-field" name="enwb-optin-ID" value="'.$current_user->ID.'" />
							<input type="hidden" class="enwb-optin-frm-field" name="enwb-optin-plugin" value="'.FULLSCREEN_BACKGROUND_PLUGIN_NAME.'" />
							<input type="hidden" class="enwb-optin-frm-field" name="enwb-optin-site" value="'.get_home_url().'" />
							<input type="text" class="enwb-optin-frm-field enwb-optin-name" name="enwb-optin-name" value="'.$current_user->display_name.'" />
						</div>
						<div class="form-row">
							<label>Email: *</label><br>
							<input type="text" class="enwb-optin-frm-field enwb-optin-email" name="enwb-optin-email" value="'.$current_user->user_email.'" />
						</div>
						<div class="form-row row-buttons">
							<div class="continue-button col-left"><button id="enwb-optin-proceed" name="enwb-optin-continue" class="button button-primary">Yes. Continue</button></div>
							<div class="skip-button col-left"><button id="enwb-optin-skip" name="enwb-optin-skip" class="button button-secondary">Skip</button></div>				
						</div>
					</div>';
					
					$html .='</div>';
					
					echo $html;
				}
			}
		}
	}

	/**
	 * Optin skipped pressed.
	 *
	 */	
	public function enwb_optin_skipped () {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'enwb-optin-nonce' ) ) {
			wp_send_json_error( esc_html_e( 'WordPress Nonce not validated.', 'fullscreen-background' ) );
		} else {
			update_user_meta( get_current_user_id(), FULLSCREEN_BACKGROUND_PLUGIN_NAME.'-optin-screen', 'optin-dismissed' );
		}
		 wp_die();
	}

	/**
	 * Process Optin.
	 *
	 */	
	public function enwb_optin_proceed () {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'enwb-optin-nonce' ) ) {
			wp_send_json_error( esc_html_e( 'WordPress Nonce not validated.', 'fullscreen-background' ) );
		} else {
		
			$url = 'https://www.enweby.com/wp-json/enwebyapi/v2/opt-in/';

			$array_with_parameters = array( 'name'  => $_POST['name'], 'email' => $_POST['email'], 'plugin'  => $_POST['plugin'], 'site'  => $_POST['site'] );

			$response = wp_remote_post($url, array(
				'headers'     => array('Content-Type' => 'application/json; charset=utf-8'),
				'body'        => json_encode($array_with_parameters),
				'method'      => 'POST',
				'data_format' => 'body',
				));
				
			
				if ( is_wp_error( $response ) ) {
				   $error_message = $response->get_error_message();
				   $json['msg'] = "Something went wrong: $error_message";
				   $json['response_data'] = json_decode( $response['body'] );
				   wp_send_json_error( $json );
				} else {
				   update_user_meta( get_current_user_id(), FULLSCREEN_BACKGROUND_PLUGIN_NAME.'-optin-screen', 'optin-success' );
				   $json['msg'] = "success";
				   $json['response_data'] = json_decode( $response['body'] );
				   wp_send_json_success( $json );
				}
		}		 
	}
	/**
	 * Check allowed screen for notices.
	 *
	 * @return bool
	 */
	public function allowed_screen_for_notices() {

		$screen          = get_current_screen();
		$screen_id       = $screen ? $screen->id : '';
		/*$allowed_screens = array(
			'woocommerce_page_fullscreen-background',
			'dashboard',
			'plugins',
		);

		if ( in_array( $screen_id, $allowed_screens, true ) ) {
			return true;
		}
		return false;*/
		return true;
	}	

}

Enwb_Fb_Admin_Notices::get_instance();
