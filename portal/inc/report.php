<?php
/**
 * Handles both kinds of problem report from any portal page:
 * - "manual": the student clicked Report a Problem and described it.
 * - "auto": a JavaScript error or failed background save was detected
 *   automatically, without the student doing anything.
 * Both email info212english@gmail.com and keep a copy in the
 * h212_problem_reports option (last 200) for a future review screen.
 * Auto reports are rate-limited per distinct error (1 email/hour) so a
 * recurring bug can't flood the inbox - every occurrence is still
 * logged, just not re-emailed.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
	http_response_code( 405 );
	echo wp_json_encode( array( 'error' => 'Method not allowed.' ) );
	exit;
}

$body = json_decode( file_get_contents( 'php://input' ), true );

if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_report_problem' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page and try again.' ) );
	exit;
}

$type     = ( isset( $body['type'] ) && 'auto' === $body['type'] ) ? 'auto' : 'manual';
$message  = isset( $body['message'] )  ? sanitize_textarea_field( wp_unslash( $body['message'] ) ) : '';
$page     = isset( $body['page'] )     ? sanitize_text_field( wp_unslash( $body['page'] ) )         : '';
$filename = isset( $body['filename'] ) ? sanitize_text_field( wp_unslash( $body['filename'] ) )     : '';
$lineno   = isset( $body['lineno'] )   ? intval( $body['lineno'] )   : 0;
$colno    = isset( $body['colno'] )    ? intval( $body['colno'] )    : 0;
$stack    = isset( $body['stack'] )    ? sanitize_textarea_field( wp_unslash( $body['stack'] ) )    : '';

if ( '' === $message ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Please describe what happened.' ) );
	exit;
}

$student_name = trim( get_user_meta( $h212_user->ID, 'first_name', true ) . ' ' . get_user_meta( $h212_user->ID, 'last_name', true ) );
if ( '' === $student_name ) {
	$student_name = $h212_user->display_name;
}

$report = array(
	'type'          => $type,
	'student_name'  => $student_name,
	'student_login' => $h212_user->user_login,
	'page'          => $page,
	'message'       => $message,
	'filename'      => $filename,
	'lineno'        => $lineno,
	'colno'         => $colno,
	'stack'         => $stack,
	'date'          => current_time( 'mysql' ),
);

$reports   = get_option( 'h212_problem_reports', array() );
$reports   = is_array( $reports ) ? $reports : array();
$reports[] = $report;
if ( count( $reports ) > 200 ) {
	$reports = array_slice( $reports, -200 );
}
update_option( 'h212_problem_reports', $reports, false );

// Auto-detected errors: only email once per distinct error per hour,
// so the same recurring bug doesn't flood the inbox. Every occurrence
// is still logged above regardless.
$should_email = true;
if ( 'auto' === $type ) {
	$signature      = md5( $message . '|' . $filename . '|' . $lineno );
	$transient_key  = 'h212_err_' . $signature;
	if ( get_transient( $transient_key ) ) {
		$should_email = false;
	} else {
		set_transient( $transient_key, 1, HOUR_IN_SECONDS );
	}
}

if ( $should_email ) {
	$report_email = 'info212english@gmail.com';

	if ( 'auto' === $type ) {
		$subject    = '212 English Portal - Auto-detected error';
		$email_body = "An error was automatically detected (no report was filed by the student).\n\n"
			. "Student: {$student_name} ({$report['student_login']})\n"
			. "Page: {$page}\n"
			. "Time: {$report['date']}\n\n"
			. "Error: {$message}\n"
			. "File: {$filename}\n"
			. "Line: {$lineno}:{$colno}\n"
			. ( $stack ? "\nDetails:\n{$stack}\n" : '' );
	} else {
		$subject    = '212 English Portal - Problem report from ' . $student_name;
		$email_body = "Student: {$student_name} ({$report['student_login']})\n"
			. "Page: {$page}\n"
			. "Time: {$report['date']}\n\n"
			. "Message:\n{$message}\n";
	}

	wp_mail( $report_email, $subject, $email_body );
}

echo wp_json_encode( array( 'ok' => true ) );
