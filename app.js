const DAILY_GOAL = 50;
const dateKey = new Date().toLocaleDateString('en-CA');
const $ = (id) => document.getElementById(id);
let words = [];
let dailyWords = [];
let current = 0;
let stats = { studied: 0, known: 0, review: 0, ratings: {} };
function loadStats() {
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(`yqxy-cet6-${dateKey}`) || '{}') }; } catch { /* Ignore invalid local data. */ }
}
function saveStats() { localStorage.setItem(`yqxy-cet6-${dateKey}`, JSON.stringify(stats)); }
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
  $('word-pronunciation').textContent = '六级词汇';
  $('meaning').textContent = item.meaning;
  $('word-example').textContent = '试着用这个单词造一个句子。';
  $('word-position').textContent = `${String(current + 1).padStart(2, '0')} / ${DAILY_GOAL}`;
  $('meaning').hidden = true;
  $('meaning-toggle').setAttribute('aria-expanded', 'false');
  $('meaning-toggle').innerHTML = '显示中文释义 <span aria-hidden="true">＋</span>';
  document.querySelectorAll('.rating').forEach((button) => button.classList.toggle('selected', stats.ratings[item.word] === button.dataset.rating));
  $('status-message').textContent = '';
}
function makeDailyList() {
  const start = Math.floor(Date.now() / 86400000) * DAILY_GOAL % words.length;
  dailyWords = Array.from({ length: DAILY_GOAL }, (_, i) => words[(start + i) % words.length]);
}
$('meaning-toggle').addEventListener('click', () => {
  const visible = $('meaning').hidden;
  $('meaning').hidden = !visible;
  $('meaning-toggle').setAttribute('aria-expanded', String(visible));
  $('meaning-toggle').innerHTML = visible ? '隐藏中文释义 <span aria-hidden="true">−</span>' : '显示中文释义 <span aria-hidden="true">＋</span>';
});
document.querySelectorAll('.rating').forEach((button) => button.addEventListener('click', () => {
  const item = dailyWords[current];
  const previous = stats.ratings[item.word];
  if (previous === button.dataset.rating) return;
  if (!previous) stats.studied += 1;
  if (previous === 'known') stats.known -= 1; else if (previous) stats.review -= 1;
  if (button.dataset.rating === 'known') stats.known += 1; else stats.review += 1;
  stats.ratings[item.word] = button.dataset.rating;
  saveStats(); setProgress(); renderWord(); $('status-message').textContent = '已记录，继续保持！';
}));
$('next-button').addEventListener('click', () => { current = (current + 1) % DAILY_GOAL; renderWord(); });
words = window.CET6_WORDS || [];
if (words.length < DAILY_GOAL) { $('word-title').textContent = '六级词库无法加载'; $('status-message').textContent = '请刷新页面后重试。'; }
else { $('total-count').textContent = DAILY_GOAL; document.querySelector('.progress-track').setAttribute('aria-valuemax', String(DAILY_GOAL)); loadStats(); makeDailyList(); setProgress(); renderWord(); }
