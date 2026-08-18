<?php
/**
 * 212 English School - Problem Reports review page (wp-admin only).
 *
 * Shows everything saved to the h212_problem_reports option by
 * portal/inc/report.php - both manual "Report a Problem" submissions
 * and auto-detected JavaScript errors, in one list.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Priority 20 so this always registers AFTER 212-teacher-results.php
// creates the "212 English" parent menu - see the note in that file
// about why registration order matters for submenu links.
add_action( 'admin_menu', function () {
	add_submenu_page(
		'h212-student-results',
		'Problem Reports',
		'Problem Reports',
		'manage_options',
		'h212-problem-reports',
		'h212_render_problem_reports_page'
	);
}, 20 );

add_action( 'admin_post_h212_clear_problem_reports', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'h212_clear_problem_reports' );
	delete_option( 'h212_problem_reports' );
	wp_safe_redirect( admin_url( 'admin.php?page=h212-problem-reports&cleared=1' ) );
	exit;
} );

function h212_render_problem_reports_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	echo '<div class="wrap"><h1>Problem Reports</h1>';

	if ( isset( $_GET['cleared'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>All reports cleared.</p></div>';
	}

	$reports = get_option( 'h212_problem_reports', array() );
	$reports = is_array( $reports ) ? $reports : array();
	$reports = array_reverse( $reports ); // most recent first

	$filter = isset( $_GET['type'] ) ? sanitize_text_field( $_GET['type'] ) : '';
	if ( in_array( $filter, array( 'manual', 'auto' ), true ) ) {
		$reports = array_values( array_filter( $reports, function ( $r ) use ( $filter ) {
			return isset( $r['type'] ) && $r['type'] === $filter;
		} ) );
	}

	echo '<form method="get" style="margin:16px 0;display:inline-block;">';
	echo '<input type="hidden" name="page" value="h212-problem-reports" />';
	echo '<select name="type" onchange="this.form.submit()">';
	echo '<option value="">All Types</option>';
	printf( '<option value="manual" %s>Manual reports only</option>', selected( $filter, 'manual', false ) );
	printf( '<option value="auto" %s>Auto-detected only</option>', selected( $filter, 'auto', false ) );
	echo '</select>';
	echo '</form>';

	$clear_url = wp_nonce_url( admin_url( 'admin-post.php?action=h212_clear_problem_reports' ), 'h212_clear_problem_reports' );
	echo ' <a href="' . esc_url( $clear_url ) . '" class="button" onclick="return confirm(\'Clear all problem reports? This cannot be undone.\');">Clear All Reports</a>';

	if ( ! $reports ) {
		echo '<p style="margin-top:20px;">No reports' . ( $filter ? ' of this type' : '' ) . ' yet.</p></div>';
		return;
	}

	echo '<div style="overflow-x:auto;"><table class="widefat striped" style="margin-top:16px;min-width:900px;"><thead><tr>'
		. '<th style="width:140px;">Date</th><th style="width:80px;">Type</th><th style="width:160px;">Student</th><th style="width:160px;">Page</th><th>Details</th>'
		. '</tr></thead><tbody>';

	foreach ( $reports as $r ) {
		$type       = isset( $r['type'] ) ? $r['type'] : 'manual';
		$type_label = 'auto' === $type
			? '<span style="color:#b3261e;font-weight:600;">Auto</span>'
			: '<span style="color:#2271b1;font-weight:600;">Manual</span>';

		$details = esc_html( $r['message'] );
		if ( 'auto' === $type && ! empty( $r['filename'] ) ) {
			$details .= '<br><code style="font-size:11px;color:#666;">' . esc_html( $r['filename'] ) . ':' . (int) $r['lineno'] . '</code>';
		}

		printf(
			'<tr><td style="white-space:nowrap;">%s</td><td>%s</td><td>%s<br><span style="color:#666;font-size:12px;">%s</span></td><td>%s</td><td>%s</td></tr>',
			esc_html( $r['date'] ),
			$type_label,
			esc_html( $r['student_name'] ),
			esc_html( isset( $r['student_login'] ) ? $r['student_login'] : '' ),
			esc_html( isset( $r['page'] ) ? $r['page'] : '' ),
			$details
		);
	}

	echo '</tbody></table></div></div>';
}
