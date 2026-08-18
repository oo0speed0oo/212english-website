<?php
/**
 * Handles "Report a Problem" submissions from any portal page.
 * Emails info212english@gmail.com immediately, and keeps a copy in the
 * h212_problem_reports option (last 200) for a future review screen.
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

$message = isset( $body['message'] ) ? sanitize_textarea_field( wp_unslash( $body['message'] ) ) : '';
$page    = isset( $body['page'] )    ? sanitize_text_field( wp_unslash( $body['page'] ) )       : '';

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
	'student_name'  => $student_name,
	'student_login' => $h212_user->user_login,
	'page'          => $page,
	'message'       => $message,
	'date'          => current_time( 'mysql' ),
);

$reports   = get_option( 'h212_problem_reports', array() );
$reports   = is_array( $reports ) ? $reports : array();
$reports[] = $report;
if ( count( $reports ) > 200 ) {
	$reports = array_slice( $reports, -200 );
}
update_option( 'h212_problem_reports', $reports, false );

$report_email = 'info212english@gmail.com';
$subject      = '212 English Portal - Problem report from ' . $student_name;
$email_body  = "Student: {$student_name} ({$report['student_login']})\n"
	. "Page: {$page}\n"
	. "Time: {$report['date']}\n\n"
	. "Message:\n{$message}\n";
wp_mail( $report_email, $subject, $email_body );

echo wp_json_encode( array( 'ok' => true ) );
