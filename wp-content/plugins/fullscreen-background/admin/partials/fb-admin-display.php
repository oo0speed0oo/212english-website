<?php
/**
 * Provide a admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       https://www.enweby.com/
 * @since      1.0.0
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/admin/partials
 */

?>

<!-- This file should primarily consist of HTML with a little bit of PHP. -->
<h2 class="enweby-plugin-title"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/enweby-logo.png'; ?>" title="Enweby Solutions" alt="Enweby Solutions" />Full Screen Background</h2>
<div class="enweby-popular-products">
	<label>Check other free & popular plugins by <span>Enweby</span></label>
	<div class="enweby-plugins">
		<ul>
			<li><a href="https://wordpress.org/plugins/enweby-variation-swatches-for-woocommerce/" target="_blank"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/enwbvs-128x128.png'; ?>"></a><p><a href="https://wordpress.org/plugins/enweby-variation-swatches-for-woocommerce/" target="_blank">Variation Swatches for WooCommerce</a></p></li>
			<li><a href="https://wordpress.org/plugins/fullscreen-background/" target="_blank"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/fsbg-128x128.png'; ?>"></a><p><a href="https://wordpress.org/plugins/fullscreen-background/" target="_blank">Fullscreen Background</a></p></li>
			<li><a href="https://wordpress.org/plugins/header-footer-custom-html/" target="_blank"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/hfch-128x128.png'; ?>"></a><p><a href="https://wordpress.org/plugins/header-footer-custom-html/" target="_blank">Header Footer Custom Html</a></p></li>
			<li><a href="https://wordpress.org/plugins/offcanvas-menu/" target="_blank"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/omm-128x128.jpg'; ?>"></a><p><a href="https://wordpress.org/plugins/offcanvas-menu/" target="_blank">Offcanvas Mobile Menu</a></p></li>
			<li><a href="https://wordpress.org/plugins/enweby-pretty-product-quick-view/" target="_blank"><img src="<?php echo plugin_dir_url( dirname( __FILE__ ) ) .'images/epqv-128x128.png'; ?>"></a><p><a href="https://wordpress.org/plugins/enweby-pretty-product-quick-view/" target="_blank">Pretty Product Quick View</a></p></li>
		
		</ul>
	</div>
</div>
<div class='enwbfb-tabs'>
	<ul>
		<li rel='.wpsf-section' class="active"><span>Global Settings</span></li>
		<?php if ( enwbfb_fs()->is_free_plan() ) { ?>
		<li rel='.premium-feature-section' ><span>Premium Features</span></li>
		<?php } ?>
	</ul>
	<?php //if ( 'optin-success' !== get_user_meta( get_current_user_id(), FULLSCREEN_BACKGROUND_PLUGIN_NAME.'-optin-screen' , true ) ) {
			//if ( !enwbfb_fs()->is_free_plan() ) {
	?>
	<!--<div class='persistent-optin-link-wrapper'><a class='show-optin-link' href="#">Opt In for Offers & Discounts</a></div> -->
	<?php //}
	//}	
	?>
</div>
<?php if ( enwbfb_fs()->is_free_plan() ) { ?>
<div class='premium-feature-section'>
	
	<div class="premium-key-features">
		<div class="upgrade-notice-box">
			<h3><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span> Premium Version <span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span><span class="dashicons dashicons-star-filled"></span></h3>
			<p class="plugin-price">$19.99 Only</p>
			<p>Premium version comes with below mentioned premium features.</p>			
			<p>Upgrade today to get all premium features and premium support. Click below button to upgrade.<p class="moneyback-guarentee"><span class="dashicons dashicons-awards"></span>&nbsp;30 days money back guarentee.</p>
			<!--<p class="button-class"><span class="button-left"><a class="upgrade-buttton" href="https://checkout.freemius.com/mode/dialog/plugin/12796/plan/21556/">Upgrade Now</a></span> <span class="button-right"><a target="_blank" href="https://www.enweby.com/product/fullscreen-background/">View All Features</a></span></p> -->
			<div><a class="upgrade-buttton single-upgrade-button" href="https://checkout.freemius.com/mode/dialog/plugin/12796/plan/21556/">Upgrade Now</a></div>
		</div>
		<div class="features">
			<div class="feature-left">
				<ul>
					<li>
						<h4>Global Fullscreen Background Settings.</h4>
						<p>Premium version supports global settings for fullscreeen background for home page or any other post/page. This global settings will be overriden by individual page/post settings if added.</p>
					</li>
					
					<li>
						<h4>Different fullscreen background image or video on individual page/post.</h4>
						<p>Premium version supports upload of images or videos and other settings right on the page/post editor in the adimn. So this has become super easy to set background video or background image for each page/post.</p>
					</li>
					
					<li>
						<h4>Three types of background supported on both global and individual page/post.</h4>
						<p>Premium version supports three types of background on both global and indivisual page/post. These are ass follows;<br> 
						1) Full Screen Background Image.<br>
						2) Full Screen Background Video.<br>
						3) Full screen Background Color.</p>
					</li>

					<li>
						<h4>Individual page/post fullscreen background images.</h4>
						<p>Premium version supports fullscreen background image. Admin can upload single or multiple images for fullscreen background for individual page/post.</p>
					</li>
					
					<li>
						<h4>Different background image each time page refreshes/reloads.</h4>
						<p>Premium version supports functionality of showing different image each time a page refrehes/reloads when multiple images are uploaded.</p>
					</li>
					
					<li>
						<h4>Individual page/post fullscreen background slideshow.</h4>
						<p>Premium version supports fullscreen slideshow when multiple images is uploaded as background image. Admin can upload single or multiple images for fullscreen background for individual page/post. When there are multiple images uploaded, it can be used to make fullscreen backgrdound slideshow.</p>
					</li>					
				</ul>
			</div>
			<div class="feature-right">
				<ul>
					<li>
						<h4>Full control on fullscreen background slideshow.</h4>
						<p>Premimum version full control on the backgorund slideshow. It provides following settings to control the behavior of slideshow.<br>
						   1) Slide Transition Duration.<br>
						   2) Slide background shadow.<br>
						   3) Slideshow effect without zoom.<br>
						   4) Slideshow with zoom in.<br>
						   5) Slideshow with Zoom and rotating angle.<br>
						</p>
					</li>
					<li>
						<h4>Different fullscreen background video can be used for inidividual page/past.</h4>
						<p>Premium version supports diffferent videos can be uploaded on different page/post for fullscreen background video.</p>
					</li>
					<li>
						<h4>Multiple videos are supported for fullscreen background.</h4>
						<p>Premium version also supports multiple vides can be uploaded on individual page/post for fullscreen background. When multiple videoes uploaded, admin can set videos to dispay as differnt video display each time page is reloaded/refreshed or first video can be used as background video depending upon the settings done.</p>
					</li>
					
					<li>
						<h4>Different fullscreen background color can be used for inidividual page/past.</h4>
						<p>Premium version also supported differnt background color for different page/post.</p>
					</li>

					<li>
						<h4>Individual Custom CSS option on each page/post.</h4>
						<p>Premium version offers to add Custom CSS code for each individual page/post right in the page/post editor page, which will work only for that particular page or post, which very helpful if you want only certain css on certain pages.</p>
					</li>

					<li>
						<h4>Individual Custom JS option on each page/post.</h4>
						<p>Premium version offers to add Custom JS code for each individual page/post right in the page/post editor page, which will work only for that particular page or post. This feature is very helpful if you want only certain css on certain pages.</p>
					</li>	
				</ul>
			</div>
		</div>	
	</div>
</div>
<?php } ?>
<style>
.persistent-optin-link-wrapper{float:right;margin:10px 0;}
.persistent-optin-link-wrapper a{font-weight:bold;letter-spacing:0.5px;}
.enwbfb-tabs ul{float:left;}
.enwbfb-tabs{float:left;width:100%;}

.premium-key-features {background:#f9f9f9;}
.pro-feature-row .upgrade-notice-box p{font-weight:normal;font-size:14px; letter-spacing:0.5px;font-style:italic;}
.pro-feature-row .upgrade-notice-box .offer{font-weight:600;font-size:14px;}
.plugin-price{font-size:2em!important;font-weight:bold!important;color:teal !important;}
.upgrade-notice-box h3{background:#fafafa;color:teal;padding:5px;text-align:center;font-size:1.5rem;font-style:italic;margin:1.8rem 0;}
.upgrade-notice-box .moneyback-guarentee .dashicons-awards{color:teal;font-size:2rem;margin-right:15px;}
.upgrade-notice-box .moneyback-guarentee {font-weight:600 !important;}
.upgrade-notice-box .dashicons-dismiss{position: absolute; right: 10px; top: 0px; font-size: 2rem;}
.upgrade-notice-box .dashicons-dismiss:hover{color:#039999;}

.pro-feature-row:hover .locked-icon:before{text-decoration:underline; -webkit-transition: all 0.3s ease 0s; -moz-transition: all 0.3s ease 0s; -o-transition: all 0.3s ease 0s; transition: all 0.3s ease 0s;}
.upgrade-notice-box .button-class {float:left;width:100%;padding-top:0;}
.upgrade-notice-box .button-class a {color:#fff;}

.upgrade-notice-box .upgrade-buttton {float:left;background: teal; color: #fff;  padding: 10px 20px; -webkit-border-radius: 5px;-moz-border-radius: 5px;border-radius: 5px;-webkit-transition: all 0.3s ease 0s; -moz-transition: all 0.3s ease 0s; -o-transition: all 0.3s ease 0s; transition: all 0.3s ease 0s;}
.upgrade-notice-box .single-upgrade-button{font-size:1.2rem;margin:20px 10px;line-height:1.5rem;display:flex;justify-content:center;float:none !important;}
.upgrade-notice-box  .button-right{float:right;background: teal; color: #fff;  padding: 10px 20px; -webkit-border-radius: 5px;-moz-border-radius: 5px;border-radius: 5px;-webkit-transition: all 0.3s ease 0s; -moz-transition: all 0.3s ease 0s; -o-transition: all 0.3s ease 0s; transition: all 0.3s ease 0s;}
.upgrade-notice-box .upgrade-buttton:hover, .upgrade-notice-box .button-right:hover{background:#039999;-webkit-transition: all 0.3s ease 0s; -moz-transition: all 0.3s ease 0s; -o-transition: all 0.3s ease 0s; transition: all 0.3s ease 0s;}

.premium-feature-section {background:#f9f9f9;float:left;width:97%;}
.premium-feature-section table.form-table td{display:none;}
.premium-feature-section h3{text-align:center;line-height:1.8rem;font-size:1.5rem;margin-bottom:5px;}
.premium-feature-section h4{font-size:1.3em;line-height:1.6em;}
.premium-feature-section p{font-size:15px;margin-top:10px;font-weight:400;}
.premium-feature-section .feature-left {width: 46%;float: left; padding:0 2%;}
.premium-feature-section .feature-right {width: 46%;float: right; padding:0 2%;}
.premium-feature-section  ul li{margin-left:40px;}
.premium-feature-section ul li:before{content: "\f12a"; position: absolute; margin-left: -35px; color: #00A821; font-family: dashicons; font-size: 1.5rem; line-height: 2.1rem;}
.premium-feature-section .upgrade-notice-box {text-align: center;  max-width: 700px; margin: 0 auto;}
.premium-feature-section .upgrade-notice-box a{text-decoration:none;}
.premium-feature-section .dashicons-star-filled{line-height:35px;color:#ffb900;}
@media only screen and (max-width: 764px){
.premium-feature-section{width:100%;}
.premium-feature-section .feature-left {float:none;width: 100%; padding:0 2%;}
.premium-feature-section .feature-right {float:none;width: 100%; padding:0 2%;}
}



.wpsf-settings__header{display:none;}
.wpsf-settings__header h2{display:none;}
.wpsf-settings__content p.submit{float:left;width:100%;}
.enweby-popular-products ul li{padding:0 10px; -webkit-transition: all 0.4s ease 0s; -moz-transition: all 0.4s ease 0s;     -o-transition: all 0.4s ease 0s;   transition: all 0.4s ease 0s;}
.enweby-popular-products ul li a{text-decoration:none; -webkit-transition: all 0.4s ease 0s; -moz-transition: all 0.4s ease 0s;     -o-transition: all 0.4s ease 0s;   transition: all 0.4s ease 0s;}
.enweby-popular-products ul li:hover img{transform: scale(1.1);box-shadow:rgb(38 57 77) 0px 20px 30px -10px !important;-webkit-transition: all 0.5s ease 0s; -moz-transition: all 0.5s ease 0s;  -o-transition: all 0.5s ease 0s; transition: all 0.5s ease 0s;
-webkit-border-radius: 10px;
-moz-border-radius: 10px;
border-radius: 10px;
}
.enweby-popular-products ul li:hover a{color:#CF3F57;}
.wpsf-section.wpsf-tabless{float:left !important;}
.enwbfb-tabs{margin-top:20px;}
.enwbfb-tabs ul li{display:inline-block;width:150px;margin-right:5px;}
.enwbfb-tabs ul li span{padding:10px 0;background:#ddd;font-size:1rem;float:left;width:100%;text-align:center;display:flex;justify-content:center;}
.enwbfb-tabs ul li span:hover{cursor:pointer;}
.enwbfb-tabs ul li.active span{background:#2271b1;color:#fff;}
.enwbfb-tabs ul li.active span::after{
	 border: solid 8px transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-right-color: #2271b1;
    margin-top:28px;
	transform:rotate(-90deg);
	}
.premium-feature-section{display:none;}
</style>
<script>
jQuery(function(){
	jQuery('.enwbfb-tabs ul li').click(function(){
		jQuery('.enwbfb-tabs ul li').removeClass('active');
		jQuery(this).addClass('active');
		jQuery('.wpsf-section').hide();
		jQuery('.premium-feature-section').hide();
		jQuery( jQuery(this).attr('rel') ).show();
		
		if( jQuery(this).hasClass( 'active' ) &&  '.premium-feature-section' == jQuery(this).attr('rel') ) {
			jQuery('.enweby-admin-sidebar-settings').hide();
		} else {
			jQuery('.enweby-admin-sidebar-settings').show();
		}
		
	});

});
</script>