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
namespace Enwbfb\Enweby\SettingsFunctions;
 
class Setting_Functions {

	/**
     * Process validate settings.
     *
     * @param  string $field_type [description].
     * @param  string $value      [description].
     * @return string             [description].
     */
    public function process_validate_settings( $field_type, $value )
    {
        switch ( $field_type ) {
            case 'text':
                $value = $this->sanitize_text( $value );
                break;
            case 'color':
                $value = $this->sanitize_color( $value );
                break;
            case 'number':
                $value = $this->sanitize_number( $value );
                break;
            case 'toggle':
                $value = $this->sanitize_number( $value );
                break;
            case 'checkboxes':
                $value = $this->sanitize_checkboxes( $value );
                break;
            case 'radio':
                $value = $this->sanitize_text( $value );
                break;
            case 'code_editor':
                $value = $this->sanitize_editor( $value );
                break;
            case 'htmltext':
                $value = $this->sanitize_editor( $value );
                break;
            case 'textarea':
                $value = $this->sanitize_textarea( $value );
                break;
        }
        return $value;
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_text( $value )
    {
        return ( !empty($value) ? sanitize_text_field( $value ) : '' );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_number( $value )
    {
        return ( is_numeric( $value ) ? $value : 0 );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_editor( $value )
    {
        return wp_kses_post( $value );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_textarea( $value )
    {
        return sanitize_textarea_field( $value );
    }
    
    // phpcs:disable
    /* public function sanitize_checkbox( $value ) {
    		return ( '1' === $value ) ? 1 : 0;
    	}*/
    // phpcs:enable
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_checkboxes( $value )
    {
        
        if ( is_array( $value ) ) {
            foreach ( $value as $key => $item ) {
                $value[$key] = $this->sanitize_text( $item );
            }
        } else {
            $value = $this->sanitize_text( $value );
        }
        
        return $value;
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_select( $value )
    {
        return $this->sanitize_text( $value );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_radio( $value )
    {
        return $this->sanitize_text( $value );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_color( $value )
    {
        return sanitize_hex_color( $value );
    }
    
    /**
     * Sanitizing value.
     *
     * @param  string $value field value.
     * @return string.
     */
    public function sanitize_url( $value )
    {
        return esc_url_raw( $value );
    }


}