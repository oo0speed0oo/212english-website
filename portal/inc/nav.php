<?php
/**
 * Renders the top nav + sidebar and opens the <main id="page-content"> wrapper.
 * Every page that includes this must close with </main></div> before </body>.
 * Requires auth.php to have run first ($h212_user must be set).
 */

function h212_render_nav( $active ) {
	global $h212_user;

	$first = get_user_meta( $h212_user->ID, 'first_name', true );
	$last  = get_user_meta( $h212_user->ID, 'last_name', true );
	$full  = trim( $first . ' ' . $last );
	if ( '' === $full ) {
		$full = $h212_user->display_name;
	}
	$initials = strtoupper( substr( $first, 0, 1 ) . substr( $last, 0, 1 ) );
	if ( '' === $initials ) {
		$initials = '?';
	}

	$pages = array(
		array( 'id' => 'home',     'icon' => '🏠', 'label' => t( 'nav.dashboard' ), 'href' => 'dashboard.php', 'group' => t( 'nav.group_menu' ) ),
		array( 'id' => 'profile',  'icon' => '👤', 'label' => t( 'nav.profile' ),   'href' => 'profile.php',   'group' => t( 'nav.group_menu' ) ),
		array( 'id' => 'homework', 'icon' => '📚', 'label' => t( 'nav.homework' ),  'href' => 'homework.php',  'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'tests',    'icon' => '📝', 'label' => t( 'nav.tests' ),     'href' => 'tests.php',     'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'videos',   'icon' => '🎬', 'label' => t( 'nav.videos' ),    'href' => 'videos.php',    'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'grades',   'icon' => '📊', 'label' => t( 'nav.grades' ),    'href' => 'grades.php',    'group' => t( 'nav.group_study' ) ),
	);
	$other_lang        = ( 'en' === $GLOBALS['h212_lang'] ) ? 'ja' : 'en';
	$other_lang_label  = ( 'en' === $GLOBALS['h212_lang'] ) ? '🇯🇵 日本語' : '🇺🇸 EN';
	$current_url      = esc_url( add_query_arg( 'lang', $other_lang ) );
	?>
	<nav class="topnav">
		<div class="nav-logo"><em>212</em> English School</div>
		<div class="nav-right">
			<a class="lang-switch" href="<?php echo $current_url; ?>"><?php echo esc_html( $other_lang_label ); ?></a>
			<a class="nav-student" href="profile.php">
				<div class="nav-avatar"><?php echo esc_html( $initials ); ?></div>
				<span class="nav-name"><?php echo esc_html( $full ); ?></span>
			</a>
			<a class="logout-btn" href="logout.php"><?php echo esc_html( t( 'nav.logout' ) ); ?></a>
		</div>
	</nav>

	<button type="button" class="report-fab" onclick="h212OpenReportModal()"><?php echo esc_html( t( 'report.button' ) ); ?></button>

	<div class="report-modal-backdrop" id="h212-report-backdrop">
		<div class="report-modal">
			<div class="report-modal-header">
				<span><?php echo esc_html( t( 'report.title' ) ); ?></span>
				<button type="button" class="report-modal-close" onclick="h212CloseReportModal()">&times;</button>
			</div>
			<div class="report-modal-body">
				<p><?php echo esc_html( t( 'report.description' ) ); ?></p>
				<textarea id="h212-report-message" rows="5" placeholder="<?php echo esc_attr( t( 'report.placeholder' ) ); ?>"></textarea>
				<div class="report-status" id="h212-report-status"></div>
			</div>
			<div class="report-modal-footer">
				<button type="button" class="report-send-btn" onclick="h212SubmitReport()"><?php echo esc_html( t( 'report.send' ) ); ?></button>
			</div>
		</div>
	</div>
	<script>
	window.H212_REPORT_NONCE = "<?php echo esc_js( wp_create_nonce( 'h212_report_problem' ) ); ?>";
	window.H212_REPORT_T = {
		sending: "<?php echo esc_js( t( 'report.sending' ) ); ?>",
		thanks: "<?php echo esc_js( t( 'report.thanks' ) ); ?>",
		error_generic: "<?php echo esc_js( t( 'report.error_generic' ) ); ?>",
		error_empty: "<?php echo esc_js( t( 'report.error_empty' ) ); ?>"
	};
	function h212OpenReportModal() {
		document.getElementById('h212-report-backdrop').classList.add('open');
	}
	function h212CloseReportModal() {
		document.getElementById('h212-report-backdrop').classList.remove('open');
		document.getElementById('h212-report-message').value = '';
		document.getElementById('h212-report-status').textContent = '';
		document.getElementById('h212-report-status').className = 'report-status';
	}
	function h212SubmitReport() {
		var msg = document.getElementById('h212-report-message').value.trim();
		var statusEl = document.getElementById('h212-report-status');
		if (!msg) {
			statusEl.textContent = window.H212_REPORT_T.error_empty;
			statusEl.className = 'report-status error';
			return;
		}
		statusEl.textContent = window.H212_REPORT_T.sending;
		statusEl.className = 'report-status';
		fetch('inc/report.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ nonce: window.H212_REPORT_NONCE, type: 'manual', message: msg, page: window.location.pathname })
		})
			.then(function(r) { return r.json(); })
			.then(function(data) {
				if (data && data.ok) {
					statusEl.textContent = window.H212_REPORT_T.thanks;
					statusEl.className = 'report-status success';
					setTimeout(h212CloseReportModal, 1500);
				} else {
					statusEl.textContent = (data && data.error) || window.H212_REPORT_T.error_generic;
					statusEl.className = 'report-status error';
				}
			})
			.catch(function() {
				statusEl.textContent = window.H212_REPORT_T.error_generic;
				statusEl.className = 'report-status error';
			});
	}
	document.addEventListener('DOMContentLoaded', function() {
		var backdrop = document.getElementById('h212-report-backdrop');
		if (backdrop) {
			backdrop.addEventListener('click', function(e) {
				if (e.target === backdrop) h212CloseReportModal();
			});
		}
	});

	// ── Automatic error detection ──────────────────────
	// Catches real JavaScript errors and failed background saves the
	// student never sees or thinks to report. Ignores cross-origin
	// "Script error." noise (browser extensions etc., not our code) and
	// caps how many it will send per page load so a runaway loop can't
	// flood anything.
	var h212SeenErrors = {};
	function h212AutoReportError(message, filename, lineno, colno, stack) {
		if (!message || message === 'Script error.') return;
		var sig = message + '|' + filename + '|' + lineno;
		if (h212SeenErrors[sig]) return;
		if (Object.keys(h212SeenErrors).length >= 5) return;
		h212SeenErrors[sig] = true;

		fetch('inc/report.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nonce: window.H212_REPORT_NONCE, type: 'auto', message: message,
				filename: filename || '', lineno: lineno || 0, colno: colno || 0,
				stack: stack || '', page: window.location.pathname
			})
		}).catch(function() {});
	}
	window.addEventListener('error', function(e) {
		h212AutoReportError(e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
	});
	window.addEventListener('unhandledrejection', function(e) {
		var reason = e.reason;
		var msg = (reason && reason.message) ? reason.message : String(reason);
		h212AutoReportError('Unhandled promise rejection: ' + msg, window.location.pathname, 0, 0, reason && reason.stack);
	});
	</script>

	<div class="main">
		<aside class="sidebar">
			<?php
			$last_group = '';
			foreach ( $pages as $p ) {
				if ( $p['group'] !== $last_group ) {
					$last_group = $p['group'];
					echo '<span class="sidebar-label">' . esc_html( $p['group'] ) . '</span>';
				}
				$cls = ( $p['id'] === $active ) ? 'sidebar-item active' : 'sidebar-item';
				echo '<a class="' . esc_attr( $cls ) . '" href="' . esc_url( $p['href'] ) . '">'
					. '<span class="sidebar-icon">' . $p['icon'] . '</span> ' . esc_html( $p['label'] )
					. '</a>';
			}
			?>
		</aside>
		<main class="content" id="page-content">
	<?php
}
