<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Grades</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .grades-summary {
    background: rgba(255,252,245,0.6);
    border: 1px solid rgba(184,145,46,0.2);
    border-radius: 16px; padding: 24px 28px;
    margin-bottom: 32px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .grades-headline { font-size: 18px; color: var(--warm-white); font-weight: 500; margin-bottom: 6px; }
  .grades-stats { font-size: 13px; color: var(--text-muted); }
  .grades-stats strong { color: var(--gold-light); font-weight: 500; }

  .grades-level-block { margin-bottom: 28px; }
  .grades-level-title { font-size: 15px; color: var(--warm-white); font-weight: 500; margin-bottom: 12px; }
  .grades-chapter-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  .grade-chip {
    border-radius: 10px; padding: 12px 14px;
    border: 1px solid rgba(184,145,46,0.2);
    background: rgba(255,252,245,0.5);
  }
  .grade-chip .gc-num { display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
  .grade-chip .gc-status { display:block; font-size: 12px; font-weight: 600; }
  .grade-chip.status-mastered { border-color: rgba(47,122,79,0.35); background: rgba(47,122,79,0.08); }
  .grade-chip.status-mastered .gc-status { color: #2f7a4f; }
  .grade-chip.status-progress { border-color: rgba(184,145,46,0.4); background: rgba(184,145,46,0.08); }
  .grade-chip.status-progress .gc-status { color: var(--gold-light); }
  .grade-chip.status-not_started .gc-status { color: var(--text-dim); }

  .grades-coming-soon { font-size: 13px; color: var(--text-muted); font-style: italic; }
</style>
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'grades' );

$bank  = h212_load_question_bank();
$seen  = get_user_meta( $h212_user->ID, 'h212_seen_questions', true );
$seen  = is_array( $seen ) ? $seen : array();
$wrong = get_user_meta( $h212_user->ID, 'h212_current_wrong', true );
$wrong = is_array( $wrong ) ? $wrong : array();

$h212_types = array( 'vocabulary', 'grammar', 'listening' );

// Status for one chapter, based on where the student stands RIGHT NOW -
// not a running history of past attempts. Get something right on a
// retry and the status simply updates; nothing "bad" stays visible.
function h212_grades_chapter_status( $bank, $level, $chapter, $seen, $wrong ) {
	global $h212_types;
	$has_content = false;
	$any_seen    = false;
	$all_done    = true;

	foreach ( $h212_types as $t ) {
		$qs = h212_questions_for_type( $bank, $level, $chapter, $t );
		if ( ! $qs ) {
			continue;
		}
		$has_content = true;
		$type_done   = true;
		foreach ( $qs as $q ) {
			if ( in_array( $q['id'], $seen, true ) ) {
				$any_seen = true;
			} else {
				$type_done = false;
			}
			if ( in_array( $q['id'], $wrong, true ) ) {
				$type_done = false;
			}
		}
		if ( ! $type_done ) {
			$all_done = false;
		}
	}

	if ( ! $has_content ) {
		return 'no_content';
	}
	if ( ! $any_seen ) {
		return 'not_started';
	}
	return $all_done ? 'mastered' : 'progress';
}

$level_has_content   = array();
$level_mastered      = array();
$total_chapters      = 0;
$total_mastered      = 0;

for ( $lvl = 1; $lvl <= 5; $lvl++ ) {
	$level_has_content[ $lvl ] = false;
	$level_mastered[ $lvl ]    = 0;
	for ( $c = 1; $c <= 16; $c++ ) {
		$status = h212_grades_chapter_status( $bank, $lvl, $c, $seen, $wrong );
		if ( 'no_content' === $status ) {
			continue;
		}
		$level_has_content[ $lvl ] = true;
		$total_chapters++;
		if ( 'mastered' === $status ) {
			$level_mastered[ $lvl ]++;
			$total_mastered++;
		}
	}
}

// "Currently on" level: the first level with unfinished content in it,
// same idea as the level-locking logic in homework.php.
$current_level = 1;
for ( $lvl = 1; $lvl <= 5; $lvl++ ) {
	if ( ! $level_has_content[ $lvl ] ) {
		break;
	}
	$current_level = $lvl;
	$chapters_in_level = 0;
	for ( $c = 1; $c <= 16; $c++ ) {
		if ( 'no_content' !== h212_grades_chapter_status( $bank, $lvl, $c, $seen, $wrong ) ) {
			$chapters_in_level++;
		}
	}
	if ( $level_mastered[ $lvl ] < $chapters_in_level ) {
		break;
	}
}

if ( 0 === $total_mastered ) {
	$headline = t( 'grades.msg_start' );
} elseif ( $total_chapters > 0 && $total_mastered >= $total_chapters ) {
	$headline = t( 'grades.msg_great' );
} else {
	$headline = t( 'grades.msg_progress' );
}
?>
<div class="section-header"><h2><?php echo esc_html( t( 'nav.grades' ) ); ?></h2><p><?php echo esc_html( t( 'grades.subtitle' ) ); ?></p></div>

<div class="grades-summary">
  <div>
    <div class="grades-headline"><?php echo esc_html( $headline ); ?></div>
    <div class="grades-stats">
      <?php echo esc_html( t( 'grades.current_level' ) ); ?> <strong>Level <?php echo (int) $current_level; ?></strong>
      &nbsp;·&nbsp;
      <strong><?php echo (int) $total_mastered; ?> / <?php echo (int) $total_chapters; ?></strong> <?php echo esc_html( t( 'grades.mastered_of' ) ); ?>
    </div>
  </div>
  <a class="back-btn" href="homework.php" style="margin:0;"><?php echo esc_html( t( 'grades.go_homework' ) ); ?></a>
</div>

<?php for ( $lvl = 1; $lvl <= 5; $lvl++ ) : ?>
  <div class="grades-level-block">
    <div class="grades-level-title"><?php echo esc_html( t( 'hw.level' ) ); ?> <?php echo (int) $lvl; ?></div>
    <?php if ( ! $level_has_content[ $lvl ] ) : ?>
      <div class="grades-coming-soon"><?php echo esc_html( t( 'grades.coming_soon_level' ) ); ?></div>
    <?php else : ?>
      <div class="grades-chapter-grid">
        <?php for ( $c = 1; $c <= 16; $c++ ) :
          $status = h212_grades_chapter_status( $bank, $lvl, $c, $seen, $wrong );
          if ( 'no_content' === $status ) {
            continue;
          }
          $label = 'mastered' === $status ? t( 'grades.status_mastered' )
            : ( 'progress' === $status ? t( 'grades.status_progress' ) : t( 'grades.status_not_started' ) );
        ?>
          <div class="grade-chip status-<?php echo esc_attr( $status ); ?>">
            <span class="gc-num"><?php echo esc_html( t( 'hw.chapter' ) ); ?> <?php echo (int) $c; ?></span>
            <span class="gc-status"><?php echo esc_html( $label ); ?></span>
          </div>
        <?php endfor; ?>
      </div>
    <?php endif; ?>
  </div>
<?php endfor; ?>
</main>
</div>
</body>
</html>
