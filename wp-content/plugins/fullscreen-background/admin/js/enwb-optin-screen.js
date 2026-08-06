/**
 * All of the js for your public-facing functionality should be.
 * included in this file.
 *
 * @link              https://www.enweby.com/
 * @since             1.0.4
 * @package           Fullscreen_Background
 */

(function( $ ) {
	'use strict';
		$(
		function() {
				jQuery("body").prepend("<div class=\'enwb-optin-overlay\'>&nbps;</div>");
				jQuery('.enwb-optin-frm-field').click( function(e){
					e.preventDefault();
					jQuery('.enwb-optin-form').show();
				});
				
				jQuery('#enwb-optin-skip').click(function(){
				
		            jQuery.ajax( {
						type: 'POST',
						url: ajax_object.ajax_url,
						data: {
							'action' : 'enwb_optin_skipped',
							'nonce': ajax_object.nonce,
							'email' : jQuery('input[name="enwb-optin-email"]').val(),
							'name' : jQuery('input[name="enwb-optin-name"]').val()
						},
						beforeSend: function() {							
							jQuery("#enwb-optin-skip").html('<span class="spinner"></span>');
							jQuery(".enwb-optin-div .spinner").addClass('visible');
						 },
						success: function (result) {
							jQuery('.enwb-optin-div').remove();
							jQuery('.enwb-optin-overlay').remove();
						},
						complete: function() {
												
						}
						
					});
				});
				
				jQuery('.enwb-optin-frm-field').keypress( function(){
					jQuery(this).removeClass('enwb-required');
				});
				
				jQuery('#enwb-optin-proceed').click(function(){
					 var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,10})?$/;					
					if( '' == jQuery('.enwb-optin-name').val() ) {					
						jQuery('.enwb-optin-name').addClass('enwb-required');
						return false;
					}
					if( '' == jQuery('.enwb-optin-email').val() || !emailReg.test( jQuery('.enwb-optin-email').val() ) ) {
						jQuery('.enwb-optin-email').addClass('enwb-required');
						return false;
					}
					
					
		            jQuery.ajax( {
						type: 'POST',
						url: ajax_object.ajax_url,
						data: {
							'action'	: 'enwb_optin_proceed',
							'nonce'		: ajax_object.nonce,
							'ID'		: jQuery('input[name="enwb-optin-ID"]').val(),
							'email'		: jQuery('input[name="enwb-optin-email"]').val(),
							'name'		: jQuery('input[name="enwb-optin-name"]').val(),
							'plugin'	: jQuery('input[name="enwb-optin-plugin"]').val(),
							'site'		: jQuery('input[name="enwb-optin-site"]').val()
						},
						beforeSend: function() {							
							jQuery("#enwb-optin-proceed").after('<span class="spinner"></span>');
							jQuery(".enwb-optin-div .spinner").addClass('visible');
						 },
						success: function (result) {
							jQuery('.enwb-optin-form .form-row').remove();
							jQuery('.enwb-optin-form').html('<span class="optin-success-msg">You have successfully Opted In for offers and discount. <br> This page will refresh now... <span class="spinner"></span> </span>');
							jQuery(".enwb-optin-form .spinner").addClass('visible');
							jQuery(".enwb-optin-form .spinner").css('position','fixed');
				
						},
						complete: function() {
							setTimeout(function() {
								  location.reload();
								}, '3000');
						}
						
					});
				});
			}
		);
})( jQuery );	