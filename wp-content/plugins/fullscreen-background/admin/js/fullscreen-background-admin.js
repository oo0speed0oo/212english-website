/**
 * All of the js for your public-facing functionality should be.
 * included in this file.
 *
 * @link              https://www.enweby.com/
 * @since             1.0.0
 * @package           Fullscreen_Background
 */

(function( $ ) {
	'use strict';

	/**
	 * All of the code for your admin-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */
	$(
		function() {
		
			//on load global settings
			/*if( $('#fb_general_section_fb_img_display_type_slideshow').is(':checked') ) {
				
			}*/
			
			if ( $( ".enwb-fb-pro-class .fb_background_type" ).find( 'option:selected' ).val() == "image" ) {
				var fb_bg_img_val = $( '.enwb-fb-pro-class #fb_image_url_fb_general_section_fb_bg_image' ).val();
				if( 'undefined' != typeof fb_bg_img_val ){
					var fb_bg_img_val_array = fb_bg_img_val.split(',');
				
					if( fb_bg_img_val_array.length > 1 ) {
						$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').show();
						if( $('#fb_general_section_fb_img_display_type_slideshow').is(':checked') ) {
							$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').show();
						} else {
							$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
						}
					} else {
						$('.enwb-fb-pro-class #fb_general_section_fb_img_display_type_single').prop('checked', true);
						$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').hide();
						$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
					}
				}
			}
			
			if ( $( ".enwb-fb-pro-class .fb_background_type" ).find( 'option:selected' ).val() == "video" ) {
				var fb_bg_vid_val = $( '.enwb-fb-pro-class #fb_file_url_fb_general_section_fb_bg_video' ).val();
				if( 'undefined' != typeof fb_bg_vid_val ){	
					var fb_bg_vid_val_array = fb_bg_vid_val.split(',');
					if( fb_bg_vid_val_array.length > 1 ) {
						$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').show();
					} else {
						$('.enwb-fb-pro-class #fb_general_section_fb_vid_display_type_single').prop('checked', true);
						$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').hide();
					}
				}
			}

			//global change background type selected
			// On changing background type.
			$( ".enwb-fb-pro-class .fb_background_type" ).change(
				function(){
					if ( $( ".enwb-fb-pro-class .fb_background_type" ).find( 'option:selected' ).val() == "image" ) {
						$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').hide();
						$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').show();
						
						var fb_bg_img_val = $( '.enwb-fb-pro-class #fb_image_url_fb_general_section_fb_bg_image' ).val();			
						
						if( 'undefined' != typeof fb_bg_img_val ){
							var fb_bg_img_val_array = fb_bg_img_val.split(',');
							if( fb_bg_img_val_array.length > 1 ) {
								$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').show();
								if( $('#fb_general_section_fb_img_display_type_slideshow').is(':checked') ) {
									$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').show();
								} else {
									$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
								}
							} else {
								$('.enwb-fb-pro-class #fb_general_section_fb_img_display_type_single').prop('checked', true);
								$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').hide();
								$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
							}
						}
					}
					if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "video" ) {
						$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').hide();
						$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
						var fb_bg_vid_val = $( '#fb_file_url_fb_general_section_fb_bg_video' ).val();
						if( 'undefined' != typeof fb_bg_vid_val ){
							var fb_bg_vid_val_array = fb_bg_vid_val.split(',');
							if( fb_bg_vid_val_array.length > 1 ) {
								$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').show();
							} else {
								$('.enwb-fb-pro-class #fb_general_section_fb_vid_display_type_single').prop('checked', true);
								$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').hide();
							}
						}
					}
					if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "color" ) {
					$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').hide();
						$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
						$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').hide();
					}
				}
			);
		
			// on load css.

			if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "image" ) {
				$( ".fb_bg_image, .fb_background_size, .fb_background_position, .fb_background_attachment" ).show();
			}
			if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "video" ) {
				$( ".fb_bg_video,.fb_video_background_position, .fb_video_background_fit, .fb_video_loop, .fb_video_mute" ).show();
			}
			if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "color" ) {
				$( ".fb_bg_color" ).show();
			}
			if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "page" ) {
				$( ".fb_page_field_id" ).show();
			}
			if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "post" ) {
				$( ".fb_post_field_id" ).show();
			}

			// On changing background type.
			$( ".fb_background_type" ).change(
				function(){
					if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "image" ) {
						$( ".fb_bg_image, .fb_background_size, .fb_background_position, .fb_background_attachment" ).show();
						$( ".fb_bg_color, .fb_bg_video,.fb_video_background_position, .fb_video_background_fit, .fb_video_loop, .fb_video_mute" ).hide();
					}
					if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "video" ) {
						$( ".fb_bg_video,.fb_video_background_position, .fb_video_background_fit, .fb_video_loop, .fb_video_mute" ).show();
						$( ".fb_bg_image, .fb_background_size, .fb_background_position, .fb_background_attachment,.fb_bg_color" ).hide();
					}
					if ( $( ".fb_background_type" ).find( 'option:selected' ).val() == "color" ) {
						$( ".fb_bg_color" ).show();
						$( ".fb_bg_image, .fb_background_size, .fb_background_position, .fb_video_loop, .fb_video_mute, .fb_background_attachment, .fb_bg_video,.fb_video_background_position, .fb_video_background_fit" ).hide();
					}
				}
			);
			// On changing background type.
			$( ".fb_display_options" ).change(
				function(){
					if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "home" ) {
						$( ".fb_post_field_id" ).hide();
						$( ".fb_page_field_id" ).hide();
					}
					if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "all" ) {
						$( ".fb_post_field_id" ).hide();
						$( ".fb_page_field_id" ).hide();
					}
					if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "page" ) {
						$( ".fb_page_field_id" ).show();
						$( ".fb_post_field_id" ).hide();
					}
					if ( $( ".fb_display_options" ).find( 'option:selected' ).val() == "post" ) {
						$( ".fb_post_field_id" ).show();
						$( ".fb_page_field_id" ).hide();
					}

				}
			);
			
			$(document).on('click', '.img-remove-global-single', function(e) {
					var rel = $(this).attr('rel');
					$("#img_preview_"+rel+"_button").attr('src','');
					$("#"+rel+"").val('');
					
					$(this).remove();
				}
			);
			
			$('#fb_general_section_fb_disable_global_settings').click(function(){
					
				if ($('#fb_general_section_fb_disable_global_settings').is(':checked') ) {
					$('.wpsf-section.wpsf-tabless .form-table').before('<div class="overlay-dbl-gbl-settings">&nbsp;</div>');
				} else{
					$('.overlay-dbl-gbl-settings').remove();
				}	
				
			}); 	
			
			//Removing image global settings
			$(document).on('click', '.img-remove-global', function(e) {
				$(this).closest('.bg-image-list').remove();
				var rel_image_url = $(this).attr('rel-input');
				var rel_image_url_glb = $(this).attr('rel-inputglb');
				var arrImgValue = $(rel_image_url).val();
				var arrImg = arrImgValue.split(',');
				
				var removeArrayValue = $(this).attr('rel');
					var arrImgNew = $.grep(arrImg, function(n) {
					  return n != removeArrayValue;
					});
		
				$(rel_image_url).val(arrImgNew);
				$(rel_image_url_glb).val(arrImgNew);
				
				if( arrImg.length > 2 ) {
					$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').show();
					if( $('#fb_general_section_fb_img_display_type_slideshow').is(':checked') ) {
						$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').show();
					} else {
						$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
					}
				} else {
					$('.enwb-fb-pro-class #fb_general_section_fb_img_display_type_single').prop('checked', true);
					$('.wpsf-settings--enweby_fullscreen_background .fb_img_display_type').hide();
					$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();					
				}
				$(this).closest('.bg-image-list').remove();
			});
			
			$(document).on('click', '.vid-remove-global-single', function(e) {
					var rel = $(this).attr('rel');
					$("#"+rel+"").val('');
					$(this).remove();
				}
			);	
			
			//Removing video global settings
			$(document).on('click', '.vid-remove-global', function(e) {
				$(this).closest('.bg-video-list').remove();
				var rel_image_url = $(this).attr('rel-input');
				var rel_image_url_glb = $(this).attr('rel-inputglb');
				var arrImgValue = $(rel_image_url).val();
				var arrImg = arrImgValue.split(',');
				
				var removeArrayValue = $(this).attr('rel');
					var arrImgNew = $.grep(arrImg, function(n) {
					  return n != removeArrayValue;
					});
		
				$(rel_image_url).val(arrImgNew);
				$(rel_image_url_glb).val(arrImgNew);
				
				if( arrImg.length > 2 ) {
					$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').show();
					
				} else {
					$('.enwb-fb-pro-class #fb_general_section_fb_vid_display_type_single').prop('checked', true);
					$('.wpsf-settings--enweby_fullscreen_background .fb_vid_display_type').hide();
					
				}
				$(this).closest('.bg-image-list').remove();
			});
			
			//Changind bg img layout type radio
			$(document).on('click', '[name="enweby_fullscreen_background_settings[fb_general_section_fb_img_display_type]"]', function(e) {
				if( 'slideshow' == $(this).val() ) {
					$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').show();
				} else {
					$('.wpsf-settings--enweby_fullscreen_background .fb-slide-delay, .wpsf-settings--enweby_fullscreen_background .fb-fade-animation-time, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_image_random, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_type, .wpsf-settings--enweby_fullscreen_background .fb_slideshow_shadow').hide();
				}
			});
			/* fb post/page wise **/		
			
			//On page load
			if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "image" ) {
				$( ".fb-type-image" ).show();
			}
			if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "video" ) {
				$( ".fb-type-video" ).show();
			}
			if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "color" ) {
				$( ".fb-type-color" ).show();
			}
			
			// On changing background type.
			$( ".fb-bg-type-select" ).change(
				function(){
					if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "image" ) {
						$( ".fb-type-video" ).hide();
						$( ".fb-type-color" ).hide();
						$( ".fb-type-image" ).show();
					}
					if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "video" ) {
						$( ".fb-type-color" ).hide();
						$( ".fb-type-image" ).hide();
						$( ".fb-type-video" ).show();
					}
					if ( $( ".fb-bg-type-select" ).find( 'option:selected' ).val() == "color" ) {
						$( ".fb-type-image" ).hide();
						$( ".fb-type-video" ).hide();
						$( ".fb-type-color" ).show();
					}
				}
			);
			
			if ( '' != $('.fb_image_url-row #fb_image_url').val() ) {
				$(".fb-bg-image-background-size-row, .fb-bg-image-background-attachment-row, .fb-bg-image-background-position-row, .fb-bg-image-background-repeat-row").show();
				//$('#fb_image_url_display').before("<span rel='#fb_image_url' rel-assoc='header' class='fb-img-remove-single'>x</span>");
			}
						
			// Tabs.
			$( ".enwb-tabs li a" ).click(
				function(e){
					e.preventDefault();
					$( ".enwb-tabs li a" ).removeClass('active');
					$(this).addClass('active');
					$('.enwb-tab-content').removeClass('tab-content-active');
					$($(this).attr('rel')).addClass('tab-content-active');
				}
			);
			
			//initialize color picker on text box
			/*$( '.color-picker-field' ).wpColorPicker();*/
			
			//Removing image
			$(document).on('click', '.img-remove', function(e) {
				var rel_image_url = $(this).attr('rel-input');
				var arrImgValue = $(rel_image_url).val();
				var arrImg = arrImgValue.split(',');
				var removeArrayValue = $(this).attr('rel');
					var arrImgNew = $.grep(arrImg, function(n) {
					  return n != removeArrayValue;
					});
		
				$(rel_image_url).val(arrImgNew);
				if(arrImgNew.length <= 1) {
					$('.fb-img-display-type-row').hide();
				}
				$(this).closest('.bg-image-list').remove();
			});
			
			//remove video
			$(document).on('click', '.vid-remove', function(e) {
				var rel_video_url = $(this).attr('rel-input');
				var arrImgValue = $(rel_video_url).val();
				var arrImg = arrImgValue.split(',');
				var removeArrayValue = $(this).attr('rel');
					var arrImgNew = $.grep(arrImg, function(n) {
					  return n != removeArrayValue;
					});
		
				$(rel_video_url).val(arrImgNew);
				if(arrImgNew.length <= 1) {
					$('.fb-vid-display-type-row').hide();
				}
				$(this).closest('.bg-video-list').remove();
			});
			
			//image upload
			 $('.envbfb-image-upload-btn').click(function(e) {
					e.preventDefault();
					var rel_image_url = $(this).attr('rel');
					
					var frame = wp.media({
					title : 'Enweby Full Screen Media Upload',
					multiple : 'add',
					library : { type : 'image'},
					/*button : { text : 'Insert' },*/
				  });
						  
				  frame.on('open',function() {
					  var attachment;	
					  var selection = frame.state().get('selection');
					  var ids_value = jQuery(rel_image_url).val();
					  if(ids_value.length > 0) {
						var ids = ids_value.split(',');

						ids.forEach(function(id) {
						  attachment = wp.media.attachment(id);
						  attachment.fetch();
						  selection.add(attachment ? [attachment] : []);
						});
					  }					  

					});
				  
				  
				  frame.on('select', function(e){
						var uploaded_image = frame.state().get('selection');
						var img_id_array = [];
						var img_url_array = [];
						//$(rel_image_url).after(JSON.stringify(uploaded_image));
						var multiplesImages = uploaded_image.map( function(uploaded_image) {
							 if ( uploaded_image.toJSON().sizes ) {
								if( uploaded_image.toJSON().sizes.thumbnail ) {
							img_url_array.push( uploaded_image.toJSON().sizes.thumbnail.url+"::"+ uploaded_image.toJSON().id ); //for image
										} else {
								img_url_array.push( uploaded_image.toJSON().sizes.full.url+"::"+ uploaded_image.toJSON().id ); //for image				
									}	
							/*img_url_array.push( uploaded_image.toJSON().sizes.thumbnail.url+"::"+ uploaded_image.toJSON().id ); //for image*/
								} else {
							img_url_array.push( uploaded_image.toJSON().url+"::"+ uploaded_image.toJSON().id );	//for svg
							}	
							img_id_array.push( uploaded_image.toJSON().id );
						});
						
						$(rel_image_url+"_display").html(''); //emptying target div
						$(rel_image_url).val(img_id_array);						

						if(img_id_array.length <= 1) {
							$('.fb-img-display-type-row').hide();
						} else {
							$('.fb-img-display-type-row').show();
						}						
						img_url_array.forEach(function (item, index) {
							var item_splitted = item.split('::');
						   $(rel_image_url+"_display").append("<div class='bg-image-list'><img src='"+item_splitted[0]+"' /><span rel-input='"+rel_image_url+"' rel='"+item_splitted[1]+"' class='img-remove'>X</span></div>");
						});
					});
					frame.open();					

				});
			
			//video upload
			$('.envbfb-video-upload-btn').click(function(e) {
					e.preventDefault();
					var rel_video_url = $(this).attr('rel');
					
					var frame = wp.media({
					title : 'Enweby Full Screen Media Upload',
					multiple : 'add',
					library : { type : 'video'},
					/*button : { text : 'Insert' },*/
				  });
						  
				  frame.on('open',function() {
					  var attachment;	
					  var selection = frame.state().get('selection');
					  var ids_value = jQuery(rel_video_url).val();
					  if(ids_value.length > 0) {
						var ids = ids_value.split(',');

						ids.forEach(function(id) {
						  attachment = wp.media.attachment(id);
						  attachment.fetch();
						  selection.add(attachment ? [attachment] : []);
						});
					  }					  

					});
				  
				  
				  frame.on('select', function(e){
						var uploaded_video = frame.state().get('selection');
						var vid_id_array = [];
						var vid_url_array = [];
						//$(rel_video_url).after(JSON.stringify(uploaded_video));
						var multiplesImages = uploaded_video.map( function(uploaded_video) {
							 /*if ( uploaded_video.toJSON().sizes ) {
							vid_url_array.push( uploaded_video.toJSON().url+"::"+ uploaded_video.toJSON().id ); //for image
								} else {
							vid_url_array.push( uploaded_video.toJSON().url+"::"+ uploaded_video.toJSON().id );	//for svg
							}*/
							vid_url_array.push( uploaded_video.toJSON().icon+"::"+ uploaded_video.toJSON().id+"::"+ uploaded_video.toJSON().filename );	//for video icon
							vid_id_array.push( uploaded_video.toJSON().id );
						});
						
						$(rel_video_url+"_display").html(''); //emptying target div
						$(rel_video_url).val(vid_id_array);						
						
						if(vid_id_array.length <= 1) {
							$('.fb-vid-display-type-row').hide();
						} else {
							$('.fb-vid-display-type-row').show();
						}										

										
						vid_url_array.forEach(function (item, index) {
							var item_splitted = item.split('::');
						   $(rel_video_url+"_display").append("<div class='bg-video-list'><p><img src='"+item_splitted[0]+"' /><span class='filename'>"+item_splitted[2]+"</span></p><span rel-input='"+rel_video_url+"' rel='"+item_splitted[1]+"' class='vid-remove'>X</span></div>");
						});
					});
					frame.open();
				});
			
			$( ".fb_image_url-row #upload-btn" ).click(function(){
				$(".fb-bg-image-background-size-row, .fb-bg-image-background-attachment-row, .fb-bg-image-background-position-row, .fb-bg-image-background-repeat-row").show();
			});

			$( "#use-page-wise-fb-settings" ).click(function(){
				if( $("#use-page-wise-fb-settings").is(":checked") ) {
					$(".enwb-fb-settings-wrapper").removeClass('faded-row');
				} else {
					$(".enwb-fb-settings-wrapper").addClass('faded-row');					
				}
			});
			
			$( 'input[name="fb-img-display-type"]' ).click(function(){
				
				if( 'slideshow' == $('input[name="fb-img-display-type"]:checked').val() ) {
					$('.fb-slideshow-extra').show();
				} else {
					$('.fb-slideshow-extra').hide();
				}	
			});
				
			$( ".fb-img-remove-single" ).click(function(){
				$( $( this ).attr('rel')).val('');
				$( this ).parent().children( '.fb-img-display' ).remove();
				$( '.'+$( this ).attr('rel-assoc' )+'-rel-bg-select').prop( "selectedIndex", 0 );
				$( this ).remove();
				
			});
			
			//should be added at end off script to prevent conflict to above js code
			if( $('#fb-custom-css').length ) {
				/*wp.codeEditor.initialize($('#fb-custom-css'), enwb_fb_settings);*/ //commented because it is blocking custom css saving in admin.
			}			
			
			/** end fb page/post wise */

		}
	);
})( jQuery );
