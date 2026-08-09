<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Videos</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .video-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
  .video-card { background:rgba(255,252,245,0.6); border:1px solid rgba(184,145,46,0.2); border-radius:14px; overflow:hidden; cursor:pointer; transition:all 0.25s; }
  .video-card:hover { border-color:rgba(184,145,46,0.45); transform:translateY(-3px); box-shadow:0 12px 40px rgba(120,90,20,0.12); }
  .video-thumb { position:relative; width:100%; padding-top:56.25%; background:#e5ddc8; overflow:hidden; }
  .video-thumb img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition:transform 0.3s; }
  .video-card:hover .video-thumb img { transform:scale(1.04); }
  .play-overlay { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:48px; height:48px; border-radius:50%; background:rgba(184,145,46,0.85); display:flex; align-items:center; justify-content:center; font-size:18px; color:#fff; }
  .video-card:hover .play-overlay { background:var(--gold); }
  .video-info { padding:14px 16px; }
  .video-title { font-size:14px; font-weight:500; color:var(--warm-white); line-height:1.4; margin-bottom:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .video-date  { font-size:12px; color:var(--text-dim); }
  .video-msg   { text-align:center; padding:60px 20px; color:var(--text-muted); font-size:14px; }
  .modal-backdrop { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(30,20,0,0.75); z-index:200; align-items:center; justify-content:center; padding:20px; }
  .modal-backdrop.open { display:flex; }
  .modal { background:#fffcf5; border:1px solid rgba(184,145,46,0.25); border-radius:16px; overflow:hidden; width:100%; max-width:860px; }
  .modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid rgba(184,145,46,0.15); }
  .modal-title { font-size:14px; font-weight:500; color:var(--warm-white); }
  .modal-close { background:none; border:none; color:var(--text-muted); font-size:22px; cursor:pointer; }
  .modal-close:hover { color:var(--gold-light); }
  .modal-player { position:relative; padding-top:56.25%; }
  .modal-player iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }
</style>
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'videos' );
h212_js_strings( array( 'videos.loading', 'videos.error', 'videos.visit_yt' ) );
?>

<div class="modal-backdrop" id="modal">
  <div class="modal">
    <div class="modal-header">
      <span class="modal-title" id="modal-title">Video</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-player">
      <iframe id="modal-iframe" src="" allowfullscreen allow="autoplay"></iframe>
    </div>
  </div>
</div>

<div class="section-header"><h2><?php echo esc_html( t( 'nav.videos' ) ); ?></h2><p><?php echo esc_html( t( 'videos.subtitle' ) ); ?></p></div>
<div id="video-wrap"><div class="video-msg"><?php echo esc_html( t( 'videos.loading' ) ); ?></div></div>

<script src="components/portal.js"></script>
<script>
window.addEventListener('DOMContentLoaded', function() {
  loadVideos();
});

function loadVideos() {
  var YT_ID = PORTAL.YT_CHANNEL_ID;
  var url = 'https://corsproxy.io/?' + encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + YT_ID);
  fetch(url)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var data = { contents: text };
      var xml = new DOMParser().parseFromString(data.contents, 'text/xml');
      var entries = xml.querySelectorAll('entry');
      if (!entries.length) throw new Error('empty');
      var html = '<div class="video-grid">';
      entries.forEach(function(e) {
        var title   = e.querySelector('title') ? e.querySelector('title').textContent : 'Untitled';
        var vidEl   = e.querySelector('videoId');
        var idEl    = e.querySelector('id');
        var videoId = vidEl ? vidEl.textContent : (idEl ? idEl.textContent.split(':').pop() : '');
        var pubEl   = e.querySelector('published');
        var date    = pubEl ? new Date(pubEl.textContent).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';
        var safe    = title.replace(/\\/g,'').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
        html += '<div class="video-card" onclick="openVideo(\'' + videoId + '\',\'' + safe + '\')">'
          + '<div class="video-thumb">'
          + '<img src="https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg" loading="lazy"/>'
          + '<div class="play-overlay">▶</div>'
          + '</div>'
          + '<div class="video-info"><div class="video-title">' + title + '</div><div class="video-date">' + date + '</div></div>'
          + '</div>';
      });
      html += '</div>';
      document.getElementById('video-wrap').innerHTML = html;
    })
    .catch(function() {
      document.getElementById('video-wrap').innerHTML = '<div class="video-msg">'
        + H212_T['videos.error'] + ' <a href="https://www.youtube.com/channel/' + PORTAL.YT_CHANNEL_ID + '" target="_blank" style="color:var(--gold-light);">' + H212_T['videos.visit_yt'] + '</a></div>';
    });
}

function openVideo(id, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-iframe').src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modal-iframe').src = '';
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
</script>
</main>
</div>
</body>
</html>
