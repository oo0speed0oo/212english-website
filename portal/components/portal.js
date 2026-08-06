const PORTAL = {
  YT_CHANNEL_ID: "UC-gtB79-gCRtneuBLGwpbgg",

  getSession() {
    try { return JSON.parse(sessionStorage.getItem('212_student')) || null; }
    catch { return null; }
  },

  buildNav(activeId) {
    const session = this.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const fn       = session.firstName || 'Student';
    const ln       = session.lastName  || '';
    const fullName = fn + (ln ? ' ' + ln : '');
    const initials = ((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?';

    const pages = [
      { id: 'home',     icon: '🏠', label: 'Dashboard',  href: 'dashboard.html', group: 'Menu'  },
      { id: 'profile',  icon: '👤', label: 'My Profile', href: 'profile.html',   group: 'Menu'  },
      { id: 'homework', icon: '📚', label: 'Homework',   href: 'homework.html',  group: 'Study' },
      { id: 'tests',    icon: '📝', label: 'Tests',      href: 'tests.html',     group: 'Study' },
      { id: 'videos',   icon: '🎬', label: 'Videos',     href: 'videos.html',    group: 'Study' },
      { id: 'grades',   icon: '📊', label: 'Grades',     href: 'grades.html',    group: 'Study' },
    ];

    let sidebarHTML = '';
    let lastGroup = '';
    pages.forEach(p => {
      if (p.group !== lastGroup) {
        sidebarHTML += '<span class="sidebar-label">' + p.group + '</span>';
        lastGroup = p.group;
      }
      const cls = p.id === activeId ? 'sidebar-item active' : 'sidebar-item';
      sidebarHTML += '<button class="' + cls + '" onclick="window.location.href=\'' + p.href + '\'">'
        + '<span class="sidebar-icon">' + p.icon + '</span> ' + p.label
        + '</button>';
    });

    const mount = document.getElementById('nav-mount');
    mount.innerHTML =
      '<nav class="topnav">'
      +   '<div class="nav-logo"><em>212</em> English School</div>'
      +   '<div class="nav-right">'
      +     '<div class="nav-student" onclick="window.location.href=\'profile.html\'">'
      +       '<div class="nav-avatar">' + initials + '</div>'
      +       '<span class="nav-name">' + fullName + '</span>'
      +     '</div>'
      +     '<button class="logout-btn" onclick="portalLogout()">Log out</button>'
      +   '</div>'
      + '</nav>'
      + '<div class="main">'
      +   '<aside class="sidebar">' + sidebarHTML + '</aside>'
      +   '<main class="content" id="page-content"></main>'
      + '</div>';
  }
};

function portalLogout() {
  sessionStorage.removeItem('212_student');
  window.location.href = 'login.html';
}
