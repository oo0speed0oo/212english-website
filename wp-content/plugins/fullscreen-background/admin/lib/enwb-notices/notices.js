/**
 * Customizer controls toggles
 *
 * @package Enwb
 */

( function( $ ) {

	/**
	 * Helper class for the main Customizer interface.
	 *
	 * @since 1.0.0
	 * @class ASTCustomizer
	 */
	EnwbNotices = {

		/**
		 * Initializes our custom logic for the Customizer.
		 *
		 * @since 1.0.0
		 * @method init
		 */
		init: function()
		{
			this._bind();
		},

		/**
		 * Binds events.
		 *
		 * @since 1.0.0
		 * @access private
		 * @method _bind
		 */
		_bind: function()
		{
			$( document ).on('click', '.enwb-notice-close', EnwbNotices._dismissNoticeNew );
			$( document ).on('click', '.enwb-notice .notice-dismiss', EnwbNotices._dismissNotice );
		},

		_dismissNotice: function( event ) {
			event.preventDefault();

			/*var repeat_notice_after = $( this ).parents('.enwb-notice').data( 'repeat-notice-after' ) || '';
			var notice_id = $( this ).parents('.enwb-notice').attr( 'id' ) || '';

			EnwbNotices._ajax( notice_id, repeat_notice_after );*/
			$( this ).parents('.enwb-notice').remove();
		},

		_dismissNoticeNew: function( event ) {
			event.preventDefault();

			var repeat_notice_after = $( this ).attr( 'data-repeat-notice-after' ) || '';
			var notice_id = $( this ).parents('.enwb-notice').attr( 'id' ) || '';

			var $el = $( this ).parents('.enwb-notice');
			$el.fadeTo( 100, 0, function() {
				$el.slideUp( 100, function() {
					$el.remove();
				});
			});

			EnwbNotices._ajax( notice_id, repeat_notice_after );

			var link   = $( this ).attr( 'href' ) || '';
			var target = $( this ).attr( 'target' ) || '';
			if( '' !== link && '_blank' === target ) {
				window.open(link , '_blank');
			}
		},

		_ajax: function( notice_id, repeat_notice_after ) {
			
			if( '' === notice_id ) {
				return;
			}

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: {
					action            : 'enwb-notice-dismiss',
					nonce             : enwbNotices._notice_nonce,
					notice_id         : notice_id,
					repeat_notice_after : parseInt( repeat_notice_after ),
				},
			});

		}
	};

	$( function() {
		EnwbNotices.init();
	} );
} )( jQuery );