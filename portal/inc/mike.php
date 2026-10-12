<?php
/**
 * Teacher Mike, drawn inline (so CSS can animate his eyes and mouth).
 * The picture itself is portal/images/mike.svg (pixel art with the parts
 * .eyes, .mouth-closed and .mouth-open).
 */
function h212_mike_svg( $width = 120, $extra_class = '' ) {
	static $cache = null;
	if ( null === $cache ) {
		$file  = __DIR__ . '/../images/mike.svg';
		$cache = file_exists( $file ) ? trim( file_get_contents( $file ) ) : '';
	}
	if ( '' === $cache ) {
		return '';
	}
	$height = (int) round( $width * 127 / 120 );
	$svg    = preg_replace( '/class="mike talking"/', 'class="mike' . ( $extra_class ? ' ' . esc_attr( $extra_class ) : '' ) . '"', $cache, 1 );
	$svg    = preg_replace( '/ width="\d+" height="\d+"/', ' width="' . (int) $width . '" height="' . $height . '"', $svg, 1 );
	return $svg;
}

/**
 * Mike's short reactions (correct / wrong / hint / quiz finished), each in
 * the page language with the other language underneath. Printed as
 * window.H212_MIKE for components/mike.js (including a small copy of Mike's
 * picture, which the quiz screens put on screen).
 */
function h212_mike_for_js() {
	$groups = array(
		'correct' => array( 'mike.correct_1', 'mike.correct_2', 'mike.correct_3', 'mike.correct_4' ),
		'wrong'   => array( 'mike.wrong_1', 'mike.wrong_2', 'mike.wrong_3' ),
		'finish_perfect' => array( 'mike.finish_perfect' ),
		'finish_good'    => array( 'mike.finish_good' ),
		'finish_try'     => array( 'mike.finish_try' ),
		'hint_photo'        => array( 'mike.hint_photo' ),
		'hint_vocabulary'   => array( 'mike.hint_vocabulary' ),
		'hint_grammar'      => array( 'mike.hint_grammar' ),
		'hint_builder'      => array( 'mike.hint_builder' ),
		'hint_listening'    => array( 'mike.hint_listening' ),
		'hint_conversation' => array( 'mike.hint_conversation' ),
		'hint_test'         => array( 'mike.hint_test' ),
	);
	$out = array( 'svg' => h212_mike_svg( 60 ) );
	foreach ( $groups as $name => $keys ) {
		$out[ $name ] = array();
		foreach ( $keys as $k ) {
			$out[ $name ][] = array( t( $k ), t_other( $k ) );
		}
	}
	echo '<script>window.H212_MIKE = ' . wp_json_encode( $out ) . ';</script>' . "\n";
}
