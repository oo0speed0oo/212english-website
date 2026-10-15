# Build "the same portal" as a site for learning JAPANESE — full handoff prompt (written 2026-10-15)

**What this is:** everything that was built for the 212 English School student portal, written so a new Claude can create the SAME thing again for a Japanese-learning site ("another coat of paint"). Same features, same question types, same look system, same progress/unlock rules, same voices, same workflow — only the language being taught changes, plus a new brand.

**How to use:** start a NEW project folder (e.g. `~/Documents/japanese-site`) and open a NEW Claude Code chat in it. Paste everything between the two `=====` lines. Also give Claude this file's twin for background if you like: `212-handoff-prompt.md` (how the English site is run day to day) — it is in the English repo.

=====

You are my hands-on developer and guide. I am Michael Placido (non-developer, owner of a small English school in Japan). I already have a finished, working student portal for **212 English School** (English learning). I now want the **same portal as a new site for learning Japanese**: identical structure and features, a new name/colours/mascot, Japanese content. Read ALL of this first.

## 0. My rules (follow exactly)
1. **Work on a LOCAL copy only. Never touch any live site.** I publish myself.
2. **I upload by hand** (FileZilla; Hostinger File Manager for zips). After every job give me the EXACT files and the folder each goes in. NEVER "upload the folder". Give the upload ORDER when it matters.
3. **Plain language, one step at a time, exact paths, lead with your recommendation, short replies.** Explain any jargon in one line.
4. **Ask permission before installing anything** (one plain sentence per install; check licences allow commercial use). Never handle my passwords/tokens in chat — I type secrets myself.
5. **Test before you say it works** and show what you checked. Say plainly what you could not test (e.g. a real iPhone).
6. **Commit with a plain-English message** (add the Co-Authored-By line the tool asks for). Push to GitHub only when I say so.
7. **Never change/renumber/reuse a question id** once content exists (student progress is saved by id). Never change existing rows unless I say so.
8. **Confirm the Level and Chapter before writing content.** Keep scope lean. Don't add features I didn't ask for.
9. After EVERY job: (a) how to test on Local on iPhone + Mac, (b) exact files changed + folders, (c) the commit. Then wait.
10. If a prompt of mine says "check X first; if not OK, tell me and stop" — do that.

## 1. THE FASTEST, SAFEST WAY: copy the working English code and re-skin it
The English portal is public code: https://github.com/oo0speed0oo/212english-website (branch `main`). It is a whole WordPress install, but **only two parts are ours**:
- `portal/` — the student app (PHP + vanilla JavaScript, no framework, no build step)
- `wp-content/mu-plugins/212-*.php` — 5 small WordPress "must-use" plugins: `212-progress.php` (the brain), `212-teacher-results.php`, `212-homework-admin.php`, `212-problem-reports.php`, `212-student-portal.php`. (Ignore `hostinger-*.php`; those belong to Hostinger.)
Get just those parts without the 96 MB of WordPress:
```
git clone --depth 1 --filter=blob:none --sparse https://github.com/oo0speed0oo/212english-website.git english-src
cd english-src && git sparse-checkout set portal wp-content/mu-plugins
```
Then copy `portal/` and the five `212-*.php` files into the NEW project and read `212-handoff-prompt.md` and `212-english-project-brief.md` from that repo for the English site's details. **Do not rebuild from scratch — the code is the specification.** Keep all internal names (`h212_…` functions, `H212…` JS, `h212_…` user-meta keys, `/portal/` path): renaming them gives zero benefit and adds risk because this will be a separate WordPress install with its own database. Only change what students SEE (brand, colours, mascot, text, content, voices).

New site set-up (I will do the hosting clicks, you guide me): a new domain/subdomain + a fresh WordPress install on Hostinger; a new Local app site for testing; a new GitHub repo for this project. The portal needs WordPress only for logins/users (role "student") and the database; the marketing pages (Elementor etc.) are a separate job. Portal URL is `/portal/` (the language cookie path and redirects assume it).

## 2. What the finished English portal does (reproduce all of it)
**Students** log in at `/portal/login.php` (real WordPress users, role "student"). Pages: Dashboard, Homework, Tests, Videos, Grades, My Profile. EN/JA interface toggle (cookie), "Report a Problem" button (emails me + keeps a log + silent automatic JavaScript-error reports), mobile menu, 3 colour themes.
- **Level → Chapter → 6 practice parts.** 5 levels × 17 chapters (constants `H212_LEVELS`, `H212_CHAPTERS` in `212-progress.php`; a few files also hard-code 17/5: `homework.php`, `tests.php`, `inc/scores.php`, `inc/test-scores.php`). Each chapter's Homework = 6 parts in 3 groups: **Vocabulary** (Photos, Words) · **Grammar** (Fill in the blank, Sentence Builder) · **Listening** (Listen, Conversation). A part with no questions says "Coming with new lessons" and is skipped.
- **Question screens:** top bar with progress, big answer buttons, ✅/❌, Next; Teacher Mike mascot gives a hint when a question appears and reacts to right/wrong/finished (text in two languages).
- **Unlock rule (the heart, in `212-progress.php`):** chapter N+1 opens when 70% of chapter N's homework questions (all parts together) are *finished* (= answered and not currently wrong). The first chapter of the next level opens when chapter 17 of the previous level hits 70%. Once open it stays open forever (user meta). "Mastered" (Grades) = 100%. Tests open with their chapter. Videos never count. A one-time migration protected existing students when the rule changed (not needed on a brand-new site, but harmless).
- **Question types (rows of one CSV):** `vocabulary` (Words), `grammar` (Fill in the blank), `listening`, `photo`, `conversation`, plus `mode=test` rows (about 10 per chapter, grammar + listening mixed, one combined test per chapter).
- **Listening:** `You hear "sentence." Question?` — the quoted text is HIDDEN on screen; a Listen button plays it. Two quoted parts = two people (two different voices). Recorded voice files per question + the browser's built-in "robot" voice as fallback (see §5).
- **Conversation (part 6):** `You hear "line 1" "line 2" What is the best reply?` — only a big ▶ Play button + the text after the quotes show; after answering, ✅/❌ then the conversation text appears. Recorded woman+man file per question; robot fallback.
- **Photos:** a picture (up to 600 px wide, rounded) + 3 answer buttons. If a question's picture file is missing it is HIDDEN completely (not shown, not counted) and appears by itself when the file is uploaded. Pictures live in `portal/images/vocab/`.
- **Sentence Builder:** shows a sentence (in the learner's language); the student taps shuffled word tiles into order (traps = extra wrong tiles); Check = exact order; then ✅ or the correct sentence is shown and spoken. Data file `build-content.csv`. Tests add 3 random builder questions per chapter.
- **Video lessons:** `video-content.csv` lists YouTube videos; each lesson = embedded video (youtube-nocookie) + 5 multiple-choice questions + a "Your turn" writing box (must use required words, minimum length; checked on the server; saved for the teacher). Thumbnails + ✓ on the list.
- **Grades page:** per chapter Mastered / Needs Practice / Not Started (current standing, never a permanent score record).
- **Themes:** Classic (navy/gold), Sakura (pink, default), Sky (blue), chosen by the student (dashboard + profile), saved in the account; all colours are CSS variables at the top of `portal/components/base.css`.
- **Dashboard:** mascot greeting card (2 languages), big "Continue" card with progress ring, 4 tiles (Homework, Tests, Grades, Videos).
- **Teacher side (wp-admin → "212 English" menu):** Student Results (progress grid with %, score history, wrong answers, video sentences, an "Unlock up through Level/Chapter" tool), Homework Questions (add/edit/delete questions, upload photo/audio), Problem Reports.

## 3. The data files (identical format; only the content changes)
`portal/homework-content.csv` — exactly these 12 columns, in this order:
`id,level,chapter,type,question,choice_a,choice_b,choice_c,answer,image,audio,mode`
`type` ∈ vocabulary | grammar | listening | photo | conversation · `mode` ∈ homework | test · `answer` must EXACTLY equal one of the three choices · `image` only for photo rows · every row must have all 12 columns · fields with commas/quotes wrapped in double quotes (use a real CSV writer).
`portal/build-content.csv` — `id,level,chapter,mode,source_id,prompt_ja,tiles,extra` (tiles = correct order separated by `|`, extra = trap tiles separated by `|`).
`portal/video-content.csv` — `id,video_id,order,title,type,question,choice_a,choice_b,choice_c,answer,required_words,example` (per video: 5 `question` rows + 1 `write` row; `required_words` separated by `|`; unused cells `-`).
**One global id counter for all three files** (never reuse). The English site used: 5–1409 homework · 1410–1759 builder · 1760–2185 videos · 2186–2440 photos · 2441–2610 conversation. The Japanese site starts at id 1 (or 1001 — your call, but keep ONE sequence).
Scale of the English Level 1 (for planning): per chapter ≈ 17 vocabulary, 21 grammar, 5 listening, 13 photo, 10 conversation, 13 builder; tests = 10 (+3 builder); 71 videos in total. Photos are 600×600 JPG (~40–70 KB each); file names lowercase `chNN_name.jpg` (a flat folder, case-sensitive on the server — for Level 2+ use `l2_chNN_name.jpg`).

## 4. How the English site was built, in the order that worked (use as milestones)
1. Standalone PHP pages gated by WordPress login (role "student"), EN/JA dictionary (`inc/i18n.php`: `t('key')`, `h212_js_strings([...])`, `t_other()`).
2. Question bank CSV + Homework (level → chapter → type), progress saved per student in user meta by question id (`seen`, `current_wrong`, `mistake_log`, scores), Tests, Grades, Videos, Profile.
3. wp-admin tools (Student Results, Homework Questions, Problem Reports) + Report-a-Problem.
4. Listening: hide the quoted text, robot voice (browser speech) → then recorded voices for every question (free open-source Kokoro text-to-speech run on the Mac; 4 voices; picked by listening to samples) with a "Who do you want to hear?" picker (faces + Mix) and robot fallback.
5. 6 parts per chapter, Sentence Builder, the new 70% unlock rule in ONE shared mu-plugin, video lessons, photo questions (hidden-if-missing), Conversation part + recorded Conversation voices.
6. New look (design samples → `base.css` variables), three themes, animated Teacher Mike (inline pixel-art SVG with `.eyes`, `.mouth-open`, `.mouth-closed` parts; bobs, blinks, mouth moves ~3 s while a speech bubble appears; respects "reduce motion").
All of this already exists in the code you are copying — your job is to adapt, not to rebuild.

## 5. WHAT MUST CHANGE FOR JAPANESE (the real work) — exact places
**A. Brand / visible text (find and replace; keep internal `h212` names).**
- Page titles `212 English – …` in `dashboard.php, homework.php, tests.php, grades.php, videos.php, profile.php, login.php`; logo `<em>212</em> English School` in `inc/nav.php` and `login.php`; `profile.school_role` in `inc/i18n.php`.
- Report email `info212english@gmail.com` and subjects `212 English Portal - …` in `inc/report.php`; YouTube channel id `UC-gtB79-gCRtneuBLGwpbgg` in `portal/components/portal.js` and `portal/videos.php`.
- wp-admin menu name "212 English" in the three admin mu-plugins.
- Mascot: replace `portal/images/mike.svg` with a new teacher character (keep the SVG structure: root class `mike talking`, viewBox 32×34 pixel art, groups `.eyes`, `.mouth-closed`, `.mouth-open`) and the reaction texts (`mike.*` keys in `i18n.php`) / name "Teacher Mike" (`dash.teacher`). Replace the voice-picker face pictures `portal/images/voices/*.svg` (see D).
- Colours/fonts: variables at the top of `portal/components/base.css` (3 theme blocks). Sakura (pink, default) already suits a Japanese site; choose a new palette if you want a different look. Fonts are Lexend (Latin) + Zen Kaku Gothic New (Japanese) — fine for both.
- Delete English content: empty the three CSVs (keep header rows), delete `portal/images/vocab/*` (keep the folder), `portal/audio/*` (keep `README.txt`), `portal/audio/script.csv`.

**B. Decide the language setup up front (ask me):** The English site's UI is EN/JA because its students are Japanese adults learning English. For a Japanese-learning site the learners are probably English speakers, so: UI = English (default). I recommend KEEPING the bilingual labels ("Photos · 写真", "Words · 単語") — they become free Japanese exposure — and keeping the EN/JA toggle, but a Japanese-only UI is optional. Review every `ja` string in `i18n.php` (e.g. greetings use "{name}さん"; `profile.school_role`; the Japanese `listen.no_voice` message). If learners speak another language (Spanish, Chinese…), the dictionary pattern supports adding it.

**C. Robot voice and audio language (`portal/components/listen.js`).** It currently accepts ONLY English voices (`/^en([-_]|$)/` at the voice filter, `en-US` scoring, `'en-US'` defaults, `rate 0.9`, English voice-name lists `MALE`/`FEMALE`/`NOVELTY`). Change to Japanese: accept `ja`/`ja-JP` voices only, never fall back to an English voice for Japanese text; update the gender-name lists to the Japanese system voices (typically macOS/iOS "Kyoko" female and "Otoya" male; Google Japanese on Android/Chrome — verify what the devices actually list), keep two different voices for two-person dialogues, consider a slower rate (~0.85). Update comments and the "no Japanese voice found" message (EN + JA).

**D. Recorded voices.** English used Kokoro (free, Apache-2.0) with American/British × woman/man = 4 voices in folders `portal/audio/{us_woman,us_man,uk_woman,uk_man}/<id>.mp3`. For Japanese: **test first** (I have not): Kokoro lists Japanese voices (needs the Japanese add-on `misaki[ja]`); alternatives are VOICEVOX (free, check each voice's licence terms) or a paid service. Listen to samples with me and let me pick (one woman + one man is enough to start; the picker supports any number of voices). The voice list is in 4 places that must match: `VOICE_KEYS` in `listen.js`, folder names in `inc/voices.php`, labels `listen.*` in `i18n.php`, face pictures `images/voices/<key>.svg`; the generator is `tools/make-audio.py` (reads `portal/audio/script.csv`, made by `tools/make-script.py` from the CSV by the same "quoted text after You hear" rule). Mono ~64 kbps mp3 keeps files small. Conversation voices: `tools/conversation-voices/make_voices.py` + a list `conversation-voices.csv` (`id,line,voice F/M,text`) → `portal/audio/conversation/<id>.m4a` (woman + man, 0.7 s pause between lines). Remember: iPhones need the sound to start from a tap (already handled), and files must be uploaded so they sit directly in the folder (no extra folder level).

**E. Sentence Builder for Japanese (no spaces between words).** Today the correct sentence = tiles joined with a SPACE: in `portal/components/builder.js` (`answer = tiles.join(' ')`, `chosen = placed…join(' ')`) and in `212-progress.php` (`implode(' ', explode('|', tiles))`). For Japanese join with `''` (no space). The prompt column is called `prompt_ja` because the prompt was Japanese; for the new site the prompt is the learner's language (English) and the tiles are Japanese — rename the column/field to `prompt` everywhere (builder.js parse, `212-progress.php` bank, the CSV header) and change the `lang="ja"` attribute on `.builder-prompt` to `lang="en"`. Tiles = words/particles (e.g. 私|は|学生|です); trap tiles = wrong particles/forms. The correct sentence is read aloud by the Japanese robot voice.

**F. Video "Your turn" (writing task) for Japanese.** The checker is `h212_video_check_sentence()` in `212-progress.php` (+ `inc/video-sentence.php`): English rules = at least 5 words, every required word used (case-insensitive, prefix match, curly quotes folded). For Japanese rewrite: normalize with NFKC (full-width/half-width), ignore spaces/punctuation, require a minimum number of CHARACTERS instead of 5 words, match each required word/stem as a simple substring (so 食べ matches 食べます), optionally fold hiragana↔katakana, decide whether romaji answers are accepted. Update the messages (`videos.need_five`, etc.). Re-test with every example sentence in the CSV (the English site's rule passed 71/71 of its own examples — do the same check).

**G. Furigana / kanji policy (decide with me before writing content).** Question and choice text is inserted into the page as HTML, and the answer check compares the button's visible text with the `answer` column. If you put `<ruby>` furigana inside question text, the visible text (`textContent`) includes the readings and answers will NOT match. Recommendation: Level 1 (≈JLPT N5) mostly hiragana/katakana + a few simple kanji, with readings handled by a separate display feature (e.g. extra CSV columns or a "show furigana" toggle that never changes the stored answer strings). Decide this first; it affects every question.

**H. Other small things.** Photo file names must be plain ASCII lowercase (`n5_ch02_kitchen.jpg`) even though the answer is Japanese (the old "guess the picture from the answer word" fallback must not be used — always fill the `image` column). Grading is an exact string compare, so keep one canonical form per answer (full-width/half-width, spaces). Labels like "Level 1" can carry the JLPT name ("Level 1 · N5") via `i18n.php`. The six part names and icons are tables in `homework.php` (`GROUPS`) and `components/ui.js` (icons) — change them only if the parts themselves change.

## 6. The levels and the question-writing method (the "same questions" part)
Suggested mapping: **Level 1–5 = JLPT N5 → N1** (5 levels × 17 chapters; the number of chapters is configurable but remember the hard-coded places in §2). Michael decides the real syllabus/textbook order — ask for it (grammar + topics per chapter), like the English table below.
English syllabus example (shows the level of detail needed): Ch1 "To be: am/is/are" · Ch2 "To be + location, pronouns; classroom/rooms/cities" · Ch3 "Present continuous; everyday activities" … Ch9 "Simple present; nationalities/languages" … Ch17 "To be: past; TV commercials/emotions/biographies".

**The question-writing skill used on the English site (adapt it to Japanese and save it as a new Claude skill for the Japanese site):**
- Adult beginners. Write nothing until I name a specific Level/Chapter. Workflow: confirm Level+Chapter → ask me for the CURRENT `homework-content.csv` (highest id comes from it) → draft in a side-panel page (artifact) for my review (question, choices, correct answer highlighted) → self-review pass first (report found/fixed in 3–5 lines, flag anything uncertain) → only after I approve, deliver ONLY the NEW rows (small CSV with the header) + a batch report (highest id used, rows added per chapter and mode). Claude Code appends them.
- Safety rules: never change/reuse/renumber ids; ids continue from the highest id in the file (homework and test share one sequence); never resend or edit existing rows; never change level/chapter/type/mode of an existing row; warn me before adding homework to a chapter students may have finished (it can re-open it); fixing a bad old question is a change — list the problem, let me decide; exact 12-column header; `answer` equals one choice; test rows (`mode=test`) are a separate pool.
- Size: tests exactly 10 per chapter (about 9 grammar + 1 listening that depends on the grammar; different names/sentences from homework). Homework about 30–50 per chapter, avoid 60+. Spiral review: ~70–80% current chapter, 20–30% earlier chapters (mostly the last 1–3), combined naturally inside one sentence; one new idea per question; never use grammar/vocabulary from LATER chapters.
- Quality checks: (1) one defensible answer — could a reasonable person argue a second choice? rewrite; watch near-synonyms and overlapping words (for Japanese: particle choices that are both fine — は/が, に/で in some contexts; politeness levels; words with several readings/uses); (2) no length giveaway; (3) distractors wrong but believable, ideally from the chapter's own vocabulary, no joke answers; (4) natural language only (natural Japanese — correct politeness consistency です/ます vs plain, natural particles, no textbook-only phrasing); (5) "What is he doing?" scenes need a clue that fits exactly one verb; (6) spread correct answers evenly across A/B/C; closed sets keep a standard order (for Japanese e.g. は/が/を/に/で… decide a standard order); (7) variety of frames, nouns, names — Japanese AND international names, yen and metric units; (8) listening/conversation now HAVE audio: "You hear …" asks what was said or meant, no inference; check whose perspective; (9) beginner level: short sentences, common words, one idea per question.
- If I give a chapter word list use only those words plus earlier chapters; otherwise infer from existing homework and flag any word that might be outside it.
**Pictures:** I generate pictures with an AI image tool on my Mac (600×600 JPG, one per photo question, clear single subject, consistent cartoon/photo style); names must match the `image` column exactly.

## 7. Release routine (every time)
Upload order: (1) mu-plugin PHP (`212-progress.php` first) → (2) code (`components/*.js/css`, `inc/*.php`, then pages like `homework.php` last) → (3) pictures/audio (zips via File Manager; files directly in the target folder) → (4) CSV files LAST → (5) hard refresh; iPhone: clear website data if it looks old. Public files can be checked against the server with `curl … | shasum -a 256`. The CSV fetches carry a version number (`?v=`) so browsers never serve an old list.
**Local testing:** normal = start the site in the Local app and log in as a test student. If the Local app is off: copy Local's MySQL data folder to a scratch folder, run Local's `mysqld` on another port/socket, run `php -S localhost:8090` on the site folder with an `auto_prepend_file` that defines `DB_HOST`, `WP_HOME`, `WP_SITEURL`, create a throwaway student in the COPY, test, then stop both servers. `php -l` every PHP file you change. Call `h212_progress_state($user_id,false)` from a CLI script to check unlocks.

## 8. Mistakes already made (don't repeat)
- After editing `showQuestion()` in `homework.php`, DIFF it against the previous version — once the top bar and card opener were deleted by accident while adding photos.
- Duplicate function names between an old uploaded mu-plugin and a new one crash the whole WordPress site (keep new helpers uniquely named; upload order matters).
- The Tests page needs its nonce `window.H212_NONCE` or test scores silently fail to save.
- The server sent no cache headers for CSVs, so browsers showed an old list for hours — keep the `?v=` version on CSV fetches.
- File names are case-sensitive on the live server (a Mac is not).
- A zip extracted into the wrong folder level silently broke the voices (files must sit directly in their folder).
- Changing the number of chapters/levels needs a sweep of all the places that hard-code 17/5 (grep the number, also `< 17`).
- Replacing a chapter's questions with new ids makes everyone redo it; adding questions to a finished chapter drops it from "Mastered" (it never re-locks anything once opened).
- The wp-admin Homework Questions screen rewrites the CSV (sorted) on every save and must keep the `mode` column.
- Known limits: the CSVs (with all answers) are publicly downloadable and grading/locks run in the browser — fine for practice, not for official exams.

## 9. QUESTIONS TO ASK ME FIRST (with my recommendation in brackets)
1. Site name, logo text, domain, report email, YouTube channel. 
2. Who are the learners and what language is the interface in? [English learners of Japanese; UI English with bilingual labels kept; EN/JA toggle kept]
3. Levels = JLPT N5–N1? Chapters per level? Syllabus/textbook order for Level 1? [5 levels, 17 chapters, N5 first]
4. Kanji/furigana/romaji policy (§5G). [N5: kana + few kanji; readings via a separate toggle]
5. Voices: which Japanese TTS, how many voices, test samples first (§5D). [2 voices, sample then pick]
6. Mascot: new teacher character + name; colours/default theme. [keep Sakura default; new mascot]
7. Do I need the Videos feature at the start (needs my YouTube videos + 6 rows each)? [build the page, fill later]
8. Hosting: new Hostinger site + Local site; who creates the GitHub repo (I type any login myself).

## 10. First session plan
1. Read this + the English repo's `212-handoff-prompt.md`. Tell me in 5 lines what you understand and list anything unclear. Ask the §9 questions.
2. Set up the project folder, copy `portal/` + the 5 mu-plugins, empty the English content, get the portal running on a new Local site with a test student.
3. Re-brand (§5A), then do §5B–H one at a time, testing each, reporting the exact files + folders + a commit after each.
4. Only then start content (Level 1, Chapter 1) with me using the question-writing method in §6.

=====

*Starter message to paste right after the prompt above:*

> Let's build the Japanese-learning version. Site name: ___. Learners: ___. Start with section 10, step 1: tell me what you understand, then ask me the section 9 questions one or two at a time.
