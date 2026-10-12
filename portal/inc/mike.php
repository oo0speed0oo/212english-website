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
