<?php
/**
 * 212 English School - Teacher-facing Student Results page (wp-admin only).
 *
 * Read-only report of each student's homework progress, quiz score
 * history, and wrong-answer log. Sourced from the same per-student data
 * the portal itself already saves (h212_seen_questions, h212_quiz_scores,
 * h212_current_wrong, h212_mistake_log) plus the shared question bank in
 * portal/homework-content.csv, used here only to know each chapter's
 * quiz types - never written to.
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
	$up_to_chapter = isset( $_GET['up_to_chapter'] ) ? intval( $_GET['up_to_chapter'] ) : 16;
	check_admin_referer( 'h212_unlock_student_' . $student_id );

	$bank = h212_load_question_bank();
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

	wp_safe_redirect( admin_url( 'admin.php?page=h212-student-results&student_id=' . $student_id . '&unlocked=1' ) );
	exit;
} );

function h212_load_question_bank() {
	$path = ABSPATH . 'portal/homework-content.csv';
	if ( ! file_exists( $path ) ) {
		return array();
	}
	$rows = array_map( 'str_getcsv', file( $path ) );
	if ( ! $rows ) {
		return array();
	}
	$header = array_map( function ( $h ) { return strtolower( trim( $h ) ); }, array_shift( $rows ) );
	$out    = array();
	foreach ( $rows as $row ) {
		if ( count( $row ) < count( $header ) ) {
			continue;
		}
		$item = array_combine( $header, $row );
		if ( empty( $item['level'] ) || empty( $item['type'] ) ) {
			continue;
		}
		$out[] = $item;
	}
	return $out;
}

function h212_questions_for_type( $bank, $level, $chapter, $type ) {
	return array_values( array_filter( $bank, function ( $q ) use ( $level, $chapter, $type ) {
		if ( (int) $q['level'] !== $level || (int) $q['chapter'] !== $chapter ) {
			return false;
		}
		if ( $type === 'vocabulary' ) {
			return in_array( $q['type'], array( 'vocabulary', 'photo' ), true );
		}
		return $q['type'] === $type;
	} ) );
}

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
	for ( $l = 1; $l <= 5; $l++ ) {
		printf( '<option value="%d">Level %d</option>', $l, $l );
	}
	echo '</select>';
	echo '<select name="up_to_chapter">';
	for ( $c = 1; $c <= 16; $c++ ) {
		printf( '<option value="%d" %s>Chapter %d</option>', $c, selected( $c, 16, false ), $c );
	}
	echo '</select>';
	echo '<button type="submit" class="button">Unlock</button>';
	echo '</form>';

	$bank     = h212_load_question_bank();
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
	$level_chapters_done = array_fill( 1, 5, 0 );

	// ── Progress overview ──
	echo '<h2>Progress</h2>';
	echo '<div style="overflow-x:auto;"><table class="widefat striped" style="min-width:900px;"><thead><tr><th>Level</th>';
	for ( $c = 1; $c <= 16; $c++ ) {
		echo '<th style="text-align:center;">Ch ' . $c . '</th>';
	}
	echo '</tr></thead><tbody>';
	for ( $lvl = 1; $lvl <= 5; $lvl++ ) {
		echo '<tr><td><strong>Level ' . $lvl . '</strong></td>';
		for ( $c = 1; $c <= 16; $c++ ) {
			$types      = array( 'vocabulary', 'grammar', 'listening' );
			$done_count = 0;
			$has_content = false;
			foreach ( $types as $t ) {
				$qs = h212_questions_for_type( $bank, $lvl, $c, $t );
				if ( ! $qs ) {
					continue;
				}
				$has_content = true;
				$all_seen    = true;
				$any_wrong   = false;
				foreach ( $qs as $q ) {
					if ( ! in_array( $q['id'], $seen, true ) ) {
						$all_seen = false;
					}
					if ( in_array( $q['id'], $wrong, true ) ) {
						$any_wrong = true;
					}
				}
				if ( $all_seen && ! $any_wrong ) {
					$done_count++;
				}
			}
			if ( ! $has_content ) {
				echo '<td style="text-align:center;color:#bbb;">–</td>';
			} elseif ( 3 === $done_count ) {
				$level_chapters_done[ $lvl ]++;
				$finished_on = $latest_chapter_date( $lvl, $c );
				$title       = $finished_on ? ' title="Finished ' . esc_attr( $finished_on ) . '"' : '';
				echo '<td style="text-align:center;background:#d7f0dd;cursor:default;"' . $title . '>✓</td>';
			} elseif ( $done_count > 0 ) {
				echo '<td style="text-align:center;background:#fff3cd;">' . $done_count . '/3</td>';
			} else {
				echo '<td style="text-align:center;">–</td>';
			}
		}
		echo '</tr>';
	}
	echo '</tbody></table></div>';
	echo '<p style="color:#666;font-size:13px;">✓ = fully finished (hover for date) &nbsp;·&nbsp; X/3 = partly done &nbsp;·&nbsp; – = not started or no content yet</p>';

	// Current level = lowest level unlocked but not yet fully finished
	// (level 1 always unlocked; level N unlocks once level N-1 has all
	// 16 chapters finished). If everything is finished, show the last one.
	$current_level = 1;
	for ( $lvl = 1; $lvl <= 5; $lvl++ ) {
		if ( $lvl > 1 && $level_chapters_done[ $lvl - 1 ] < 16 ) {
			break;
		}
		$current_level = $lvl;
		if ( $level_chapters_done[ $lvl ] < 16 ) {
			break;
		}
	}

	echo '<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0 28px;padding:16px 20px;background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;">';
	echo '<div><strong>Currently on:</strong> Level ' . $current_level . '</div>';
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
