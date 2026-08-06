<?php
/**
 * Settings Framework
 *
 * @link       https://www.enweby.com/
 * @since      1.0.0
 *
 * @package    Fullscreen_Background
 * @subpackage Fullscreen_Background/admin
 */

add_filter( 'wpsf_register_settings_' . ENWEBY_FB_FWAS . '', 'enwbfs_fullscreen_background_wpsf_tabless_settings' );

/**
 * Tabless example.
 *
 * @param array $wpsf_settings Settings.
 */
function enwbfs_fullscreen_background_wpsf_tabless_settings( $wpsf_settings ) {
	// General Settings section.
	$wpsf_settings['tabless_settings'] = array(
		'section_id'    => 'fb_general_section',
		'section_title' => 'Fullscreen Background Global Settings',
		'section_order' => 1,
		'fields'        => 
		array(
	
			array(
				'id'       => 'fb_display_options',
				'title'    => 'Select Page to Display Fullscreen Background',
				'subtitle' => '',
				'type'     => 'select',
				'choices'  => array(
						'home' => __( 'Home Page Only', 'fullscreen-background' ),
						'all'  => __( 'All Pages', 'fullscreen-background' ),
						'page' => __( 'Specific Page', 'fullscreen-background' ),
						'post' => __( 'Specific post', 'fullscreen-background' ),
				),
				'default'  => 'home',
				'class'	   => 'regular-text',
			),
					
			array(
				'id'      => 'fb_page_field_id',
				'title'   => __( 'Select Page', 'fullscreen-background' ),
				'type'    => 'pages',
				'class'  => 'regular-text',				
				),
			array(
				'id'      => 'fb_post_field_id',
				'title'   => __( 'Select Post', 'fullscreen-background' ),
				'type'    => 'posts',
				'class'  => 'regular-text',
			),
			array(
				'id'      => 'fb_background_type',
				'title'   => __( 'Fullscreen Background Type', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'image' => __( 'Image', 'fullscreen-background' ),
					'video' => __( 'Video', 'fullscreen-background' ),
					'color' => __( 'Color', 'fullscreen-background' ),
				),
				'class'	   => 'regular-text',
			),
			array(
				'id'      => 'fb_bg_image',
				'title'   => __( 'Add/Edit Background Image', 'fullscreen-background' ),
				'desc'    => __( 'Add/Edit Background Image', 'fullscreen-background' ),
				'type'    => 'image',
			),
			array(
				'id'      => 'fb_bg_video',
				'title'   => __( 'Add/Edit Background Video', 'fullscreen-background' ),
				'desc'    => __( 'Add/Edit Background Video here', 'fullscreen-background' ),
				'type'    => 'file',
				'default' => '',				
			),
			array(
				'id'    => 'fb_bg_color',
				'title' => __( 'Select Background Color', 'fullscreen-background' ),
				'type'  => 'color',
				'default' => '#ffffff',
				'class'	   => 'regular-text',
			),
		
			array(
				'id'      => 'fb_img_display_type',
				'title'   => __( 'Background Image Display Layout Type', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'single'   => __( 'First image as background image', 'fullscreen-background' ),
					'random' => __( 'Different image as background every time page refreshes	', 'fullscreen-background' ),
					'slideshow' => __( 'Background image slideshow', 'fullscreen-background' ),
				),
				'default'  => 'slideshow',
				'class'	   => 'fb-img-display-type-elm',
			),
			
			array(
				'id'    => 'fb-slide-delay',
				'title' => __( 'Slide Transition Delay (in seconds)', 'fullscreen-background' ),
				'type'  => 'number',
				'default' => '5',
				'class'	   => 'fb-img-display-type-elm transition-effects',
			),
			
			array(
				'id'    => 'fb-fade-animation-time',
				'title' => __( 'Slide Fade Animation Time (in seconds)', 'fullscreen-background' ),
				'type'  => 'number',
				'default' => '2',
				'class'	   => 'fb-img-display-type-elm animation-time',
			),
			
			array(
				'id'      => 'fb_slideshow_type',
				'title'   => __( 'Slide Transition Method', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'fade'   => __( 'Fade In', 'fullscreen-background' ),
					'fade-and-zoom' => __( 'Fade In with zoom effect', 'fullscreen-background' ),
					'fade-and-zoom-rotate' => __( 'Fade In with rotating and zoom effect', 'fullscreen-background' ),
				),
				'default'  => 'fade-and-zoom',
				'class'	   => 'fb-img-display-type-elm transition-effects',
			),
			
			array(
				'id'      => 'fb_slideshow_image_random',
				'title'   => __( 'Enable slideshow random image display', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'2'   => __( 'Disable', 'fullscreen-background' ),
					'1'  => __( 'Enable', 'fullscreen-background' ),
				),
				'default'  => '2',
				'class'	   => '',
			),		
			
			/*array(
				'id'      => 'fb_slideshow_shadow',
				'title'   => __( 'Enable Shadow on Slides', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'0'   => __( 'Disable shadow on slides', 'fullscreen-background' ),
					'1'   => __( 'Enable shadow on slides', 'fullscreen-background' ),
				),
				'default'  => '0',
				'class'	   => 'fb-img-display-type-elm transition-effects',
			),*/
			
			array(
				'id'      => 'fb_vid_display_type',
				'title'   => __( 'Background Video Display Layout Type', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'single'   => __( 'First video as background video', 'fullscreen-background' ),
					'random'   => __( 'Different Video as background video every time page refreshes', 'fullscreen-background' ),
				),
				'default'  => 'single',
				'class'	   => 'fb-vid-display-type-elm',
			),
			
			array(
				'id'      => 'fb_video_background_position',
				'title'   => __( 'Background Position', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'fixed'    => __( 'Fixed', 'fullscreen-background' ),
					'relative' => __( 'Relative', 'fullscreen-background' ),
					'absolute' => __( 'Absolute', 'fullscreen-background' ),
					'static' => __( 'Static', 'fullscreen-background' ),
					'inherit'  => __( 'Inherit', 'fullscreen-background' ),
				),
				'default'  => 'fixed',
				'class'	   => 'regular-text',
			),
			
			
			array(
				'id'      => 'fb_video_background_fit',
				'title'   => __( 'Video Object Fit', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'cover'   => __( 'Cover', 'fullscreen-background' ),
					'contain' => __( 'Contain', 'fullscreen-background' ),
					'inherit' => __( 'Inherit', 'fullscreen-background' ),
					'initial' => __( 'Initial', 'fullscreen-background' ),
				),
				'default'  => 'cover',
				'class'	   => 'regular-text',
			),
			array(
				'id'      => 'fb_background_size',
				'title'   => __( 'Background Size', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'cover'   => __( 'Cover', 'fullscreen-background' ),
					'contain' => __( 'Contain', 'fullscreen-background' ),
					'inherit' => __( 'Inherit', 'fullscreen-background' ),
					'initial' => __( 'Initial', 'fullscreen-background' ),
				),
				'default'  => 'cover',
				'class'	   => 'regular-text',
			),

			array(
				'id'      => 'fb_background_position',
				'title'   => __( 'Background Position', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
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
				'default'  => 'center center',
				'class'	   => 'regular-text',
			),
			array(
				'id'      => 'fb_background_attachment',
				'title'   => __( 'Background Attachment', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'fixed'   => __( 'Fixed', 'fullscreen-background' ),
					'scroll'  => __( 'Scroll', 'fullscreen-background' ),
					'local'   => __( 'Local', 'fullscreen-background' ),
					'inherit' => __( 'Inherit', 'fullscreen-background' ),
					'initial' => __( 'Initial', 'fullscreen-background' ),
				),
				'default'  => 'fixed',
				'class'	   => 'regular-text',
			),
			
			array(
				'id'      => 'fb_video_loop',
				'title'   => __( 'Disable Video Play Loop', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'2'   => __( 'No (Default)', 'fullscreen-background' ),
					'1'  => __( 'Yes', 'fullscreen-background' ),
				),
				'default'  => '2',
				'class'	   => 'regular-text',
			),
			
			/*array(
				'id'      => 'fb_video_mute',
				'title'   => __( 'Mute Video', 'fullscreen-background' ),
				'type'    => 'select',
				'choices' => array(
					'1'   => __( 'Yes', 'fullscreen-background' ),
					'2'   => __( 'No', 'fullscreen-background' ),					
					
				),
				'default'  => '1',
				'class'	   => 'regular-text',
			),*/

			array(
				'id'      => 'fb_common_shadow',
				'title'   => __( 'Enable shadow', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'2'   => __( 'Disable', 'fullscreen-background' ),
					'1'  => __( 'Enable', 'fullscreen-background' ),
				),
				'default'  => '2',
				'class'	   => '',
			),				
			
			array(
				'id'      => 'fb_make_header_transparent',
				'title'   => __( 'Make header transparent', 'fullscreen-background' ),
				'type'    => 'radio',
				'choices' => array(
					'2'   => __( 'Disable', 'fullscreen-background' ),
					'1'  => __( 'Enable', 'fullscreen-background' ),
				),
				'default'  => '2',
				'class'	   => '',
			),			
			
			array(
				'id'    => 'fb_remove_elements_bg',
				'title' => __( 'Remove Background of multiple elements at once (Optional)', 'fullscreen-background' ),
				'subtitle' => 'Make any element transparent',
				'type'  => 'text',
				'desc' => 'Add comma separated elements by class or id to remove background from those elements. For example use .element-class, #element-id, .custom-class, #my-element-id',	
				'class'	   => 'regular-text',
			),
			/*array(
				'id'      => 'fb_disable_global_settings',
				'title'   => __( 'Disable global Settings', 'fullscreen-background' ),
				'type'    => 'checkbox',
				'choices' => array(
					'1'  => __( 'Enable', 'fullscreen-background' ),
					'2'   => __( 'Disable', 'fullscreen-background' ),					
				),
				'default'  => '',
				'class'	   => '',
			),*/
		),
	);

	return $wpsf_settings;
}

/**
 * Tabbed example.
 *
 * @param array $wpsf_settings settings.
 */
function enwbfs_fullscreen_background_wpsf_tabbed_settings( $wpsf_settings ) {
	// Tabs.
	$wpsf_settings['tabs'] = array(
		array(
			'id'    => 'general',
			'title' => esc_html__( 'General', 'fullscreen-background' ),
		),
	array(
			'id'    => 'advanced',
			'title' => esc_html__( 'advanced', 'fullscreen-background' ),
		),			
	);

	// Settings.
	$wpsf_settings['sections'] = array(
		array(
			'tab_id'        => 'general',
			'section_id'    => 'section_general',
			'section_title' => 'General Settings',
			'section_order' => 10,
			'fields'        => array(
				array(
					'id'      => 'enwbvs-enable-toolip-on-swatches',
					'title'   => 'Enable Full Screen Background.',
					'type'    => 'toggle',
					'default' => '0',
				),
			)

		)
	);
	
	$wpsf_settings['sections'] = array(
		array(
			'tab_id'        => 'advanced',
			'section_id'    => 'section_special',
			'section_title' => 'Special Settings',
			'section_order' => 10,
			'fields'        => array(
				array(
					'id'      => 'enwbvs-enable-toolip-on-swatches-special',
					'title'   => 'Enable Sppecial Screen Background.',
					'type'    => 'toggle',
					'default' => '0',
				),
			)

		)
	);
	return $wpsf_settings;
}
