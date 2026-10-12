<?php
/**
 * 212 English School - Teacher-facing Student Results page (wp-admin only).
 *
 * Read-only report of each student's homework progress, quiz score
 * history, and wrong-answer log. Sourced from the same per-student data
 * the portal itself already saves (h212_seen_questions, h212_quiz_scores,
 * h212_current_wrong, h212_mistake_log) plus the shared question bank and
 * progress/unlock rules in 212-progress.php (which reads
 * portal/homework-content.csv and portal/build-content.csv, never writes them).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', function () {
	add_menu_page(
		'212 English',
		'212 English',
		'manage_options',
		'h212-student-results',
		'h212_render_student_results_page',
		'dashicons-welcome-learn-more',
		26
	);
	add_submenu_page(
		'h212-student-results',
		'Student Results',
		'Student Results',
		'manage_options',
		'h212-student-results',
		'h212_render_student_results_page'
	);
} );

// Marks every question up through a chosen Level/Chapter as seen (and
// clears any "currently wrong" flags) for one student, so everything up
// to that point is unlocked - matches how the lock system actually
// works: reaching Chapter 5 requires chapters 1-4 to be done too, so
// there's no way to unlock only one isolated chapter further in.
// Useful for a test/demo account, or for re-unlocking after new content
// is added. Does not touch scores.
add_action( 'admin_post_h212_unlock_student', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	$student_id   = isset( $_GET['student_id'] ) ? intval( $_GET['student_id'] ) : 0;
	$up_to_level   = isset( $_GET['up_to_level'] )   ? intval( $_GET['up_to_level'] )   : 5;
	$up_to_chapter = isset( $_GET['up_to_chapter'] ) ? intval( $_GET['up_to_chapter'] ) : H212_CHAPTERS;
	check_admin_referer( 'h212_unlock_student_' . $student_id );

	$bank = h212_progress_bank();
	$ids  = array();
	foreach ( $bank as $q ) {
		$level   = (int) $q['level'];
		$chapter = (int) $q['chapter'];
		if ( $level < $up_to_level || ( $level === $up_to_level && $chapter <= $up_to_chapter ) ) {
			$ids[] = $q['id'];
		}
	}
	update_user_meta( $student_id, 'h212_seen_questions', $ids );
	delete_user_meta( $student_id, 'h212_current_wrong' );
	// Save the chapters this opens (they then stay open for good).
	h212_progress_state( $student_id, true );

	wp_safe_redirect( admin_url( 'admin.php?page=h212-student-results&student_id=' . $student_id . '&unlocked=1' ) );
	exit;
} );

function h212_render_student_results_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$students    = get_users( array( 'role' => 'student', 'orderby' => 'display_name' ) );
	$selected_id = isset( $_GET['student_id'] ) ? intval( $_GET['student_id'] ) : 0;
	if ( ! $selected_id && $students ) {
		$selected_id = $students[0]->ID;
	}

	echo '<div class="wrap"><h1>Student Results</h1>';

	if ( isset( $_GET['unlocked'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>Marked as seen up through the chosen Level/Chapter for this student - everything up to that point is now unlocked.</p></div>';
	}

	if ( ! $students ) {
		echo '<p>No student accounts yet.</p></div>';
		return;
	}

	echo '<form method="get" style="margin:16px 0;display:inline-block;">';
	echo '<input type="hidden" name="page" value="h212-student-results" />';
	echo '<select name="student_id" onchange="this.form.submit()">';
	foreach ( $students as $s ) {
		printf(
			'<option value="%d" %s>%s (%s)</option>',
			$s->ID,
			selected( $selected_id, $s->ID, false ),
			esc_html( $s->display_name ),
			esc_html( $s->user_login )
		);
	}
	echo '</select>';
	echo '</form>';

	echo '<form method="get" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin:16px 0 0;display:inline-flex;align-items:center;gap:8px;" onsubmit="return confirm(\'Mark everything up through the chosen Level/Chapter as seen for this student? Unlocks up to that point, but does not change their scores.\');">';
	echo '<input type="hidden" name="action" value="h212_unlock_student" />';
	echo '<input type="hidden" name="student_id" value="' . esc_attr( $selected_id ) . '" />';
	wp_nonce_field( 'h212_unlock_student_' . $selected_id, '_wpnonce', true, true );
	echo '<span>Unlock up through</span>';
	echo '<select name="up_to_level">';
	for ( $l = 1; $l <= H212_LEVELS; $l++ ) {
		printf( '<option value="%d" %s>Level %d</option>', $l, selected( $l, H212_LEVELS, false ), $l );
	}
	echo '</select>';
	echo '<select name="up_to_chapter">';
	for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
		printf( '<option value="%d" %s>Chapter %d</option>', $c, selected( $c, H212_CHAPTERS, false ), $c );
	}
	echo '</select>';
	echo '<button type="submit" class="button">Unlock</button>';
	echo '</form>';

	$bank     = h212_progress_bank();
	$scores   = get_user_meta( $selected_id, 'h212_quiz_scores', true );
	$scores   = is_array( $scores ) ? $scores : array();
	$mistakes = get_user_meta( $selected_id, 'h212_mistake_log', true );
	$mistakes = is_array( $mistakes ) ? $mistakes : array();
	$seen     = get_user_meta( $selected_id, 'h212_seen_questions', true );
	$seen     = is_array( $seen ) ? $seen : array();
	$wrong    = get_user_meta( $selected_id, 'h212_current_wrong', true );
	$wrong    = is_array( $wrong ) ? $wrong : array();

	// Latest score date for a level/chapter (any type) - used as an
	// approximate "finished on" date for a fully-done chapter.
	$latest_chapter_date = function ( $level, $chapter ) use ( $scores ) {
		$latest = '';
		foreach ( $scores as $s ) {
			if ( (int) $s['level'] === $level && (int) $s['chapter'] === $chapter ) {
				if ( $s['date'] > $latest ) {
					$latest = $s['date'];
				}
			}
		}
		return $latest;
	};

	// ── Summary ──
	$last_active = '';
	foreach ( array_merge( $scores, $mistakes ) as $row ) {
		if ( isset( $row['date'] ) && $row['date'] > $last_active ) {
			$last_active = $row['date'];
		}
	}

	// ── Progress overview ── (read-only: shows unlocks without saving them)
	$state = h212_progress_state( $selected_id, false );
	echo '<h2>Progress</h2>';
	echo '<div style="overflow-x:auto;"><table class="widefat striped" style="min-width:900px;"><thead><tr><th>Level</th>';
	for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
		echo '<th style="text-align:center;">Ch ' . $c . '</th>';
	}
	echo '</tr></thead><tbody>';
	$current_label = 'Level 1';
	for ( $lvl = 1; $lvl <= H212_LEVELS; $lvl++ ) {
		echo '<tr><td><strong>Level ' . $lvl . '</strong></td>';
		for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
			$ch   = $state['chapters'][ $lvl . '-' . $c ];
			$lock = $ch['u'] ? 'Open' : 'Locked';
			if ( 0 === $ch['t'] ) {
				echo '<td style="text-align:center;color:#bbb;" title="No questions yet">–</td>';
				continue;
			}
			if ( $ch['u'] ) {
				$current_label = 'Level ' . $lvl . ', Chapter ' . $c;
			}
			if ( $ch['f'] === $ch['t'] ) {
				$finished_on = $latest_chapter_date( $lvl, $c );
				$title       = $finished_on ? ' title="Finished ' . esc_attr( $finished_on ) . '"' : '';
				echo '<td style="text-align:center;background:#d7f0dd;cursor:default;"' . $title . '>✓</td>';
			} elseif ( $ch['s'] > 0 ) {
				$pct = (int) floor( $ch['f'] * 100 / $ch['t'] );
				$bg  = ( $ch['f'] * 100 >= H212_UNLOCK_PERCENT * $ch['t'] ) ? '#e3f1d4' : '#fff3cd';
				echo '<td style="text-align:center;background:' . $bg . ';" title="' . esc_attr( $ch['f'] . ' of ' . $ch['t'] . ' questions finished - ' . $lock ) . '">' . $pct . '%</td>';
			} else {
				echo '<td style="text-align:center;" title="' . esc_attr( $lock ) . '">' . ( $ch['u'] ? '–' : '🔒' ) . '</td>';
			}
		}
		echo '</tr>';
	}
	echo '</tbody></table></div>';
	echo '<p style="color:#666;font-size:13px;">✓ = every question finished (hover for date) &nbsp;·&nbsp; % = share of the chapter\'s homework finished (green = 70% or more, which opens the next chapter) &nbsp;·&nbsp; – = not started or no questions yet &nbsp;·&nbsp; 🔒 = locked</p>';

	echo '<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0 28px;padding:16px 20px;background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;">';
	echo '<div><strong>Furthest open chapter:</strong> ' . esc_html( $current_label ) . '</div>';
	echo '<div><strong>Last active:</strong> ' . ( $last_active ? esc_html( $last_active ) : '—' ) . '</div>';
	echo '<div><strong>Quiz attempts:</strong> ' . count( $scores ) . '</div>';
	echo '<div><strong>Mistakes logged:</strong> ' . count( $mistakes ) . '</div>';
	echo '<div><strong>Currently needs review:</strong> ' . count( $wrong ) . '</div>';
	echo '</div>';

	// ── Score history ──
	echo '<h2 style="margin-top:32px;">Quiz Score History</h2>';
	if ( ! $scores ) {
		echo '<p>No quiz attempts yet.</p>';
	} else {
		usort( $scores, function ( $a, $b ) { return strcmp( $b['date'], $a['date'] ); } );
		echo '<table class="widefat striped" style="max-width:700px;"><thead><tr><th>Date</th><th>Level</th><th>Chapter</th><th>Type</th><th>Score</th></tr></thead><tbody>';
		foreach ( $scores as $s ) {
			printf(
				'<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td><td>%d / %d</td></tr>',
				esc_html( $s['date'] ),
				(int) $s['level'],
				(int) $s['chapter'],
				esc_html( ucfirst( $s['type'] ) ),
				(int) $s['score'],
				(int) $s['total']
			);
		}
		echo '</tbody></table>';
	}

	// ── Mistake log ──
	echo '<h2 style="margin-top:32px;">Wrong Answers</h2>';
	if ( ! $mistakes ) {
		echo '<p>No mistakes recorded.</p>';
	} else {
		usort( $mistakes, function ( $a, $b ) { return strcmp( $b['date'], $a['date'] ); } );
		echo '<div style="overflow-x:auto;"><table class="widefat striped" style="min-width:1000px;"><thead><tr><th>Date</th><th>Level</th><th>Chapter</th><th>Type</th><th>Question</th><th>They chose</th><th>Correct answer</th><th>Status</th></tr></thead><tbody>';
		foreach ( $mistakes as $m ) {
			$still_wrong = in_array( $m['id'], $wrong, true );
			$status      = $still_wrong
				? '<span style="color:#b3261e;">Still needs practice</span>'
				: '<span style="color:#2f7a4f;">✓ Fixed since</span>';
			printf(
				'<tr><td style="white-space:nowrap;">%s</td><td>%d</td><td>%d</td><td>%s</td><td>%s</td><td style="color:#b3261e;">%s</td><td style="color:#2f7a4f;">%s</td><td style="white-space:nowrap;">%s</td></tr>',
				esc_html( $m['date'] ),
				(int) $m['level'],
				(int) $m['chapter'],
				esc_html( ucfirst( $m['type'] ) ),
				esc_html( $m['question'] ),
				esc_html( $m['chosen'] ),
				esc_html( $m['correct_answer'] ),
				$status
			);
		}
		echo '</tbody></table></div>';
	}

	echo '</div>';
}
