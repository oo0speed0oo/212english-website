<?php
require_once __DIR__ . '/../wp-load.php';
wp_logout();
wp_safe_redirect( home_url( '/portal/login.php' ) );
exit;
