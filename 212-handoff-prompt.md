# 212 English School — full handoff prompt (written 2026-10-13, after Level 1 was finished)

**How to use:** open a NEW Claude Code chat in the project folder `~/Documents/212english-website`, paste everything between the two `=====` lines, then attach / paste your Level 2 content. This file is saved in the repo (`212-handoff-prompt.md`) and the older, longer background is in `212-english-project-brief.md` (sections 12–15 there are the newest).

=====

You are my hands-on developer and guide for the 212 English School website and student portal. I am Michael Placido, owner of a small English school in Japan (bilingual English/Japanese). I am NOT a developer. Read this whole message, then read `212-english-project-brief.md` in the project folder (background and history; if anything there disagrees with this message, THIS message is newer).

## 0. My rules (follow them exactly)
1. **Work on my LOCAL copy only. Never touch the live site (212english.com).** I publish myself.
2. **Deployment = me uploading specific files by hand** with FileZilla (or Hostinger File Manager for zips). After every change tell me the EXACT files and the folder each goes in (`public_html/...`). NEVER say "upload the folder". Give me the upload ORDER when it matters.
3. **Plain language, one step at a time, exact file paths, lead with your recommendation.** Keep replies short. No jargon without a one-line explanation.
4. **Test before you say it works.** Show what you checked. If you could not test something (e.g. a real iPhone), say so plainly.
5. **Never handle my passwords/tokens in chat.** I type secrets into the tool myself. Anything pasted in chat counts as compromised.
6. **Commit with a plain-English message** (end it with the Co-Authored-By line the tool asks for). **Push to GitHub only when I say "put it on github".**
7. **Never change or renumber existing question ids. Never reuse an id** (progress is stored by id). Don't change existing rows unless I say so.
8. **Confirm Level and Chapter before writing any content.** Adults only (a kids' version is a separate future project). Keep scope lean; don't add features I didn't ask for.
9. After EVERY job tell me: (a) how to test on Local on my iPhone and my Mac, (b) exact files changed + folders, (c) the commit. Then wait.
10. If a prompt I paste says "if X is not working, tell me and stop" — do that check first and obey it.

## 1. What this is
- Public site: https://212english.com (WordPress + Elementor on Hostinger, LiteSpeed, PHP 8.3). The homepage/About/Contact/Prices are finished — don't touch.
- **Student portal at `/portal/`**: custom PHP + vanilla JavaScript (no framework, no build step). Students are real WordPress users with role "student". Bilingual EN/JA interface.
- Repo (public, solo, push straight to `main`): https://github.com/oo0speed0oo/212english-website — it is only a COPY; the live site changes only when I upload.
- Local dev copy: Local app site `212english-local`, https://212english-local.local, files in `~/Local Sites/212english-local/app/public` (the Local app must be running; if it is off the site shows a database error). Test student: log in as `master.test` (I know the password; never ask for it — if you need a login, create a throwaway test student in a COPY of the database, see §9).
- Local PHP for linting: `~/Library/Application Support/Local/lightning-services/php-8.2.29+0/bin/darwin-arm64/bin/php -l file.php`.

## 2. Where everything lives
```
portal/                     the student app (upload folder on server: public_html/portal/)
  login.php dashboard.php homework.php tests.php grades.php videos.php profile.php logout.php
  homework-content.csv      MAIN question bank (public file!)
  build-content.csv         Sentence Builder questions
  video-content.csv         Video lessons (71 videos)
  inc/                      auth.php i18n.php nav.php mike.php voices.php theme.php
                            progress.php scores.php test-scores.php seen.php mistakes.php report.php video-sentence.php
  components/               base.css (ALL colours/look, 3 themes) listen.js builder.js ui.js mike.js portal.js
  images/vocab/             question pictures (Photos part)   images/voices/ (4 face svgs)   images/mike.svg
  audio/{us_woman,us_man,uk_woman,uk_man}/<id>.mp3   (Listening voices)
  audio/conversation/<id>.m4a                          (Conversation voices)
  audio/script.csv          sentence list for the mp3s (NEVER upload this one)
wp-content/mu-plugins/      (upload folder: public_html/wp-content/mu-plugins/)
  212-progress.php          ONE shared file: question bank, 6 parts, 70% unlock rule, video helpers  <- the brain
  212-teacher-results.php   wp-admin "212 English" menu: Student Results (progress grid, scores, wrong answers, video sentences, Unlock tool)
  212-homework-admin.php    wp-admin Homework Questions editor (rewrites homework-content.csv, sorted by level/chapter/id)
  212-problem-reports.php   Report-a-Problem inbox     212-student-portal.php  "student" role + profile fields
tools/                      Mac-only helpers, NEVER uploaded to the live site:
  make-script.py (rebuild audio/script.csv) · make-audio.py (Kokoro mp3 voices) · conversation-voices/ (make_voices.py + conversation-voices.csv) · voice-samples/
```
Do NOT commit or upload these stray folders in the project root: `generated_photos/`, `photos_for_site/`, `212-videos/`, `_EXTRA FILES/`, `funny ai mistakes/`, `*.zip`, `portal/BACKUP*.csv`, the `212-next-steps*.md` notes, `videos.csv`, `new-rows-conversation.csv`, root-level `homework-content.csv`. Always `git add` specific files, never `git add .`.

## 3. The data (this is what Level 2 plugs into)
### homework-content.csv — 12 columns, in this order
`id,level,chapter,type,question,choice_a,choice_b,choice_c,answer,image,audio,mode`
- `level` 1–5, `chapter` 1–17. `mode` = `homework` or `test`. `answer` must EXACTLY equal one of the three choices. `image` only for photo rows. `audio` unused (empty).
- `type` values: `vocabulary` (Words), `grammar` (Fill in the blank), `listening`, `photo`, `conversation`. Test rows (`mode=test`) are `grammar` and `listening` mixed (about 10 per chapter, one combined test per chapter).
- **Listening rows:** `You hear "sentence." Question?` — the quoted text is hidden on screen and read aloud; two quoted parts = a two-person dialogue (two voices). One special case (id 212) keeps `You ask Tom, "Are you busy?"` visible because only the part after "You hear" is spoken.
- **Conversation rows:** same shape: `You hear "line 1" "line 2" What is the best reply?` — only a big ▶ Play button + the text after the quotes are shown; after answering, ✅/❌ and then the conversation text appears.
- **Photo rows:** `image` = file name in `portal/images/vocab/` (exact lower-case spelling; Linux server is case-sensitive). Question text like "Who is this?".
### build-content.csv (Sentence Builder) — `id,level,chapter,mode,source_id,prompt_ja,tiles,extra`
`tiles` = correct word order separated by `|` ; `extra` = trap words separated by `|`. Student sees the Japanese sentence and taps shuffled word tiles into order; Check = exact order; robot reads the correct sentence. `mode=test` rows feed the Tests (3 random per chapter are added after the normal test questions).
### video-content.csv — `id,video_id,order,title,type,question,choice_a,choice_b,choice_c,answer,required_words,example`
71 videos × (5 `question` rows + 1 `write` row). NOT level-based. `required_words` separated by `|`; unused cells are `-`.
### ONE global id counter (all three files share it)
Used so far: homework 5–1409 (original) · Sentence Builder 1410–1759 · Video lessons 1760–2185 · Photos 2186–2440 (some ids skipped on purpose) · Conversation 2441–2610. **Next free id: 2611.** Ids up to 2610 are reserved (constant `H212_RESERVED_MAX_ID`); the wp-admin Homework Questions screen starts new ids above that automatically.
### Level 1 status = COMPLETE and live
Level 1, Chapters 1–17: homework vocabulary 287, grammar 360, listening 91, photo 223 (7 old + 216 new), conversation 170; test grammar 153 + listening 17; Sentence Builder 220 homework + 130 test; 71 video lessons. Levels 2–5 are empty (the code already supports them — I tested a fake Level 2 on 2026-10-13: Level 2 unlocks, chapters chain, tests, dashboard "Continue", Grades all work).

## 4. How the student side behaves (don't break these)
- **6 practice parts per chapter, in 3 groups** (Homework page): Vocabulary = Photos (`photo`) + Words (`vocabulary`); Grammar = Fill in the blank (`grammar`) + Sentence Builder (build-content.csv); Listening = Listen (`listening`) + Conversation (`conversation`). A part with no questions says "Coming with new lessons" (Photos: "Photos are coming soon") and is skipped by the lock rule.
- **Unlock rule** (all in `212-progress.php`, read by homework.php, tests.php, grades.php, dashboard.php, the teacher page): chapter N+1 opens when 70% of chapter N's homework questions (all parts together) are *finished* = answered at least once and not currently wrong. The first chapter of the next level opens when chapter 17 of the previous level reaches 70%. Once a chapter is open it stays open (user meta `h212_unlocked`). On a student's first visit after the rule changed, everything they could open under the OLD rule was kept (it looks only at original questions, ids ≤ 1409, `H212_LEGACY_MAX_ID`) — so adding questions never locks anyone out. "Mastered" on Grades = 100%. Tests open when that chapter's Homework is open. Videos never count.
- **Hidden-if-missing photos:** a photo question whose picture file is not in `images/vocab/` is hidden completely (not shown, not counted) on the server and in the page; it appears by itself when the file is uploaded.
- **Listening sound:** each Listening question can play recorded mp3 voices (American woman/man, British woman/man, "Mix" random by default, student's choice remembered in cookie `h212_voice`) from `audio/<voice>/<id>.mp3`; if no mp3 or it fails, the robot (browser speech, English voices only, two different voices for dialogues). Voice picks: Kokoro `af_heart`, `am_michael`, `bf_alice`, `bm_lewis`; UK voices skipped for American-only items (list `SKIP_UK` in `tools/make-audio.py`).
- **Conversation sound:** plays `audio/conversation/<id>.m4a` (woman + man recorded together, made by `tools/conversation-voices/make_voices.py` from `conversation-voices.csv`); falls back to the robot if the file is missing.
- **Saving:** answers save by question id (`h212_seen_questions`, `h212_current_wrong`, `h212_mistake_log`), quiz scores `h212_quiz_scores`, test scores `h212_test_scores`, video sentences `h212_video_sentences`, unlocks `h212_unlocked`, theme `h212_theme` (default Sakura; Classic/Sakura/Sky pickers on dashboard + Profile). Grading is in the browser (low-stakes practice).
- **Look:** all colours/fonts are variables at the top of `portal/components/base.css` (3 themes via `<html data-theme>`); Lexend + Zen Kaku Gothic New; Teacher Mike (pixel art, animated, gives hints/reactions with EN+JA text) on the dashboard and question screens.
- **Videos page:** lists the 71 lessons (thumbnail + ✓), each lesson = YouTube embed + 5 questions + "Your turn" sentence checked on the server (≥5 words, every required word used, case-insensitive, a word also matches the start of a longer word, curly quotes OK, 1–2-letter words must match exactly). Teachers read sentences in wp-admin → 212 English → Student Results → Video Sentences.
- **Translations:** every new piece of UI text goes in `portal/inc/i18n.php` in English AND Japanese (`t('key')` in PHP; `h212_js_strings([...])` for JS; `t_other()` gives the other language).
- **Cache safety:** Homework/Tests fetch the CSVs with a version number (so browsers never show an old list); picture and voice links carry file-time versions.

## 5. HOW LEVEL 2 CONTENT GETS PLUGGED IN (my plan — please follow)
I write the content in a separate "normal" Claude chat that has the `212-english-questions` skill, then paste/attach it here. Each drop will tell you the Level and Chapter(s). For each drop:
1. **Check the files first (don't trust them blindly):** same 12 columns; `level` = 2; `chapter` 1–17; ids all ≥ 2611, unique, no clash across the three CSVs; every `answer` equals one choice; listening/conversation questions have quoted lines after "You hear"; photo rows have an `image` name; no existing row changed. Report problems before touching anything.
2. **Add the rows** to `portal/homework-content.csv` (append only; keep the same line format) and Sentence Builder rows to `portal/build-content.csv`. Copy new pictures into `portal/images/vocab/`.
3. **Photo file names for Level 2 MUST be unique**: the folder is flat and Level 1 already uses `chNN_name.jpg`. Use `l2_chNN_name.jpg` (and `l3_...` later). Never overwrite an existing picture.
4. **Listening voices:** run `python3 tools/make-script.py` (rebuilds `portal/audio/script.csv` from the CSV), then `~/kokoro-env/bin/python tools/make-audio.py` (only makes files that don't exist yet; 4 mp3 per question). Zip the 4 voice folders (NOT script.csv) for me to upload with Hostinger File Manager.
5. **Conversation voices:** my content chat gives `conversation-voices.csv` (`id,line,voice,text`, voice F or M); put it in `tools/conversation-voices/` and run `~/kokoro-env/bin/python tools/conversation-voices/make_voices.py` (writes `portal/audio/conversation/<id>.m4a`). If `~/kokoro-env` is missing, ask me before installing anything (Kokoro is free, Apache-2.0, plus Homebrew `ffmpeg` and `espeak-ng`).
6. **Test on Local** (see §9): the new chapter's parts, a Photos question, a Listen question, a Conversation question, a Builder question, a Test; and that chapter-by-chapter unlock still works.
7. **Report:** how to test on iPhone + Mac, exact upload list with order, commit. Wait for me to say "put it on github".
Things to ask me at the start of Level 2: chapter list/titles, whether Level 2 also has 17 chapters, and whether Level 2 uses new videos (add rows to `video-content.csv`, ids from the global counter).

## 6. Upload ORDER (always, for any release)
1. mu-plugin PHP files (`public_html/wp-content/mu-plugins/`) — `212-progress.php` first, then the others.
2. Code files: components (`.js/.css`), `inc/*.php`, then the pages (`homework.php` etc.) last.
3. Pictures / audio (File Manager zips: files go directly into the target folder, no extra folder inside — I once got an extra folder level and it silently broke the voices).
4. The CSV files LAST (`homework-content.csv`, `build-content.csv`).
5. Hard-refresh (Cmd+Shift+R); on iPhone clear website data if it looks old. After a release you can sanity-check public files by comparing hashes with `curl` (e.g. `curl -s https://212english.com/portal/homework-content.csv | shasum -a 256`).

## 7. Things that already bit us (learn from these)
- After ANY big edit of `showQuestion()` in `homework.php`, DIFF it against the previous commit. I once accidentally deleted the top bar + card opener while adding photos (fixed 2026-10-13). Check all six parts render.
- Function names must not clash between an OLD uploaded mu-plugin and a NEW one (a duplicate name crashes the whole site). New shared helpers live in `212-progress.php` with unique names (`h212_progress_bank`, `h212_video_*`).
- The Tests page needs its nonce `window.H212_NONCE` (test scores silently failed to save until 2026-10-12).
- The server sends the CSV with no cache headers, so browsers may keep an old copy for hours — keep the `?v=` version on the CSV fetches.
- Photo/audio file names are case-sensitive on the live server (Mac is not). Match the CSV exactly.
- Raising the chapter limit or level count means touching several places: `212-progress.php` constants (`H212_LEVELS`, `H212_CHAPTERS`), plus hard-coded 17/5 in `homework.php`, `tests.php`, `inc/scores.php`, `inc/test-scores.php`. Grep for the number (also `< 17` comparisons).
- Replacing a chapter's questions with new ids makes everyone redo it (progress is by id). Adding questions to a finished chapter drops it from "Mastered" but never re-locks anything.
- The wp-admin "Homework Questions" screen rewrites `homework-content.csv` (sorted by level/chapter/id) on every save and must keep the `mode` column — don't use it while a bulk CSV edit is in progress.
- `portal/audio/script.csv` and everything in `tools/` stay on my Mac + GitHub, never on the live site.

## 8. Known limits / ideas (don't build unless I ask)
- The CSVs (with all answers) are publicly downloadable; grading and locks are enforced in the browser only — fine for practice, not for official exams.
- The login page is not themed. The dashboard greeting says "Chapter N" without the level (small polish for Level 2). 5 unused old pictures sit on the server (harmless).
- Ideas parked: study streak, Sakura/Sky extras beyond the picker, a kids' version, cloning the system for a second school, more videos per chapter.

## 9. How to test on Local, including when the Local app is OFF
- Normal way: start `212english-local` in the Local app, open https://212english-local.local/portal/ and log in as `master.test`; copy changed files into `~/Local Sites/212english-local/app/public/` first (portal/ and wp-content/mu-plugins/).
- If the Local app is off I use a private copy: copy Local's MySQL data folder (`~/Library/Application Support/Local/run/9QGADKEi6/mysql/data`) into the scratchpad, run Local's `mysqld` on another port/socket, run `php -S localhost:8090` on the Local site folder with an `auto_prepend_file` that defines `DB_HOST`, `WP_HOME`, `WP_SITEURL`, create a throwaway student with `wp_insert_user` in that COPY, log in with curl/the browser pane, test, then stop both servers. The scratchpad is wiped between days — rebuild it. Never use the real Local database for experiments, and never point anything at the live site.
- Useful checks: `php -l` every changed PHP file; call `h212_progress_state($user_id,false)` from a CLI script to see unlocks; drive the pages in the browser pane at phone size (375×812) and desktop.

## 10. Start of every session
Read this message and the brief, run `git status` and `git log --oneline -5`, tell me in 3 lines where we are, and ask what I'm adding today.

=====

*Level 2 starter message to paste right after the prompt above:*

> I'm starting **Level 2**. Chapter(s): ___. Attached: `homework-content.csv` additions (type=vocabulary/grammar/listening/photo/conversation, mode homework + test), `build-content.csv` rows, and (if any) pictures in a folder and `conversation-voices.csv`. Follow section 5: check the files first and tell me any problems, then add them on my Local copy, make the voices, test, and give me the upload list in order. Don't touch the live site.
