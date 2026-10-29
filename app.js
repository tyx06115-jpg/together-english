const DAILY_GOAL = 50;
const dateKey = new Date().toLocaleDateString('en-CA');
const $ = (id) => document.getElementById(id);
const meaningToggle = $('meaning-toggle');
let words = [];
let dailyWords = [];
let current = 0;
let stats = { studied: 0, known: 0, review: 0, ratings: {} };
let race = { active: false, scores: [0, 0], player: 0, question: 0, timer: null, locked: false, names: ['我', '妹妹'], roundWords: [] };

function loadStats() {
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(`yqxy-${dateKey}`) || '{}') }; } catch { /* Ignore invalid local data. */ }
}
function saveStats() { localStorage.setItem(`yqxy-${dateKey}`, JSON.stringify(stats)); }
function setProgress() {
  $('studied-count').textContent = stats.studied;
  $('known-count').textContent = stats.known;
  $('review-count').textContent = stats.review;
  $('progress-count').textContent = stats.studied;
  $('progress-fill').style.width = `${Math.min(stats.studied / DAILY_GOAL * 100, 100)}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(Math.min(stats.studied, DAILY_GOAL)));
}
function renderWord() {
  const item = dailyWords[current];
  $('word-title').textContent = item.word;
  $('word-type').textContent = item.type;
  $('word-pronunciation').textContent = item.pronunciation || '四级词汇';
  $('meaning').textContent = item.meaning;
  $('word-example').textContent = item.example || '试着用这个单词造一个句子。';
  $('word-position').textContent = `${String(current + 1).padStart(2, '0')} / ${DAILY_GOAL}`;
  $('meaning').hidden = true;
  meaningToggle.setAttribute('aria-expanded', 'false');
  meaningToggle.innerHTML = '显示中文释义 <span aria-hidden="true">＋</span>';
  document.querySelectorAll('.rating').forEach((button) => button.classList.toggle('selected', stats.ratings[item.word] === button.dataset.rating));
  $('status-message').textContent = '';
}
function makeDailyList() {
  const start = Math.floor(Date.now() / 86400000) * DAILY_GOAL % words.length;
  dailyWords = Array.from({ length: DAILY_GOAL }, (_, i) => words[(start + i) % words.length]);
}
meaningToggle.addEventListener('click', () => {
  const visible = $('meaning').hidden;
  $('meaning').hidden = !visible;
  meaningToggle.setAttribute('aria-expanded', String(visible));
  meaningToggle.innerHTML = visible ? '隐藏中文释义 <span aria-hidden="true">−</span>' : '显示中文释义 <span aria-hidden="true">＋</span>';
});
document.querySelectorAll('.rating').forEach((button) => button.addEventListener('click', () => {
  const item = dailyWords[current];
  const previous = stats.ratings[item.word];
  if (previous === button.dataset.rating) return;
  if (!previous) stats.studied += 1;
  if (previous === 'known') stats.known -= 1; else if (previous) stats.review -= 1;
  if (button.dataset.rating === 'known') stats.known += 1; else stats.review += 1;
  stats.ratings[item.word] = button.dataset.rating;
  saveStats(); setProgress(); renderWord();
  $('status-message').textContent = '已记录，继续保持！';
}));
$('next-button').addEventListener('click', () => { current = (current + 1) % DAILY_GOAL; renderWord(); });
function showRaceQuestion() {
  race.locked = false;
  const item = race.roundWords[race.question % race.roundWords.length];
  $('race-word').textContent = item.word;
  $('turn-indicator').textContent = `轮到 ${race.names[race.player]}`;
  const options = [item.meaning];
  while (options.length < 4) {
    const candidate = words[Math.floor(Math.random() * words.length)].meaning;
    if (!options.includes(candidate)) options.push(candidate);
  }
  options.sort(() => Math.random() - 0.5);
  $('answer-options').replaceChildren(...options.map((meaning) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'answer-option'; button.textContent = meaning;
    button.addEventListener('click', () => finishRaceQuestion(meaning === item.meaning, button, item.meaning)); return button;
  }));
  clearInterval(race.timer); let seconds = 15; $('timer-fill').style.width = '100%';
  race.timer = setInterval(() => { seconds -= 1; $('timer-fill').style.width = `${seconds / 15 * 100}%`; if (seconds <= 0) finishRaceQuestion(false, null, item.meaning, true); }, 1000);
}
function finishRaceQuestion(correct, selected, answer, timeout = false) {
  if (race.locked || !race.active) return;
  race.locked = true; clearInterval(race.timer);
  document.querySelectorAll('.answer-option').forEach((button) => { button.disabled = true; if (button.textContent === answer) button.classList.add('answer-correct'); });
  let message;
  if (correct) { race.scores[race.player] += 1; message = `答对了！${race.names[race.player]} 得 1 分`; }
  else { if (selected) selected.classList.add('answer-wrong'); message = timeout ? `时间到，答案：${answer}` : `答错了，答案：${answer}`; race.player = 1 - race.player; }
  $('score-one').textContent = race.scores[0]; $('score-two').textContent = race.scores[1]; $('race-feedback').textContent = message;
  if (race.scores[race.player] >= 10 || race.scores[1 - race.player] >= 10) {
    race.active = false; const winner = race.scores[0] >= 10 ? race.names[0] : race.names[1]; $('race-feedback').textContent = `${winner} 获胜！${message}`; $('race-reset').hidden = false; return;
  }
  race.question += 1; setTimeout(() => { if (race.active) showRaceQuestion(); }, 1100);
}
$('race-start').addEventListener('click', () => {
  race.names = [$('player-one').value.trim() || '玩家 1', $('player-two').value.trim() || '玩家 2'];
  race.scores = [0, 0]; race.player = 0; race.question = 0;
  race.roundWords = [...words].sort(() => Math.random() - 0.5);
  $('name-one').textContent = race.names[0]; $('name-two').textContent = race.names[1]; $('score-one').textContent = '0'; $('score-two').textContent = '0';
  $('race-setup').hidden = true; $('race-game').hidden = false; $('race-reset').hidden = true; race.active = true; showRaceQuestion();
});
$('race-reset').addEventListener('click', () => { clearInterval(race.timer); race.active = false; $('race-game').hidden = true; $('race-setup').hidden = false; $('race-reset').hidden = true; });
Promise.resolve(window.CET4_WORDS).then((data) => {
  if (!Array.isArray(data) || data.length < DAILY_GOAL) throw new Error('词库加载失败');
  words = data;
  $('total-count').textContent = DAILY_GOAL;
  document.querySelector('.progress-track').setAttribute('aria-valuemax', String(DAILY_GOAL));
  loadStats(); makeDailyList(); setProgress(); renderWord();
}).catch(() => { $('word-title').textContent = '词库无法加载'; $('status-message').textContent = '请通过本地网页服务器打开，不能直接双击 index.html。'; });
