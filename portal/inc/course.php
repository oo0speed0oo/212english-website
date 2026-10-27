<?php
/**
 * Hands the course map (which levels and chapters exist, and the part groups) to
 * the browser as window.H212_COURSE. The map itself is built in
 * wp-content/mu-plugins/212-progress.php from the content files.
 */
function h212_course_script() {
	echo '<script>window.H212_COURSE = ' . wp_json_encode( h212_course_for_js() ) . ';</script>' . "\n";
}
