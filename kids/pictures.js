/* 212 Kids - the pictures (simple flat cartoons, same look as the menu), shared by the games (game.js)
 * and the printable worksheets (print.js). Each picture: [viewBox, drawing].
 * Fruits; pizza toppings cheese, mushrooms, tomato, corn, onion, pineapple, broccoli; pizza; music; paint_<color>.
 * Content: peach cherry pear carrot potato pumpkin cucumber eggplant cabbage; Christmas: tree present santa reindeer
 * snowman star bell stocking candy_cane snow; toys: teddy_bear doll robot ball puzzle book blocks drum guitar crayons
 * (ball, book, drum, robot and present also come in colors: ball_red, present_blue ...); num_1 to num_10; letter_a to letter_z;
 * phonics key words hat turtle igloo jug kettle pig cat dog.
 */
(function () {
  'use strict';
  var INK = '#2B2350';
  window.H212_KIDS_PICTURES = {
    apple: ['0 0 100 100', '<path d="M50 26 C30 10 4 26 10 54 C15 80 34 94 50 86 C66 94 85 80 90 54 C96 26 70 10 50 26Z" fill="#FF5A4F" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M56 16 C66 6 80 8 82 14 C74 22 62 22 56 16Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'],
    banana: ['0 -20 130 130', '<path d="M8 20 C20 62 62 80 112 44 C118 40 114 32 106 36 C64 58 34 44 22 12 C18 4 6 10 8 20Z" fill="#FFD84D" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>'],
    orange: ['0 0 100 100', '<circle cx="50" cy="56" r="38" fill="#FF9F2E" stroke="' + INK + '" stroke-width="6"/><path d="M50 18 C56 8 70 8 74 13 C67 21 56 21 50 18Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><circle cx="38" cy="48" r="3" fill="#D9780E"/><circle cx="62" cy="60" r="3" fill="#D9780E"/><circle cx="46" cy="72" r="3" fill="#D9780E"/>'],
    grapes: ['0 0 100 100', '<path d="M50 26 V10" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M52 16 C60 6 74 8 76 14 C68 22 58 22 52 16Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><g fill="#9B6BD6" stroke="' + INK + '" stroke-width="4"><circle cx="38" cy="34" r="12"/><circle cx="62" cy="34" r="12"/><circle cx="27" cy="54" r="12"/><circle cx="50" cy="54" r="12"/><circle cx="73" cy="54" r="12"/><circle cx="38" cy="73" r="12"/><circle cx="62" cy="73" r="12"/><circle cx="50" cy="90" r="9"/></g>'],
    strawberry: ['0 0 100 100', '<path d="M50 94 C24 82 10 56 17 39 C23 27 39 29 50 33 C61 29 77 27 83 39 C90 56 76 82 50 94Z" fill="#FF4D5E" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><g fill="#FFE27A"><ellipse cx="36" cy="50" rx="2.5" ry="4"/><ellipse cx="52" cy="48" rx="2.5" ry="4"/><ellipse cx="66" cy="52" rx="2.5" ry="4"/><ellipse cx="42" cy="66" rx="2.5" ry="4"/><ellipse cx="58" cy="66" rx="2.5" ry="4"/><ellipse cx="50" cy="80" rx="2.5" ry="4"/></g><path d="M30 31 L41 21 L50 28 L59 21 L70 31 L57 36 L50 31 L43 36Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>'],
    watermelon: ['0 10 100 80', '<path d="M5 34 A45 45 0 0 0 95 34 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M15 34 A35 35 0 0 0 85 34 Z" fill="#FF5A6E"/><path d="M5 34 H95" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><g fill="' + INK + '"><ellipse cx="34" cy="46" rx="3" ry="4.5"/><ellipse cx="50" cy="54" rx="3" ry="4.5"/><ellipse cx="66" cy="46" rx="3" ry="4.5"/><ellipse cx="42" cy="62" rx="3" ry="4.5"/><ellipse cx="58" cy="62" rx="3" ry="4.5"/></g>'],
    // Pizza toppings (Pizza Shop) and the pizza sticker.
    cheese: ['0 0 100 100', '<path d="M10 74 L90 30 L90 74 Z" fill="#FFD84D" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M10 74 L90 30" stroke="#FFF1A8" stroke-width="5" stroke-linecap="round" opacity=".8"/><g fill="#E8B92E"><circle cx="70" cy="58" r="7"/><circle cx="82" cy="44" r="4"/><circle cx="48" cy="66" r="4.5"/></g>'],
    mushrooms: ['0 0 100 100', '<rect x="38" y="50" width="24" height="36" rx="10" fill="#FFF1D6" stroke="' + INK + '" stroke-width="6"/><path d="M12 56 Q14 14 50 12 Q86 14 88 56 Z" fill="#C98A4B" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><g fill="#FFF1D6"><circle cx="34" cy="38" r="6"/><circle cx="58" cy="28" r="5"/><circle cx="68" cy="44" r="4.5"/></g>'],
    tomato: ['0 0 100 100', '<circle cx="50" cy="56" r="36" fill="#FF4D4D" stroke="' + INK + '" stroke-width="6"/><path d="M50 22 L58 12 M34 26 L50 26 L66 26 M40 18 L50 26 L60 18" stroke="#3FA864" stroke-width="6" stroke-linecap="round"/><ellipse cx="36" cy="44" rx="7" ry="4" fill="#FF8A8A" transform="rotate(-30 36 44)"/>'],
    corn: ['0 0 100 100', '<ellipse cx="50" cy="48" rx="18" ry="36" fill="#FFD84D" stroke="' + INK + '" stroke-width="6"/><g stroke="#E8B92E" stroke-width="3"><path d="M36 30 H64 M33 42 H67 M33 54 H67 M36 66 H64"/><path d="M44 16 V80 M56 16 V80"/></g><path d="M50 90 Q24 80 22 46 Q36 62 44 78 Z M50 90 Q76 80 78 46 Q64 62 56 78 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'],
    onion: ['0 0 100 100', '<path d="M50 12 Q54 30 72 44 Q90 62 72 82 Q50 96 28 82 Q10 62 28 44 Q46 30 50 12 Z" fill="#C9A0DC" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M50 26 Q40 50 44 86 M50 26 Q62 50 58 86" stroke="#9B6BD6" stroke-width="4" fill="none"/><path d="M42 92 L40 98 M50 93 V99 M58 92 L60 98" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>'],
    pineapple: ['0 0 100 100', '<path d="M50 30 L38 6 L48 18 L50 2 L52 18 L62 6 Z" fill="#3FA864" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="50" cy="62" rx="26" ry="32" fill="#FFC233" stroke="' + INK + '" stroke-width="6"/><g stroke="#C98A1E" stroke-width="3"><path d="M30 46 L66 86 M34 36 L74 80 M30 66 L50 90"/><path d="M70 46 L34 86 M66 36 L26 80 M70 66 L50 90"/></g>'],
    music: ['0 0 70 70', '<path d="M28 50 V14 L56 8 V42" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M28 24 L56 18" stroke="' + INK + '" stroke-width="6"/><ellipse cx="21" cy="50" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><ellipse cx="49" cy="43" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/>'],
    broccoli: ['0 0 100 100', '<path d="M42 58 L40 90 H60 L58 58 Z" fill="#8ED6A0" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><g fill="#3FA864" stroke="' + INK + '" stroke-width="5"><circle cx="32" cy="48" r="16"/><circle cx="68" cy="48" r="16"/><circle cx="50" cy="34" r="20"/><circle cx="50" cy="56" r="14"/></g>'],
    pizza: ['0 0 100 100', '<circle cx="50" cy="50" r="44" fill="#E8B465" stroke="' + INK + '" stroke-width="6"/><circle cx="50" cy="50" r="35" fill="#E8453C"/><path d="M22 46 Q30 24 52 20 Q76 24 80 48 Q78 74 54 80 Q28 78 22 46 Z" fill="#FFD84D"/><g fill="#B8322C" stroke="' + INK + '" stroke-width="3"><circle cx="38" cy="40" r="7"/><circle cx="62" cy="38" r="7"/><circle cx="56" cy="62" r="7"/><circle cx="36" cy="62" r="6"/></g>']
  };

  // Paint splashes for the color words (paint_red, paint_yellow ...), in the same colors as games.json "colors".
  var PAINT = { red: '#FF4D4D', yellow: '#FFD84D', orange: '#FF9F2E', purple: '#9B6BD6', green: '#5CC98B', blue: '#4DA3FF' };
  Object.keys(PAINT).forEach(function (c) {
    window.H212_KIDS_PICTURES['paint_' + c] = ['0 0 100 100',
      '<path d="M50 10 C64 10 68 24 80 24 C94 24 94 42 86 50 C80 58 94 70 84 82 C74 92 62 82 52 90 C42 98 26 92 24 80 C22 70 8 66 10 52 C12 40 24 38 26 28 C28 16 38 10 50 10 Z" fill="' + PAINT[c] + '" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<circle cx="88" cy="12" r="6" fill="' + PAINT[c] + '" stroke="' + INK + '" stroke-width="4"/>' +
      '<ellipse cx="38" cy="38" rx="9" ry="5.5" fill="#FFFFFF" opacity=".5" transform="rotate(-35 38 38)"/>'];
  });

  // ---------- Content (Nov vegetables + fruits, Dec Christmas + toys, numbers, phonics key words) ----------
  var PIC = window.H212_KIDS_PICTURES;
  function k(w) { return ' stroke="' + INK + '" stroke-width="' + (w || 6) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function eyes(y, x1, x2, r) { return '<circle cx="' + x1 + '" cy="' + y + '" r="' + (r || 4) + '" fill="' + INK + '"/><circle cx="' + x2 + '" cy="' + y + '" r="' + (r || 4) + '" fill="' + INK + '"/>'; }
  function leaf(x, y) { return '<path d="M' + x + ' ' + y + ' C' + (x + 8) + ' ' + (y - 12) + ' ' + (x + 24) + ' ' + (y - 10) + ' ' + (x + 26) + ' ' + (y - 4) + ' C' + (x + 18) + ' ' + (y + 4) + ' ' + (x + 6) + ' ' + (y + 4) + ' ' + x + ' ' + y + 'Z" fill="#5CC98B"' + k(4) + '/>'; }

  // Fruits and vegetables
  PIC.peach = ['0 0 100 100', '<circle cx="50" cy="56" r="36" fill="#FFB08A"' + k() + '/><path d="M50 24 Q40 52 50 90" stroke="#F0806A" stroke-width="4" fill="none"/>' + leaf(52, 20)];
  PIC.cherry = ['0 0 100 100', '<path d="M32 62 Q40 32 62 12 M70 64 Q64 36 62 12" stroke="#3FA864" stroke-width="5" fill="none" stroke-linecap="round"/>' + leaf(62, 14) +
    '<circle cx="30" cy="70" r="18" fill="#E5233A"' + k() + '/><circle cx="70" cy="72" r="18" fill="#E5233A"' + k() + '/><circle cx="24" cy="64" r="4" fill="#FFFFFF" opacity=".6"/><circle cx="64" cy="66" r="4" fill="#FFFFFF" opacity=".6"/>'];
  PIC.pear = ['0 0 100 100', '<path d="M50 6 Q52 12 52 18" stroke="#8A5A2B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 16 Q62 16 62 34 Q62 44 74 56 Q88 76 72 88 Q50 98 28 88 Q12 76 26 56 Q38 44 38 34 Q38 16 50 16Z" fill="#C6DE5A"' + k() + '/>' + leaf(54, 14)];
  PIC.carrot = ['0 0 100 100', '<path d="M24 30 L10 8 M30 26 L28 4 M34 28 L48 8" stroke="#3FA864" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M18 36 Q30 20 46 28 L88 88 Q90 92 84 90 L24 54 Q10 46 18 36Z" fill="#FF8A2E"' + k() + '/><path d="M40 42 L48 40 M52 56 L60 54 M64 70 L70 68" stroke="#D9620E" stroke-width="4" stroke-linecap="round"/>'];
  PIC.potato = ['0 0 100 100', '<path d="M14 54 Q12 26 42 22 Q76 18 86 44 Q94 72 64 80 Q26 90 14 54Z" fill="#D9A866"' + k() + '/>' +
    '<circle cx="36" cy="44" r="3.5" fill="#A8763E"/><circle cx="60" cy="38" r="3.5" fill="#A8763E"/><circle cx="68" cy="62" r="3.5" fill="#A8763E"/><circle cx="42" cy="66" r="3.5" fill="#A8763E"/>'];
  PIC.pumpkin = ['0 0 100 100', '<path d="M48 30 Q46 14 58 8" stroke="#3FA864" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="32" cy="60" rx="22" ry="30" fill="#FF8A2E"' + k() + '/><ellipse cx="68" cy="60" rx="22" ry="30" fill="#FF8A2E"' + k() + '/><ellipse cx="50" cy="60" rx="18" ry="32" fill="#FF9F2E"' + k() + '/>'];
  PIC.cucumber = ['0 0 100 100', '<g transform="rotate(-25 50 50)"><rect x="8" y="36" width="84" height="28" rx="14" fill="#4FB06A"' + k() + '/>' +
    '<circle cx="28" cy="46" r="2.5" fill="#BDEBC8"/><circle cx="44" cy="54" r="2.5" fill="#BDEBC8"/><circle cx="60" cy="45" r="2.5" fill="#BDEBC8"/><circle cx="74" cy="54" r="2.5" fill="#BDEBC8"/></g>'];
  PIC.eggplant = ['0 0 100 100', '<path d="M42 30 Q68 24 78 52 Q88 86 58 92 Q28 94 30 64 Q32 46 42 30Z" fill="#7B4FB0"' + k() + '/>' +
    '<path d="M30 34 Q42 16 62 28 L54 36 Q44 30 30 34Z" fill="#3FA864"' + k(4) + '/><path d="M48 24 Q50 12 58 8" stroke="#3FA864" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="48" cy="60" rx="5" ry="12" fill="#FFFFFF" opacity=".3"/>'];
  PIC.cabbage = ['0 0 100 100', '<circle cx="50" cy="54" r="38" fill="#A8DC8A"' + k() + '/><path d="M50 18 Q38 52 50 90 M50 44 Q30 48 20 64 M50 44 Q70 48 80 64 M50 64 Q36 70 30 82 M50 64 Q64 70 70 82" stroke="#5CA84A" stroke-width="4" fill="none" stroke-linecap="round"/>'];

  // Christmas things
  PIC.tree = ['0 0 100 100', '<rect x="42" y="78" width="16" height="16" fill="#A0673A"' + k(5) + '/><path d="M50 10 L78 46 H64 L88 80 H12 L36 46 H22 Z" fill="#3FA864"' + k() + '/>' +
    '<circle cx="40" cy="56" r="5" fill="#FF4D4D"/><circle cx="60" cy="66" r="5" fill="#FFD84D"/><circle cx="54" cy="40" r="5" fill="#4DA3FF"/><circle cx="34" cy="72" r="5" fill="#FFD84D"/><circle cx="70" cy="74" r="5" fill="#FF4D4D"/>' +
    '<polygon points="50,0 54,8 62,9 56,14 58,22 50,18 42,22 44,14 38,9 46,8" fill="#FFC933"' + k(3) + '/>'];
  function present(c, r) {
    return '<rect x="16" y="42" width="68" height="48" rx="4" fill="' + c + '"' + k() + '/><rect x="10" y="30" width="80" height="16" rx="4" fill="' + c + '"' + k() + '/>' +
      '<path d="M50 32 V88" stroke="' + r + '" stroke-width="10"/><path d="M50 28 C38 8 20 14 32 28 Z M50 28 C62 8 80 14 68 28Z" fill="' + r + '"' + k(5) + '/>';
  }
  PIC.present = ['0 0 100 100', present('#FF4D4D', '#FFD84D')];
  PIC.santa = ['0 0 100 100', '<path d="M24 44 Q30 8 64 12 Q84 16 86 38 L74 40 Q70 24 60 22 Q50 30 76 44 Z" fill="#E5233A"' + k() + '/><circle cx="86" cy="40" r="7" fill="#FFFFFF"' + k(4) + '/>' +
    '<rect x="18" y="40" width="64" height="13" rx="6.5" fill="#FFFFFF"' + k(5) + '/><circle cx="50" cy="64" r="18" fill="#FFD9B8"' + k(5) + '/>' +
    '<path d="M26 62 Q28 96 50 96 Q72 96 74 62 Q68 80 50 80 Q32 80 26 62Z" fill="#FFFFFF"' + k(5) + '/>' + eyes(60, 43, 57, 3.5) + '<circle cx="50" cy="69" r="4" fill="#FF8A8A"/>'];
  PIC.reindeer = ['0 0 100 100', '<path d="M36 34 L24 8 M30 22 L14 18 M64 34 L76 8 M70 22 L86 18" stroke="#8A5A2B" stroke-width="7" stroke-linecap="round"/>' +
    '<ellipse cx="24" cy="44" rx="10" ry="6" fill="#B8814A"' + k(4) + ' transform="rotate(-25 24 44)"/><ellipse cx="76" cy="44" rx="10" ry="6" fill="#B8814A"' + k(4) + ' transform="rotate(25 76 44)"/>' +
    '<ellipse cx="50" cy="60" rx="24" ry="30" fill="#B8814A"' + k() + '/><ellipse cx="50" cy="76" rx="14" ry="10" fill="#E3C29B"/>' + eyes(52, 41, 59) + '<circle cx="50" cy="74" r="8" fill="#E5233A"' + k(4) + '/>'];
  PIC.snowman = ['0 0 100 100', '<circle cx="50" cy="72" r="24" fill="#FFFFFF"' + k() + '/><circle cx="50" cy="36" r="17" fill="#FFFFFF"' + k() + '/>' +
    '<rect x="37" y="4" width="26" height="16" rx="2" fill="' + INK + '"/><rect x="31" y="18" width="38" height="5" rx="2" fill="' + INK + '"/><rect x="37" y="15" width="26" height="4" fill="#FF4D4D"/>' +
    eyes(33, 44, 56, 3) + '<path d="M50 38 L64 41 L50 43Z" fill="#FF8A2E"/><circle cx="50" cy="64" r="3.5" fill="' + INK + '"/><circle cx="50" cy="76" r="3.5" fill="' + INK + '"/>' +
    '<path d="M36 50 Q50 58 64 50" stroke="#FF4D4D" stroke-width="7" fill="none" stroke-linecap="round"/>'];
  PIC.star = ['0 0 100 100', '<polygon points="50,6 62,36 94,38 69,58 78,90 50,72 22,90 31,58 6,38 38,36" fill="#FFC933"' + k() + '/>'];
  PIC.bell = ['0 0 100 100', '<path d="M50 16 Q24 20 24 52 L14 74 H86 L76 52 Q76 20 50 16Z" fill="#FFC933"' + k() + '/><circle cx="50" cy="82" r="8" fill="#FFC933"' + k(5) + '/>' +
    '<path d="M50 16 C38 2 26 8 36 16 Z M50 16 C62 2 74 8 64 16Z" fill="#E5233A"' + k(4) + '/><path d="M34 40 Q36 30 44 26" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>'];
  PIC.stocking = ['0 0 100 100', '<path d="M32 24 H64 V60 Q64 82 42 90 Q20 96 16 82 Q12 68 32 60 Z" fill="#E5233A"' + k() + '/><rect x="28" y="10" width="40" height="17" rx="4" fill="#FFFFFF"' + k(5) + '/>' +
    '<path d="M22 70 Q30 64 36 72" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>'];
  PIC.candy_cane = ['0 0 100 100', '<path d="M42 92 V38 Q42 14 60 14 Q78 14 78 32" stroke="' + INK + '" stroke-width="22" fill="none" stroke-linecap="round"/>' +
    '<path d="M42 92 V38 Q42 14 60 14 Q78 14 78 32" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    '<path d="M42 92 V38 Q42 14 60 14 Q78 14 78 32" stroke="#E5233A" stroke-width="12" fill="none" stroke-dasharray="7 9"/>'];
  PIC.snow = ['0 0 100 100', '<g stroke="#4DA3FF" stroke-width="7" stroke-linecap="round" fill="none"><path d="M50 8 V92 M14 29 L86 71 M14 71 L86 29"/>' +
    '<path d="M40 14 L50 24 L60 14 M40 86 L50 76 L60 86 M18 44 L28 36 L22 22 M82 56 L72 64 L78 78 M18 56 L28 64 L22 78 M82 44 L72 36 L78 22"/></g>'];

  // Toys. Some come in colors for the Elf Workshop: ball_red, book_blue, drum_green, robot_yellow ...
  var TOY = {
    ball: function (c, r) { return '<circle cx="50" cy="50" r="40" fill="' + c + '"' + k() + '/><path d="M12 42 Q50 62 88 42 M42 11 Q28 50 44 89" stroke="' + r + '" stroke-width="7" fill="none"/>'; },
    book: function (c, r) { return '<path d="M50 24 Q32 14 10 18 V80 Q32 76 50 86 Q68 76 90 80 V18 Q68 14 50 24Z" fill="' + c + '"' + k() + '/><path d="M50 24 V86" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M20 34 Q30 32 40 36 M20 48 Q30 46 40 50 M60 36 Q70 32 80 34 M60 50 Q70 46 80 48" stroke="' + r + '" stroke-width="4" fill="none" stroke-linecap="round"/>'; },
    drum: function (c, r) { return '<path d="M16 36 V70 Q50 90 84 70 V36" fill="' + c + '"' + k() + '/><path d="M16 46 L30 74 L44 50 L58 78 L72 52 L84 66" stroke="' + r + '" stroke-width="5" fill="none"/>' +
      '<ellipse cx="50" cy="36" rx="34" ry="12" fill="#F6F1E4"' + k() + '/><path d="M28 6 L46 30 M74 6 L56 30" stroke="#A0673A" stroke-width="6" stroke-linecap="round"/>'; },
    robot: function (c, r) { return '<path d="M50 14 V6" stroke="' + INK + '" stroke-width="5"/><circle cx="50" cy="6" r="5" fill="#FF4D4D"' + k(3) + '/>' +
      '<rect x="28" y="14" width="44" height="32" rx="8" fill="#C9D3E0"' + k() + '/><circle cx="41" cy="30" r="6" fill="#FFFFFF"' + k(3) + '/><circle cx="59" cy="30" r="6" fill="#FFFFFF"' + k(3) + '/>' +
      '<circle cx="41" cy="30" r="2.5" fill="' + INK + '"/><circle cx="59" cy="30" r="2.5" fill="' + INK + '"/><path d="M14 56 L24 70 M86 56 L76 70" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="24" y="50" width="52" height="36" rx="8" fill="' + c + '"' + k() + '/><circle cx="50" cy="66" r="7" fill="' + r + '"' + k(3) + '/><path d="M36 86 V96 M64 86 V96" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>'; }
  };
  var TOY_COLORS = { red: '#FF4D4D', yellow: '#FFD84D', blue: '#4DA3FF', green: '#5CC98B', purple: '#9B6BD6', orange: '#FF9F2E', pink: '#FF7DA8', brown: '#A0673A', white: '#FFFFFF', black: '#3B3B48' };
  Object.keys(TOY).forEach(function (t) {
    Object.keys(TOY_COLORS).forEach(function (c) {
      var r = c === 'white' || c === 'yellow' ? '#FF4D4D' : '#FFFFFF';
      PIC[t + '_' + c] = ['0 0 100 100', TOY[t](TOY_COLORS[c], r)];
    });
  });
  Object.keys(TOY_COLORS).forEach(function (c) {
    PIC['present_' + c] = ['0 0 100 100', present(TOY_COLORS[c], c === 'yellow' || c === 'white' ? '#FF4D4D' : '#FFD84D')];
  });
  PIC.ball = PIC.ball_red;
  PIC.book = PIC.book_blue;
  PIC.drum = PIC.drum_red;
  PIC.robot = PIC.robot_blue;
  PIC.teddy_bear = ['0 0 100 100', '<circle cx="28" cy="20" r="11" fill="#B8814A"' + k(5) + '/><circle cx="72" cy="20" r="11" fill="#B8814A"' + k(5) + '/>' +
    '<ellipse cx="50" cy="74" rx="26" ry="22" fill="#B8814A"' + k() + '/><ellipse cx="50" cy="76" rx="13" ry="11" fill="#E3C29B"/>' +
    '<circle cx="50" cy="38" r="24" fill="#B8814A"' + k() + '/><ellipse cx="50" cy="46" rx="11" ry="8" fill="#E3C29B"/>' + eyes(34, 41, 59) + '<circle cx="50" cy="43" r="4" fill="' + INK + '"/>' +
    '<path d="M38 60 L50 66 L62 60 L62 70 L50 64 L38 70Z" fill="#FF4D4D"/>'];
  PIC.doll = ['0 0 100 100', '<path d="M24 40 Q22 8 50 8 Q78 8 76 40 L78 62 H22Z" fill="#FFB46B"' + k() + '/>' +
    '<path d="M50 52 L22 94 H78 Z" fill="#FF7DA8"' + k() + '/><circle cx="50" cy="34" r="18" fill="#FFD9B8"' + k(5) + '/>' +
    '<path d="M32 26 Q50 14 68 26 Q60 18 50 18 Q40 18 32 26Z" fill="#FFB46B"/>' + eyes(34, 43, 57, 3) + '<path d="M44 42 Q50 46 56 42" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<circle cx="38" cy="40" r="3" fill="#FF9E94"/><circle cx="62" cy="40" r="3" fill="#FF9E94"/>'];
  PIC.puzzle = ['0 0 100 100', '<path d="M14 26 H38 Q32 10 50 10 Q68 10 62 26 H86 V48 Q100 42 100 58 Q100 74 86 68 V90 H62 Q68 74 50 74 Q32 74 38 90 H14 V68 Q0 74 0 58 Q0 42 14 48 Z" fill="#4DA3FF"' + k() + ' transform="translate(5 0) scale(.9)"/>'];
  PIC.blocks = ['0 0 100 100', '<rect x="10" y="54" width="38" height="38" rx="4" fill="#FF4D4D"' + k() + '/><rect x="52" y="54" width="38" height="38" rx="4" fill="#4DA3FF"' + k() + '/>' +
    '<rect x="31" y="14" width="38" height="38" rx="4" fill="#FFD84D"' + k() + '/><circle cx="29" cy="73" r="7" fill="#FFFFFF" opacity=".7"/><path d="M62 66 H80 M62 80 H80" stroke="#FFFFFF" stroke-width="5" opacity=".7" stroke-linecap="round"/>' +
    '<polygon points="50,24 58,40 42,40" fill="#FFFFFF" opacity=".7"/>'];
  PIC.guitar = ['0 0 100 100', '<rect x="45" y="4" width="10" height="46" rx="3" fill="#7A4A26"' + k(4) + '/><rect x="42" y="2" width="16" height="10" rx="3" fill="#7A4A26"' + k(4) + '/>' +
    '<path d="M50 42 Q30 38 30 58 Q30 66 36 70 Q22 80 32 90 Q40 98 50 96 Q60 98 68 90 Q78 80 64 70 Q70 66 70 58 Q70 38 50 42Z" fill="#FF9F2E"' + k() + '/>' +
    '<circle cx="50" cy="66" r="7" fill="' + INK + '"/><rect x="40" y="82" width="20" height="5" rx="2" fill="' + INK + '"/>'];
  function crayon(x, c) { return '<path d="M' + x + ' 92 V34 L' + (x + 9) + ' 12 L' + (x + 18) + ' 34 V92Z" fill="' + c + '"' + k(5) + '/><path d="M' + x + ' 44 H' + (x + 18) + ' M' + x + ' 80 H' + (x + 18) + '" stroke="' + INK + '" stroke-width="3"/>'; }
  PIC.crayons = ['0 0 100 100', crayon(14, '#FF4D4D') + crayon(41, '#FFD84D') + crayon(68, '#4DA3FF')];

  // More paint splashes (Dec colors): brown, black, white.
  var MORE_PAINT = { brown: '#A0673A', black: '#3B3B48', white: '#FFFFFF' };
  Object.keys(MORE_PAINT).forEach(function (c) {
    var base = PIC.paint_red;
    PIC['paint_' + c] = [base[0], base[1].split('#FF4D4D').join(MORE_PAINT[c])];
  });

  // Numbers 1-10: the number with that many dots under it.
  for (var n = 1; n <= 10; n++) {
    var dots = '';
    for (var d = 0; d < n; d++) {
      var row = n > 5 ? (d < 5 ? 0 : 1) : 0;
      var inRow = n > 5 ? (row ? n - 5 : 5) : n;
      var col = row ? d - 5 : d;
      dots += '<circle cx="' + (50 + (col - (inRow - 1) / 2) * 14) + '" cy="' + (n > 5 ? 72 + row * 12 : 80) + '" r="' + (n > 5 ? 4.5 : 5.5) + '" fill="#FF7DA8"' + k(2.5) + '/>';
    }
    PIC['num_' + n] = ['0 0 100 100', '<rect x="4" y="4" width="92" height="92" rx="20" fill="#FFFFFF"' + k(5) + '/>' +
      '<text x="50" y="' + (n > 5 ? 56 : 62) + '" text-anchor="middle" font-family="\'Baloo 2\', \'Arial Rounded MT Bold\', sans-serif" font-weight="800" font-size="' + (n > 5 ? (n === 10 ? 42 : 48) : 56) + '" fill="' + INK + '">' + n + '</text>' + dots];
  }

  // Letters (phonics): a big lowercase letter on a round tile.
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (l) {
    PIC['letter_' + l] = ['0 0 100 100', '<circle cx="50" cy="50" r="44" fill="#FFFFFF"' + k(5) + '/>' +
      '<text x="50" y="68" text-anchor="middle" font-family="\'Baloo 2\', \'Arial Rounded MT Bold\', sans-serif" font-weight="800" font-size="62" fill="' + INK + '">' + l + '</text>'];
  });

  // Phonics key words (Mike's order): hat (h), turtle (t), igloo (i), jug (j), kettle (k), pig (p), cat (c), dog (d).
  PIC.hat = ['0 0 100 100', '<rect x="30" y="16" width="40" height="48" rx="5" fill="#4DA3FF"' + k() + '/><rect x="30" y="48" width="40" height="10" fill="#FF4D4D"/>' +
    '<rect x="10" y="62" width="80" height="13" rx="6.5" fill="#4DA3FF"' + k() + '/>'];
  PIC.turtle = ['0 0 100 100', '<circle cx="86" cy="58" r="10" fill="#8ED6A0"' + k(5) + '/><circle cx="88" cy="55" r="2.5" fill="' + INK + '"/>' +
    '<path d="M24 70 V84 M40 72 V86 M62 72 V86 M76 70 V84" stroke="#8ED6A0" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M12 72 Q14 30 50 28 Q86 30 84 72 Z" fill="#3FA864"' + k() + '/><path d="M36 40 L48 52 L36 66 M64 40 L52 52 L64 66 M48 52 H52" stroke="#A8DC8A" stroke-width="4" fill="none"/>'];
  PIC.igloo = ['0 0 100 100', '<path d="M8 84 Q8 24 50 22 Q92 24 92 84 Z" fill="#FFFFFF"' + k() + '/><path d="M14 64 H86 M20 46 H80 M34 28 V46 M60 26 V46 M28 46 V64 M50 46 V64 M72 46 V64" stroke="#9FD3FF" stroke-width="3.5"/>' +
    '<path d="M36 84 V70 Q36 58 50 58 Q64 58 64 70 V84Z" fill="#4DA3FF"' + k(5) + '/>'];
  PIC.jug = ['0 0 100 100', '<path d="M70 36 Q92 36 88 56 Q84 72 66 72" stroke="' + INK + '" stroke-width="16" fill="none"/><path d="M70 36 Q92 36 88 56 Q84 72 66 72" stroke="#4DA3FF" stroke-width="6" fill="none"/>' +
    '<path d="M30 16 H66 L72 28 Q74 60 70 88 H26 Q22 60 24 28 L20 18 Z" fill="#4DA3FF"' + k() + '/><path d="M28 40 H68" stroke="#FFFFFF" stroke-width="4" opacity=".7"/>'];
  PIC.kettle = ['0 0 100 100', '<path d="M30 28 Q50 6 70 28" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M22 58 L6 38 L12 34 L30 50" fill="#FF4D4D"' + k(5) + '/>' +
    '<path d="M18 88 Q14 30 50 28 Q86 30 82 88 Z" fill="#FF4D4D"' + k() + '/><circle cx="50" cy="28" r="6" fill="#FFD84D"' + k(4) + '/><path d="M32 52 Q34 42 42 38" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>'];
  PIC.pig = ['0 0 100 100', '<path d="M18 30 L22 8 L40 22Z M82 30 L78 8 L60 22Z" fill="#FF9EB8"' + k(5) + '/><circle cx="50" cy="54" r="38" fill="#FFB3C8"' + k() + '/>' +
    '<ellipse cx="50" cy="64" rx="17" ry="12" fill="#FF8AAA"' + k(5) + '/><ellipse cx="44" cy="64" rx="3.5" ry="5" fill="' + INK + '"/><ellipse cx="56" cy="64" rx="3.5" ry="5" fill="' + INK + '"/>' + eyes(42, 36, 64, 4.5)];
  PIC.cat = ['0 0 100 100', '<path d="M16 46 L18 8 L42 26Z M84 46 L82 8 L58 26Z" fill="#FFB46B"' + k(5) + '/><circle cx="50" cy="56" r="36" fill="#FFB46B"' + k() + '/>' + eyes(50, 37, 63, 5) +
    '<path d="M46 62 H54 L50 67Z" fill="#FF7DA8"/><path d="M50 67 Q44 74 38 70 M50 67 Q56 74 62 70 M10 58 H30 M12 68 L30 64 M90 58 H70 M88 68 L70 64" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>'];
  PIC.dog = ['0 0 100 100', '<ellipse cx="18" cy="48" rx="12" ry="24" fill="#8A5A2B"' + k(5) + '/><ellipse cx="82" cy="48" rx="12" ry="24" fill="#8A5A2B"' + k(5) + '/>' +
    '<circle cx="50" cy="52" r="34" fill="#D9A866"' + k() + '/>' + eyes(44, 38, 62, 5) + '<ellipse cx="50" cy="62" rx="9" ry="6" fill="' + INK + '"/><path d="M50 68 V74 Q42 80 36 74 M50 74 Q58 80 64 74" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'];
})();
