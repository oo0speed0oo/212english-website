# 212 English School — Project Brief

*Written 2026-10-11 for handing this project to a new Claude conversation. Everything here was checked against the actual code, the repo and the live site on that date. It contains no passwords or logins.*

---

## 0. Read this first

**Who I am:** Michael Placido. I own 212 English School, a bilingual (English/Japanese) English school in Japan. I am **not a developer**. I've built this site with AI help and I'm learning the tools as I go (VS Code, git/GitHub, FileZilla, WordPress admin, the Local app).

**What I want now:** to develop this site **much better**. Think bigger than small fixes: better learning experience, better teacher tools, safer and more reliable. Before changing anything big, tell me your recommendation and the trade-offs in plain language, and ask me.

**How to work with me** (these rules exist for good reasons, please follow them):
1. **Plain language, exact steps.** Explain tools in plain words, give exact menu names, button labels and file paths. Never assume I know developer terms.
2. **One step at a time** for anything involving FileZilla, wp-admin or the Local app. I get lost with long "click here, then here" instructions. Give me a copy-pasteable command or an exact file path instead.
3. **Never test on the live site.** An early mistake (dragging the whole `wp-content` folder in FileZilla, cancelled mid-upload) corrupted a plugin file and took the entire live site down. Everything is tested on my **Local** copy first, then I upload.
4. **Deployment is manual.** When something is ready, give me an exact list of files and which folder each goes in (for example "In `portal/inc/`: `scores.php` (overwrite)"). Never tell me to upload a whole folder.
5. **Lead with a recommendation.** Don't hand me an open menu of options. Say what you'd do and why.
6. **Never handle my passwords in chat.** If something needs a login, tell me to type it myself into the tool. (I once pasted a real GitHub token into a chat by mistake, so this matters.)
7. **Keep scope lean.** Finish a feature or hide it. No fake "coming soon" buttons.
8. **Before writing homework/test content, confirm which Level and Chapter it's for.** Don't assume. (This went wrong once.)
9. **The audience is adults.** A separate kids' version is a future project; don't compromise this one toward kids.

---

## 1. What this is, in plain words

- **Public website:** https://212english.com. A WordPress + Elementor site (homepage, prices, about, contact). It is finished. Not something to redesign unless I ask.
- **Student portal:** https://212english.com/portal/. A custom-built app inside the same site, behind a login. Students do **Homework** (practice quizzes), take short **Tests**, see **Grades**, watch **Videos** and edit their **Profile**. The interface is available in English and Japanese.
- **Teacher/admin tools:** inside WordPress admin, under a menu called **"212 English"**: see every student's progress, manage questions, review problem reports. Only I use these.
- **Current state:** live and used by real students. **Level 1 is fully written: 17 chapters, 745 homework questions and 170 test questions.** Levels 2 to 5 exist in the design but have no content yet.

---

## 2. Technology and hosting

| | |
|---|---|
| Host | Hostinger (hPanel), LiteSpeed web server |
| PHP | 8.3.33 (live) |
| WordPress | 7.1.2 (live); Elementor 4.3.3 |
| Plugins (per my Local copy) | Polylang, Elementor, LiteSpeed Cache, Hostinger onboarding/reach, a background plugin |
| Portal code | Plain PHP + plain JavaScript. **No framework, no build step, no database tables of our own.** |
| Styling | One file: `portal/components/base.css` (cream and gold theme, CSS variables at the top) |
| Student accounts | Real WordPress users with a custom role **"student"**. I create them by hand in wp-admin → Users → Add New. Students can't self-register. |
| Where data lives | WordPress **user meta** (progress and scores) + **one CSV file** (all questions) |
| Local test copy | "Local" app by WP Engine on my Mac. Site name `212english-local`, https://212english-local.local, files in `~/Local Sites/212english-local/app/public`. Its own database and its own `wp-config.php` (never copy the live one over it). Must be started in the Local app before use. |
| Deployment | **Manual FileZilla uploads.** No automation, no staging site. |
| QA account | `master.test` (a student account) exists on both live and Local, used only for testing. |

---

## 3. The repo and links

- **Repo:** https://github.com/oo0speed0oo/212english-website (public, branch `main`, 26 commits as of today, solo work, I push straight to `main`)
- **Clone:** `git clone https://github.com/oo0speed0oo/212english-website.git ~/Documents/212english-website`
- **The repo mirrors the whole live `public_html`**, WordPress core included. Only these paths are our own custom code:

| Path | Link |
|---|---|
| `portal/` (the whole student app) | https://github.com/oo0speed0oo/212english-website/tree/main/portal |
| `portal/inc/` (shared code + JSON endpoints) | https://github.com/oo0speed0oo/212english-website/tree/main/portal/inc |
| `wp-content/mu-plugins/212-*.php` (admin tools) | https://github.com/oo0speed0oo/212english-website/tree/main/wp-content/mu-plugins |
| The quiz engine | https://github.com/oo0speed0oo/212english-website/blob/main/portal/homework.php |
| All questions (raw) | https://raw.githubusercontent.com/oo0speed0oo/212english-website/main/portal/homework-content.csv |

- `.gitignore` excludes `wp-config.php`, `wp-content/uploads/`, cache/upgrade folders, `.maintenance`, `.DS_Store`.
- Loose files named `portal/BACKUP*homework-content.csv` exist on my Mac. They are safety copies, deliberately **not** in git and **never** to be uploaded.
- Git commit messages in this repo are written in plain English and are a decent history of how things were built (`git log --oneline`).

---

## 4. Map of the custom code

| File | What it does |
|---|---|
| `portal/login.php`, `logout.php` | Log in with `wp_signon()` (WordPress's own login). Only users with the student role get in. |
| `portal/inc/auth.php` | The gatekeeper every portal page and endpoint includes: loads WordPress, requires a logged-in student, sets `$h212_user`, loads translations. |
| `portal/dashboard.php` | Four cards: Homework, Tests, Videos, Grades. |
| `portal/homework.php` (~590 lines) | The practice-quiz engine. Mostly JavaScript inside a PHP page. |
| `portal/tests.php` (~425 lines) | The Tests feature, a simplified sibling of homework.php. |
| `portal/grades.php` | The student's own progress view. Server-rendered PHP. |
| `portal/videos.php` | Lists the YouTube channel's recent uploads. **Fragile** (see section 9). |
| `portal/profile.php` | Student edits name, birthday, location. |
| `portal/inc/nav.php` | Top bar, sidebar (hamburger drawer on phones), the "Report a Problem" button and panel, and the automatic error detector. |
| `portal/inc/i18n.php` | The EN/JA dictionary. `t('key')` in PHP, `h212_js_strings([...])` to pass strings to JavaScript. Language is a cookie, switched with `?lang=ja` or `?lang=en`. |
| `portal/inc/seen.php`, `mistakes.php`, `scores.php`, `test-scores.php`, `report.php` | Small JSON endpoints the pages call with `fetch()` (see section 5). |
| `portal/components/base.css`, `portal.js` | Styles; and a tiny config object (YouTube channel id). |
| `portal/homework-content.csv` | **Every question.** |
| `portal/images/vocab/` | 7 photos. `portal/audio/` is empty. |
| `wp-content/mu-plugins/212-student-portal.php` | Registers the student role, adds birthday/location/phone fields to the WordPress user screen, sends students away from wp-admin, hides the admin bar for them. |
| `212-teacher-results.php` | **Student Results** page + the Unlock tool. |
| `212-homework-admin.php` | **Homework Questions** page (add/edit/delete/upload). |
| `212-problem-reports.php` | **Problem Reports** page. |

(`mu-plugins` = "must-use plugins": WordPress loads every file in that folder automatically, no activation needed.)

---

## 5. Data model

### The question file: `portal/homework-content.csv`
Header (exactly, 12 columns on **every** row):
`id,level,chapter,type,question,choice_a,choice_b,choice_c,answer,image,audio,mode`

- `type`: `vocabulary`, `grammar`, `listening`, or `photo` (photo questions count as vocabulary).
- `mode`: `homework` or `test`. Homework pages ignore `test` rows and the Tests page only reads `test` rows.
- Every question has exactly 3 choices. `answer` must exactly match one of them.
- `image` / `audio` are optional filenames (images in `portal/images/vocab/`, audio in `portal/audio/`). Any question can have either.
- Today: 915 rows (745 homework + 170 test), levels: only 1, chapters 1 to 17, highest id 1409, 7 images, 0 audio files.

### Per-student data (WordPress user meta, **never** in the CSV)
| Key | Holds |
|---|---|
| `h212_seen_questions` | Ids of every question the student has answered at least once |
| `h212_current_wrong` | Ids they currently have wrong (cleared when they get it right) |
| `h212_mistake_log` | Permanent log of every wrong answer: id, question text, what they chose, correct answer, date |
| `h212_quiz_scores` | Every finished Homework quiz: level, chapter, type, score, total, date |
| `h212_test_scores` | Every finished Test: level, chapter, score, total, date |
| `h212_birthday`, `h212_location`, `h212_phone` | Profile fields |

Site-wide: option `h212_problem_reports` (last 200 reports) and short-lived "transients" `h212_err_*` (used to limit error emails).

### Endpoints (all need a logged-in student; saves need a security token)
| URL | Does |
|---|---|
| `portal/inc/seen.php` | GET list / POST mark a question seen |
| `portal/inc/mistakes.php` | GET current wrong list / POST record a right-or-wrong answer |
| `portal/inc/scores.php` | GET / POST Homework quiz scores |
| `portal/inc/test-scores.php` | GET / POST Test scores |
| `portal/inc/report.php` | POST a problem report (manual or auto-detected) |

Security tokens ("nonces"): `h212_save_score` is shared by seen/mistakes/scores/test-scores; `h212_report_problem` is used by reports.

---

## 6. How it behaves

**Homework** (levels 1 to 5, chapters 1 to 17, three quiz types per chapter):
- Student picks Level → Chapter → Vocabulary / Grammar / Listening, then answers one question at a time with instant right/wrong feedback.
- **Question order:** never-seen questions first; then ones currently wrong (so mistakes get another try); only after both are cleared does a retake bring back the full set.
- Each answer is saved immediately (seen / wrong). Finishing a quiz saves a score.
- A quiz shows "✓ Finished · X/Y" (best score) only when every question in it has been answered and none is currently wrong. Finished quizzes ask "start again?" before retaking. Chapter tiles show an `n/3` badge (green at 3/3).
- **Locking:** chapter N+1 opens when chapter N is fully finished (all 3 types). Level N+1 opens when every chapter of level N is finished. Level 1 chapter 1 is always open.

**Tests:** one combined test per chapter (all question types mixed, about 10 questions, a *different* pool from Homework so it isn't a repeat). No per-question tracking. Score saved per chapter, best score shown, retake allowed. A chapter's Test is reachable only when its Homework chapter is unlocked. Chapters with no test show "No test yet".

**Grades:** per chapter, one of **Mastered / Needs Practice / Not Started**, based on where the student stands *now*, not their history. **No raw scores or percentages on purpose**: I want it encouraging and "fixable", never a permanent record of failure.

**Report a Problem:** a floating button (bottom-right on every portal page) opens a panel that slides up. Reports email `info212english@gmail.com` and are saved to the Problem Reports page. **The system also detects JavaScript errors automatically** and reports them silently (at most one email per distinct error per hour).

**Admin tools** (wp-admin → 212 English): *Student Results* (pick a student: progress grid, summary, score history, every wrong answer and whether it's since been fixed; plus an **Unlock up through [Level][Chapter]** tool that marks everything up to that point as done), *Homework Questions* (full add/edit/delete, photo/audio upload, Mode field and filters; **every save rewrites the whole CSV sorted by level, chapter, id**), *Problem Reports* (filterable list, Clear All).

---

## 7. Content status (Level 1)

| Chapters | Homework | Test |
|---|---|---|
| 1 | 20 | 10 |
| 2 | 43 | 10 |
| 3 | 33 | 10 |
| 4 | 33 | 10 |
| 5 | 49 | 10 |
| 6 | 52 | 10 |
| 7 | 65 | 10 |
| 8 | 46 | 10 |
| 9 | 39 | 10 |
| 10 | 40 | 10 |
| 11 | 46 | 10 |
| 12 | 40 | 10 |
| 13 | 34 | 10 |
| 14 | 38 | 10 |
| 15 | 40 | 10 |
| 16 | 79 | 10 |
| 17 | 48 | 10 |

- The syllabus (vocabulary and grammar per chapter) lives in the CSV itself and in a Claude skill named **`212-english-questions`** for writing/auditing questions. I write new questions in a separate Claude chat and paste rows in.
- **Rules for adding or changing questions** (these protect students' saved progress, because progress is saved *by question id*):
  1. Never change, reuse or renumber an existing `id`. New ids go above the current highest (1409).
  2. Give only the **new rows to append**. Don't rewrite existing rows.
  3. Don't change `level`, `chapter`, `type` or `mode` of an existing row.
  4. Adding questions to a chapter students already finished re-opens it and can re-lock later chapters. Replacing a chapter's questions makes everyone redo it.
  5. Every row needs all 12 columns (a short row is silently dropped by the admin screens), `answer` must match a choice exactly, and fields with commas or quotes must be quoted.
  6. Uploading a new CSV can **never** erase scores, because scores live in the WordPress database, not the CSV.
- Students noticed some old scores/badges disappeared after a big question update. The likely cause: chapters 4 to 16 used to hold 3 placeholder questions each, which were replaced with real content, so those chapters count as unfinished. The old attempts are still saved. I chose not to pursue it further.

---

## 8. Things that already bit us (gotchas)

- **WordPress admin menu order:** `mu-plugins` files load alphabetically. A submenu registered before its parent exists gets a broken link (404). Fix: register dependent submenus on the `admin_menu` hook with priority 20. Already applied; keep doing it for any new admin page.
- **The chapter limit (17) and level count (5) are hardcoded in about 8 files**, including `<` comparisons, not just `<=`. When we went from 16 to 17 chapters, Chapter 17's questions were live but invisible and their scores were rejected until we updated: `homework.php`, `tests.php`, `grades.php`, `scores.php`, `test-scores.php`, `i18n.php` (dashboard text), `212-homework-admin.php`, `212-teacher-results.php`.
- **The lock logic is copy-pasted** in four places (JS in `homework.php` and `tests.php`; PHP in `grades.php` and `212-teacher-results.php`). Change one, change all four.
- **The Unlock tool replaces a student's whole "seen" list** and doesn't create scores. It once caused a crash in the "already finished" screen (fixed).
- **Local app quirks:** it must be running; it uses a self-signed certificate (browsers warn); WordPress auto-updates can leave a `.maintenance` file that blocks admin; Polylang redirects malformed admin URLs to the live domain; a Hostinger "preview domain" plugin is present on Local.
- **Never upload a whole `wp-content` folder.** Upload specific files only.

---

## 9. Honest limitations and technical debt

1. **Answers are not secret.** The CSV (with every answer) is downloadable by anyone at `https://212english.com/portal/homework-content.csv` and is in the public GitHub repo. Quizzes are **graded in the browser**, the server accepts any score within valid ranges, and the locks are enforced only in the browser. Fine for low-stakes practice; not suitable for official graded exams or certificates.
2. **Questions live in one CSV file** that is rewritten wholesale, with no history, so edits made in wp-admin and edits made by uploading a file can overwrite each other.
3. **Deployment is manual.** No staging site, no automated tests, no automatic deploy, and nothing checks that the files I upload match what's in GitHub. My Local copy is not synced with live.
4. **Listening is text only.** There are no audio files; "listening" questions say "You hear…" in writing. The `audio` column and player exist but are unused. Only 7 photo questions exist.
5. **Question content is English only.** The interface is bilingual, but question text, hints and feedback are not translated.
6. **The Videos page** loads the YouTube feed through a free third-party proxy (`corsproxy.io`) that could stop working any day. Proper fix: have WordPress fetch and cache the feed on the server.
7. **One admin (me).** No teacher role, no classes or groups, no per-class reports.
8. **Problem reports don't include the browser/device**, which made at least one error (a Safari "maximum call stack" report) hard to diagnose.
9. **I haven't set up my own backups of the database**, which is where all student progress lives. GitHub only holds code and the CSV. Hostinger may keep its own backups; that needs checking.

---

## 10. Roadmap and ideas

**Things I've already decided or parked:**
- Levels 2 to 5: later, one level at a time, after Level 1 is solid.
- A separate **kids' version**: later, its own design.
- One **YouTube lesson video per chapter** for struggling students (paused; simpler than the proxy problem).
- **Clone the whole system for a second school** (separate domain, separate WordPress install and database). Keep code free of "212 English School" hardcoding where reasonable.
- Fix the Videos proxy.

**What I'd like a new Claude to propose (rough priority, my suggestions):**
1. **Move grading and answers to the server** (and ideally questions into a proper database table), so answers aren't downloadable and scores can't be faked.
2. **Real audio for Listening** (recorded or text-to-speech); the biggest teaching gap today.
3. **One config for levels/chapters and one shared "is this unlocked" function**, to end the copy-paste problem.
4. **Safer deploys:** a staging copy, an automatic deploy (for example a GitHub Action), and a script that validates the CSV before it ships.
5. **Teacher features:** a teacher role, classes, class-level reports, "most-missed questions".
6. A **review mode** built on the wrong-answer log (spaced repetition).
7. Japanese hints/translations on questions; accessibility and phone polish.
8. Add browser/device to problem reports.

---

## 11. Starter message to paste with this file

> I'm Michael, owner of 212 English School. I've attached a project brief for my WordPress site and student portal (repo: https://github.com/oo0speed0oo/212english-website). Please read it fully, then follow the "How to work with me" rules in section 0. I want to develop this site much further. Start by summarising back to me, in plain language, what you understand the site does and the 3 biggest improvements you'd recommend first, with the trade-offs. Don't change anything yet.

---

## 12. Update, 2026-10-12: parts, Sentence Builder, unlock rule, new look, Teacher Mike (committed, not yet uploaded when written)

- **Six practice parts per chapter** (3 groups): Vocabulary = Photos (`type=photo`) + Words (`type=vocabulary`); Grammar = Fill in the blank (`type=grammar`) + Sentence Builder (`portal/build-content.csv`, type `builder`); Listening = Listen (`type=listening`) + Conversation (`type=conversation`, no rows yet; the spoken line is read by the robot voice). Empty parts show "Coming with new lessons" and are skipped by the lock rule.
- **build-content.csv** columns: `id,level,chapter,mode,source_id,prompt_ja,tiles,extra` (tiles = correct order, `|` separated; extra = trap tiles). Ids 1410-1759, shared sequence with homework-content.csv (next new id **1760**). Tests add 3 random `mode=test` builder questions after the normal ones.
- **ONE shared rules file:** `wp-content/mu-plugins/212-progress.php` (question bank, parts, chapter stats, unlock rule, constants `H212_LEVELS`, `H212_CHAPTERS`, `H212_UNLOCK_PERCENT`). Used by `portal/inc/progress.php` (JSON for Homework + Tests), `grades.php`, `dashboard.php`, `212-teacher-results.php`, and `212-homework-admin.php` (new ids stay clear of builder ids).
- **Unlock rule:** next chapter opens at 70% of the previous chapter's homework (all parts; finished = answered and not currently wrong). Once open it stays open (user meta `h212_unlocked`). First run per student keeps everything they could open under the old rule. "Mastered" (Grades) is still 100%. The wp-admin Unlock tool marks questions seen and saves the unlocks.
- **Fixed:** the Tests page never had its nonce, so test scores were not saving; Grades/teacher grid counted Test questions as unfinished homework.
- **Look:** tokens at the top of `portal/components/base.css` (navy #14284B, warm white #FBF8F2, gold #C99A2E, Lexend + Zen Kaku Gothic New). Shared helpers: `components/ui.js` (icons, question top bar), `components/builder.js` (Sentence Builder), `components/mike.js` + `inc/mike.php` (Teacher Mike reactions; picture is `portal/images/mike.svg`, drawn inline).
- **Local testing without the Local app:** copy Local's MySQL data folder, run Local's `mysqld` on a spare port/socket and `php -S` with an `auto_prepend_file` that defines `DB_HOST`, `WP_HOME`, `WP_SITEURL`. Create a throwaway student in that copy. (Never against live.)

## 13. Update, 2026-10-12: video lessons

- `portal/video-content.csv` (426 rows, 71 videos x 5 `question` rows + 1 `write` row; ids 1760-2185; next new id **2186**). `videos.php` lists them in `order` (YouTube thumbnails, no more corsproxy); `videos.php?v=<video_id>` is one lesson: youtube-nocookie embed, 5 questions (saved by id in the same seen/wrong meta, mistakes logged with type `video`), then "Your turn".
- "Your turn" is checked on the server (`portal/inc/video-sentence.php` + `h212_video_check_sentence()` in `212-progress.php`): at least 5 words, every required word/phrase used (case-insensitive; a word also matches the start of a longer word; 1-2 letter words must match exactly; curly quotes become straight). Saved in user meta `h212_video_sentences` (video_id, id, text, date). Teachers read them in wp-admin > 212 English > Student Results > Video Sentences.
- Videos do NOT count for chapter unlocks (they are not in `h212_progress_bank()`); `h212_hwadmin_next_id()` also looks at video ids.

## 14. Update, 2026-10-13: photo questions

- 255 new `type=photo` rows (ids 2186-2440, Chapters 1-17) in `homework-content.csv`; pictures live in `portal/images/vocab/` (`chNN_name.jpg`, exact lower-case spelling). 187 pictures were ready; 68 still being made.
- A photo question whose picture file is not in that folder is **hidden completely** (not shown, not counted for finishing or the 70% rule), on the server (`h212_progress_bank()` uses `h212_vocab_images()`) and in the page (`window.H212_IMAGES`). It appears by itself once the file is uploaded. A chapter with no pictures shows "Photos are coming soon".
- The old unlock rule used for each student's first-run migration now looks only at original questions (ids <= `H212_LEGACY_MAX_ID` = 1409), so adding questions can never lock out a student who has not visited since the rule changed. Upload the updated `212-progress.php` BEFORE the CSV.

## 15. Update, 2026-10-13: Conversation part, Conversation voices, fixes (the newest summary is `212-handoff-prompt.md`)

- 170 `type=conversation` rows (ids 2441-2610, 10 per chapter, Level 1). Text `You hear "a" "b" Question?`: only a big Play button + the text after the quotes show; after answering, the conversation text appears. Real voices: `portal/audio/conversation/<id>.m4a` (made by `tools/conversation-voices/make_voices.py` from `conversation-voices.csv`, F = af_heart, M = am_michael), robot fallback if a file is missing. `inc/voices.php` lists the files for the page.
- Fixed: my photo update had deleted the top bar/card lines from `showQuestion()` (restored); the CSV fetches now carry a version number because the server sends no cache headers.
- Next free id: 2611. Level 2 readiness was tested with fake Level 2 rows (unlock, chapters, tests, dashboard, Grades all fine).
