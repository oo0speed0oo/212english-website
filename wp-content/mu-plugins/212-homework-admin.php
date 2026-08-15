<?php
/**
 * 212 English School - Homework Question manager (wp-admin only).
 *
 * Lets an administrator add/edit/delete homework & test questions, and
 * upload the photo/audio file for a question, without hand-editing
 * portal/homework-content.csv. Still stores everything in that same
 * CSV file (portal/homework.php reads it directly) - this just adds a
 * proper UI on top of it instead of replacing the storage.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Priority 20 (later than the default 10) so this always registers
// AFTER 212-teacher-results.php creates the "212 English" parent menu
// and its "Student Results" item - otherwise, depending on mu-plugin
// file load order, this page can register as the parent's "first"
// submenu item instead, which WordPress links incorrectly (it assumes
// the first submenu IS the parent page and builds a broken URL for it).
add_action( 'admin_menu', function () {
	add_submenu_page(
		'h212-student-results',
		'Homework Questions',
		'Homework Questions',
		'manage_options',
		'h212-homework-questions',
		'h212_render_homework_admin_page'
	);
}, 20 );

// ── CSV read/write ──────────────────────────────────

function h212_hwadmin_csv_path() {
	return ABSPATH . 'portal/homework-content.csv';
}

function h212_hwadmin_header() {
	return array( 'id', 'level', 'chapter', 'type', 'question', 'choice_a', 'choice_b', 'choice_c', 'answer', 'image', 'audio' );
}

function h212_hwadmin_read_rows() {
	$path = h212_hwadmin_csv_path();
	if ( ! file_exists( $path ) ) {
		return array();
	}
	$fh = fopen( $path, 'r' );
	if ( ! $fh ) {
		return array();
	}
	$header = fgetcsv( $fh );
	if ( ! $header ) {
		fclose( $fh );
		return array();
	}
	$header = array_map( function ( $h ) { return strtolower( trim( $h ) ); }, $header );
	$rows   = array();
	while ( ( $line = fgetcsv( $fh ) ) !== false ) {
		if ( count( $line ) < count( $header ) ) {
			continue;
		}
		$row = array_combine( $header, $line );
		if ( empty( $row['level'] ) || empty( $row['type'] ) ) {
			continue;
		}
		$rows[] = $row;
	}
	fclose( $fh );
	return $rows;
}

function h212_hwadmin_write_rows( $rows ) {
	$path   = h212_hwadmin_csv_path();
	$header = h212_hwadmin_header();

	usort( $rows, function ( $a, $b ) {
		if ( (int) $a['level'] !== (int) $b['level'] ) {
			return (int) $a['level'] <=> (int) $b['level'];
		}
		if ( (int) $a['chapter'] !== (int) $b['chapter'] ) {
			return (int) $a['chapter'] <=> (int) $b['chapter'];
		}
		return (int) $a['id'] <=> (int) $b['id'];
	} );

	$fh = fopen( $path, 'w' );
	fputcsv( $fh, $header );
	foreach ( $rows as $row ) {
		$line = array();
		foreach ( $header as $col ) {
			$line[] = isset( $row[ $col ] ) ? $row[ $col ] : '';
		}
		fputcsv( $fh, $line );
	}
	fclose( $fh );
}

function h212_hwadmin_next_id( $rows ) {
	$max = 0;
	foreach ( $rows as $r ) {
		$max = max( $max, intval( $r['id'] ) );
	}
	return (string) ( $max + 1 );
}

// ── File upload handling ────────────────────────────

function h212_hwadmin_handle_upload( $file, $allowed_exts, $dest_dir ) {
	if ( ! empty( $file['error'] ) && UPLOAD_ERR_OK !== $file['error'] ) {
		return new WP_Error( 'upload_error', 'Upload failed.' );
	}
	$name = sanitize_file_name( $file['name'] );
	$ext  = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
	if ( ! in_array( $ext, $allowed_exts, true ) ) {
		return new WP_Error( 'bad_ext', 'File type not allowed: .' . $ext );
	}
	if ( ! file_exists( $dest_dir ) ) {
		wp_mkdir_p( $dest_dir );
	}
	$base   = pathinfo( $name, PATHINFO_FILENAME );
	$target = trailingslashit( $dest_dir ) . $name;
	if ( file_exists( $target ) ) {
		$name   = $base . '-' . time() . '.' . $ext;
		$target = trailingslashit( $dest_dir ) . $name;
	}
	if ( ! is_uploaded_file( $file['tmp_name'] ) || ! move_uploaded_file( $file['tmp_name'], $target ) ) {
		return new WP_Error( 'move_failed', 'Could not save the uploaded file.' );
	}
	return $name;
}

// ── Save / delete handlers ──────────────────────────

add_action( 'admin_post_h212_save_question', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'h212_save_question' );

	$id       = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : '';
	$is_new   = ( '' === $id );
	$level    = isset( $_POST['level'] ) ? intval( $_POST['level'] ) : 0;
	$chapter  = isset( $_POST['chapter'] ) ? intval( $_POST['chapter'] ) : 0;
	$type     = isset( $_POST['type'] ) ? sanitize_text_field( $_POST['type'] ) : '';
	$question = isset( $_POST['question'] ) ? sanitize_text_field( wp_unslash( $_POST['question'] ) ) : '';
	$choice_a = isset( $_POST['choice_a'] ) ? sanitize_text_field( wp_unslash( $_POST['choice_a'] ) ) : '';
	$choice_b = isset( $_POST['choice_b'] ) ? sanitize_text_field( wp_unslash( $_POST['choice_b'] ) ) : '';
	$choice_c = isset( $_POST['choice_c'] ) ? sanitize_text_field( wp_unslash( $_POST['choice_c'] ) ) : '';
	$answer   = isset( $_POST['answer'] ) ? sanitize_text_field( wp_unslash( $_POST['answer'] ) ) : '';

	$back = admin_url( 'admin.php?page=h212-homework-questions&action=' . ( $is_new ? 'new' : 'edit&id=' . urlencode( $id ) ) );

	$errors = array();
	if ( $level < 1 || $level > 5 ) {
		$errors[] = 'Please choose a level.';
	}
	if ( $chapter < 1 || $chapter > 16 ) {
		$errors[] = 'Please choose a chapter.';
	}
	if ( ! in_array( $type, array( 'vocabulary', 'grammar', 'listening', 'photo' ), true ) ) {
		$errors[] = 'Please choose a type.';
	}
	if ( '' === $question ) {
		$errors[] = 'Question text is required.';
	}
	if ( '' === $choice_a || '' === $choice_b || '' === $choice_c ) {
		$errors[] = 'All 3 choices are required.';
	}
	if ( '' === $answer ) {
		$errors[] = 'Correct answer is required.';
	} elseif ( ! in_array( $answer, array( $choice_a, $choice_b, $choice_c ), true ) ) {
		$errors[] = 'The correct answer must exactly match one of the 3 choices.';
	}

	if ( $errors ) {
		wp_safe_redirect( $back . '&error=' . urlencode( implode( ' ', $errors ) ) );
		exit;
	}

	$rows = h212_hwadmin_read_rows();

	$existing_image = '';
	$existing_audio = '';
	if ( ! $is_new ) {
		foreach ( $rows as $r ) {
			if ( $r['id'] === $id ) {
				$existing_image = $r['image'];
				$existing_audio = $r['audio'];
				break;
			}
		}
	}

	$image = $existing_image;
	if ( ! empty( $_FILES['image_upload']['name'] ) ) {
		$saved = h212_hwadmin_handle_upload( $_FILES['image_upload'], array( 'jpg', 'jpeg', 'png', 'gif', 'webp' ), ABSPATH . 'portal/images/vocab' );
		if ( is_wp_error( $saved ) ) {
			wp_safe_redirect( $back . '&error=' . urlencode( $saved->get_error_message() ) );
			exit;
		}
		$image = $saved;
	}

	$audio = $existing_audio;
	if ( ! empty( $_FILES['audio_upload']['name'] ) ) {
		$saved = h212_hwadmin_handle_upload( $_FILES['audio_upload'], array( 'mp3', 'wav', 'ogg', 'm4a' ), ABSPATH . 'portal/audio' );
		if ( is_wp_error( $saved ) ) {
			wp_safe_redirect( $back . '&error=' . urlencode( $saved->get_error_message() ) );
			exit;
		}
		$audio = $saved;
	}

	$new_row = array(
		'id'       => $is_new ? h212_hwadmin_next_id( $rows ) : $id,
		'level'    => $level,
		'chapter'  => $chapter,
		'type'     => $type,
		'question' => $question,
		'choice_a' => $choice_a,
		'choice_b' => $choice_b,
		'choice_c' => $choice_c,
		'answer'   => $answer,
		'image'    => $image,
		'audio'    => $audio,
	);

	if ( $is_new ) {
		$rows[] = $new_row;
	} else {
		foreach ( $rows as $i => $r ) {
			if ( $r['id'] === $id ) {
				$rows[ $i ] = $new_row;
				break;
			}
		}
	}

	h212_hwadmin_write_rows( $rows );

	wp_safe_redirect( admin_url( 'admin.php?page=h212-homework-questions&saved=1' ) );
	exit;
} );

add_action( 'admin_post_h212_delete_question', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	$id = isset( $_GET['id'] ) ? sanitize_text_field( $_GET['id'] ) : '';
	check_admin_referer( 'h212_delete_question_' . $id );

	$rows = h212_hwadmin_read_rows();
	$rows = array_values( array_filter( $rows, function ( $r ) use ( $id ) { return $r['id'] !== $id; } ) );
	h212_hwadmin_write_rows( $rows );

	wp_safe_redirect( admin_url( 'admin.php?page=h212-homework-questions&deleted=1' ) );
	exit;
} );

// ── Rendering ────────────────────────────────────────

function h212_render_homework_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	echo '<div class="wrap"><h1>Homework Questions ';
	echo '<a href="' . esc_url( admin_url( 'admin.php?page=h212-homework-questions&action=new' ) ) . '" class="page-title-action">Add New</a>';
	echo '</h1>';

	if ( isset( $_GET['saved'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>Question saved.</p></div>';
	}
	if ( isset( $_GET['deleted'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>Question deleted.</p></div>';
	}
	if ( isset( $_GET['error'] ) ) {
		echo '<div class="notice notice-error is-dismissible"><p>' . esc_html( urldecode( $_GET['error'] ) ) . '</p></div>';
	}

	$action = isset( $_GET['action'] ) ? sanitize_text_field( $_GET['action'] ) : 'list';

	if ( 'new' === $action || 'edit' === $action ) {
		h212_render_question_form( $action );
	} else {
		h212_render_question_list();
	}

	echo '</div>';
}

function h212_render_question_list() {
	$rows = h212_hwadmin_read_rows();
	usort( $rows, function ( $a, $b ) {
		if ( (int) $a['level'] !== (int) $b['level'] ) {
			return (int) $a['level'] <=> (int) $b['level'];
		}
		if ( (int) $a['chapter'] !== (int) $b['chapter'] ) {
			return (int) $a['chapter'] <=> (int) $b['chapter'];
		}
		return (int) $a['id'] <=> (int) $b['id'];
	} );

	$filter_level = isset( $_GET['level'] ) && '' !== $_GET['level'] ? intval( $_GET['level'] ) : 0;
	if ( $filter_level ) {
		$rows = array_values( array_filter( $rows, function ( $r ) use ( $filter_level ) {
			return (int) $r['level'] === $filter_level;
		} ) );
	}

	echo '<form method="get" style="margin:16px 0;">';
	echo '<input type="hidden" name="page" value="h212-homework-questions" />';
	echo '<select name="level" onchange="this.form.submit()"><option value="">All Levels</option>';
	for ( $l = 1; $l <= 5; $l++ ) {
		printf( '<option value="%d" %s>Level %d</option>', $l, selected( $filter_level, $l, false ), $l );
	}
	echo '</select></form>';

	echo '<table class="widefat striped"><thead><tr><th>ID</th><th>Level</th><th>Chapter</th><th>Type</th><th>Question</th><th>Answer</th><th>Image</th><th>Audio</th><th>Actions</th></tr></thead><tbody>';
	if ( ! $rows ) {
		echo '<tr><td colspan="9">No questions yet.</td></tr>';
	}
	foreach ( $rows as $r ) {
		$edit_url   = admin_url( 'admin.php?page=h212-homework-questions&action=edit&id=' . urlencode( $r['id'] ) );
		$delete_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=h212_delete_question&id=' . urlencode( $r['id'] ) ),
			'h212_delete_question_' . $r['id']
		);
		printf(
			'<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td><a href="%s">Edit</a> | <a href="%s" onclick="return confirm(\'Delete this question? This cannot be undone.\');" style="color:#b3261e;">Delete</a></td></tr>',
			esc_html( $r['id'] ),
			(int) $r['level'],
			(int) $r['chapter'],
			esc_html( ucfirst( $r['type'] ) ),
			esc_html( mb_strimwidth( $r['question'], 0, 60, '…' ) ),
			esc_html( $r['answer'] ),
			esc_html( $r['image'] ),
			esc_html( $r['audio'] ),
			esc_url( $edit_url ),
			esc_url( $delete_url )
		);
	}
	echo '</tbody></table>';
}

function h212_render_question_form( $action ) {
	$row = array(
		'id' => '', 'level' => 1, 'chapter' => 1, 'type' => 'vocabulary',
		'question' => '', 'choice_a' => '', 'choice_b' => '', 'choice_c' => '',
		'answer' => '', 'image' => '', 'audio' => '',
	);

	if ( 'edit' === $action ) {
		$id   = isset( $_GET['id'] ) ? sanitize_text_field( $_GET['id'] ) : '';
		$rows = h212_hwadmin_read_rows();
		foreach ( $rows as $r ) {
			if ( $r['id'] === $id ) {
				$row = $r;
				break;
			}
		}
		if ( '' === $row['id'] ) {
			echo '<p>Question not found.</p>';
			return;
		}
	}

	echo '<h2>' . ( 'edit' === $action ? 'Edit Question #' . esc_html( $row['id'] ) : 'Add New Question' ) . '</h2>';
	echo '<form method="post" enctype="multipart/form-data" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'h212_save_question' );
	echo '<input type="hidden" name="action" value="h212_save_question" />';
	echo '<input type="hidden" name="id" value="' . esc_attr( $row['id'] ) . '" />';

	echo '<table class="form-table"><tbody>';

	echo '<tr><th><label>Level</label></th><td><select name="level">';
	for ( $l = 1; $l <= 5; $l++ ) {
		printf( '<option value="%d" %s>Level %d</option>', $l, selected( (int) $row['level'], $l, false ), $l );
	}
	echo '</select></td></tr>';

	echo '<tr><th><label>Chapter</label></th><td><select name="chapter">';
	for ( $c = 1; $c <= 16; $c++ ) {
		printf( '<option value="%d" %s>Chapter %d</option>', $c, selected( (int) $row['chapter'], $c, false ), $c );
	}
	echo '</select></td></tr>';

	echo '<tr><th><label>Type</label></th><td><select name="type">';
	foreach ( array( 'vocabulary', 'grammar', 'listening', 'photo' ) as $t ) {
		printf( '<option value="%s" %s>%s</option>', esc_attr( $t ), selected( $row['type'], $t, false ), esc_html( ucfirst( $t ) ) );
	}
	echo '</select><p class="description">"Photo" questions show under Vocabulary and display an image.</p></td></tr>';

	echo '<tr><th><label>Question</label></th><td><input type="text" name="question" class="large-text" value="' . esc_attr( $row['question'] ) . '" required /></td></tr>';
	echo '<tr><th><label>Choice A</label></th><td><input type="text" name="choice_a" class="regular-text" value="' . esc_attr( $row['choice_a'] ) . '" required /></td></tr>';
	echo '<tr><th><label>Choice B</label></th><td><input type="text" name="choice_b" class="regular-text" value="' . esc_attr( $row['choice_b'] ) . '" required /></td></tr>';
	echo '<tr><th><label>Choice C</label></th><td><input type="text" name="choice_c" class="regular-text" value="' . esc_attr( $row['choice_c'] ) . '" required /></td></tr>';
	echo '<tr><th><label>Correct Answer</label></th><td><input type="text" name="answer" class="regular-text" value="' . esc_attr( $row['answer'] ) . '" required /><p class="description">Must be typed exactly the same as one of the 3 choices above.</p></td></tr>';

	echo '<tr><th><label>Photo</label></th><td>';
	if ( ! empty( $row['image'] ) ) {
		echo '<p>Current: <code>' . esc_html( $row['image'] ) . '</code> <img src="' . esc_url( home_url( '/portal/images/vocab/' . $row['image'] ) ) . '" style="height:40px;vertical-align:middle;margin-left:8px;border:1px solid #ccc;" /></p>';
	}
	echo '<input type="file" name="image_upload" accept="image/*" /><p class="description">Upload to set/replace the photo. Leave empty to keep the current one.</p>';
	echo '</td></tr>';

	echo '<tr><th><label>Audio</label></th><td>';
	if ( ! empty( $row['audio'] ) ) {
		echo '<p>Current: <code>' . esc_html( $row['audio'] ) . '</code></p>';
	}
	echo '<input type="file" name="audio_upload" accept="audio/*" /><p class="description">Upload to set/replace the audio clip. Leave empty to keep the current one.</p>';
	echo '</td></tr>';

	echo '</tbody></table>';

	submit_button( 'edit' === $action ? 'Save Changes' : 'Add Question' );
	echo ' <a href="' . esc_url( admin_url( 'admin.php?page=h212-homework-questions' ) ) . '" class="button">Cancel</a>';
	echo '</form>';
}
