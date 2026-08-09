<?php
/**
 * 212 English School - Student Portal Integration
 *
 * Registers a "Student" role and adds Birthday/Location/Phone fields
 * to the standard WordPress user profile screen, so students can be
 * managed entirely from wp-admin > Users like any other WordPress user.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Register the Student role. Runs on every load but only acts once.
add_action( 'init', function () {
	if ( ! get_role( 'student' ) ) {
		add_role( 'student', 'Student', array( 'read' => true ) );
	}
} );

// Students never need wp-admin - send them back to the portal instead.
add_action( 'admin_init', function () {
	if ( wp_doing_ajax() || ! is_admin() ) {
		return;
	}
	$user = wp_get_current_user();
	if ( in_array( 'student', (array) $user->roles, true ) ) {
		wp_safe_redirect( home_url( '/portal/dashboard.php' ) );
		exit;
	}
} );

// Hide the admin toolbar on the front end for students.
add_filter( 'show_admin_bar', function ( $show ) {
	if ( current_user_can( 'student' ) && ! current_user_can( 'administrator' ) ) {
		return false;
	}
	return $show;
} );

// Add Birthday / Location / Phone fields to the Edit User screen.
function h212_student_profile_fields( $user ) {
	?>
	<h2>212 English School - Student Details</h2>
	<table class="form-table">
		<tr>
			<th><label for="h212_birthday">Birthday</label></th>
			<td><input type="date" name="h212_birthday" id="h212_birthday"
				value="<?php echo esc_attr( get_user_meta( $user->ID, 'h212_birthday', true ) ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="h212_location">Location (Prefecture)</label></th>
			<td><input type="text" name="h212_location" id="h212_location" class="regular-text"
				value="<?php echo esc_attr( get_user_meta( $user->ID, 'h212_location', true ) ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="h212_phone">Phone</label></th>
			<td><input type="text" name="h212_phone" id="h212_phone" class="regular-text"
				value="<?php echo esc_attr( get_user_meta( $user->ID, 'h212_phone', true ) ); ?>" /></td>
		</tr>
	</table>
	<?php
}
add_action( 'show_user_profile', 'h212_student_profile_fields' );
add_action( 'edit_user_profile', 'h212_student_profile_fields' );

function h212_save_student_profile_fields( $user_id ) {
	if ( ! current_user_can( 'edit_user', $user_id ) ) {
		return;
	}
	if ( isset( $_POST['h212_birthday'] ) ) {
		update_user_meta( $user_id, 'h212_birthday', sanitize_text_field( wp_unslash( $_POST['h212_birthday'] ) ) );
	}
	if ( isset( $_POST['h212_location'] ) ) {
		update_user_meta( $user_id, 'h212_location', sanitize_text_field( wp_unslash( $_POST['h212_location'] ) ) );
	}
	if ( isset( $_POST['h212_phone'] ) ) {
		update_user_meta( $user_id, 'h212_phone', sanitize_text_field( wp_unslash( $_POST['h212_phone'] ) ) );
	}
}
add_action( 'personal_options_update', 'h212_save_student_profile_fields' );
add_action( 'edit_user_profile_update', 'h212_save_student_profile_fields' );
