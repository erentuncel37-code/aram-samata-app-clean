import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw, Trophy, Swords, Sparkles, ShieldAlert, CheckCircle2, XCircle, Search } from 'lucide-react';
import { champions, augments, meta, settings } from './data/gameData.js';
import './styles.css';

const emptyTurn = { options: ['', '', ''], lockedChoice: '' };
const UI = {
  tr: {
    appName: 'Eklenti Taktik Programı',
    subtitle: 'Excel v2 karar motorunun mobil uygulama prototipi. Şampiyonunu, rakipleri ve gelen 3 kartı gir; sistem AL veya ÇEVİR kararını verir.',
    reset: 'Sıfırla',
    setup: 'Oyun Girişi',
    yourChampion: 'Şampiyonun',
    championPlaceholder: 'Şampiyon seç',
    enemies: '5 Rakip',
    enemy: 'Rakip',
    metaPriorities: 'Meta öncelikleri:',
    turn: 'Tur',
    augmentPick: 'Eklenti Seçimi',
    rerollLabel: 'Reroll eşiği',
    rerollHelp: 'Bu eşiğin altındaysa kart çevirmek daha mantıklı.',
    selected: 'Seçildi:',
    card: 'Kart',
    augmentPlaceholder: 'Eklenti yaz',
    score: 'Skor',
    take: 'AL:',
    reroll: 'Kartları çevir',
    bestScore: 'En iyi skor',
    threshold: 'eşik',
    enter3: '3 eklentiyi gir',
    resultHere: 'Sonuç burada görünecek.',
    championScore: 'Şampiyon',
    enemyScore: 'Rakip',
    synergy: 'Sinerji',
    metaTier: 'Meta/Tier',
    reason: 'Gerekçe:',
    weakReason: 'Bu üçlü mevcut şampiyon, rakip ve önceki seçimlere göre yeterince güçlü görünmüyor.',
    chooseCard: 'kartı seçtim, devam',
    cleared: 'Kartları çevirdim, alanı temizle',
    summary: 'Seçim Özeti',
    notPicked: 'Henüz seçilmedi',
    points: 'puan',
    buildDirection: 'Build yönü:',
    buildEmpty: 'Seçim yaptıkça burada oluşacak.',
    ocrTitle: 'Ekran görüntüsünden kartları oku',
    ocrDesc: 'Opsiyonel: Fotoğraf/screenshot yükle, bulunan kartları aktif turun 3 alanına uygula.',
    ocrNoImage: 'Görsel seçilmedi.',
    ocrEngineFail: 'OCR motoru yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.',
    ocrReading: 'Görsel okunuyor...',
    ocrFound: 'kart tahmini bulundu.',
    ocrNotFound: 'Kart adı bulunamadı. Görseli daha yakından/kırpılmış şekilde dene.',
    ocrError: 'OCR hata verdi:',
    applyOcr: 'Bu kartları aktif tura uygula',
    direct: 'için doğrudan önerilen eklenti',
    champTagFit: 'şampiyon etiketi uyumu',
    enemyValue: 'rakiplere karşı değer',
    prevSynergy: 'önceki seçimlerle sinerji',
    metaPriority: 'MetaSRC önceliği',
    highestRaw: 'bu üçlü içinde en yüksek ham puanı aldı',
    notFound: 'BULUNAMADI',
    notFoundReason: 'Eklenti veya şampiyon veritabanında bulunamadı.',
    allies: '4 Takım Arkadaşı',
    ally: 'Takım',
    allyScore: 'Takım',
    personalScore: 'Kişisel',
    scoreDetails: 'Detaylı skor kırılımı',
    dataBanner: 'Veri notu: Bu sürüm yerel maç geçmişinden öğrenir. Sonuç kaydettikçe öneri puanları sana göre küçük bonus/ceza alır.',
    matchLog: 'Maç Geçmişi',
    saveMatch: 'Maçı kaydet',
    matchResult: 'Maç sonucu',
    win: 'Kazandım',
    loss: 'Kaybettim',
    note: 'Not',
    notePlaceholder: 'İsteğe bağlı: build nasıl hissettirdi?',
    historyEmpty: 'Henüz maç kaydı yok.',
    games: 'Oyun',
    wins: 'Galibiyet',
    winrate: 'Winrate',
    clearHistory: 'Geçmişi temizle',
    matchSaved: 'Maç kaydedildi.',
    learningHint: 'Kişisel öğrenme bonusu: aynı şampiyon + aynı eklenti geçmiş sonuçlarına göre hesaplanır.',
  },
  en: {
    appName: 'Augment Tactics App',
    subtitle: 'Mobile prototype of the Excel v2 decision engine. Pick your champion, enemies, and the 3 cards; the app returns TAKE or REROLL.',
    reset: 'Reset',
    setup: 'Game Setup',
    yourChampion: 'Your champion',
    championPlaceholder: 'Select champion',
    enemies: '5 Enemies',
    enemy: 'Enemy',
    metaPriorities: 'Meta priorities:',
    turn: 'Round',
    augmentPick: 'Augment Pick',
    rerollLabel: 'Reroll threshold',
    rerollHelp: 'Below this threshold, rerolling is usually better.',
    selected: 'Selected:',
    card: 'Card',
    augmentPlaceholder: 'Type augment',
    score: 'Score',
    take: 'TAKE:',
    reroll: 'Reroll cards',
    bestScore: 'Best score',
    threshold: 'threshold',
    enter3: 'Enter 3 augments',
    resultHere: 'Result will appear here.',
    championScore: 'Champion',
    enemyScore: 'Enemy',
    synergy: 'Synergy',
    metaTier: 'Meta/Tier',
    reason: 'Reason:',
    weakReason: 'These options look weak for your champion, enemies, and previous picks.',
    chooseCard: 'card selected, continue',
    cleared: 'I rerolled, clear fields',
    summary: 'Pick Summary',
    notPicked: 'Not picked yet',
    points: 'pts',
    buildDirection: 'Build direction:',
    buildEmpty: 'Will appear as you pick augments.',
    ocrTitle: 'Read cards from screenshot',
    ocrDesc: 'Optional: upload a photo/screenshot; detected cards can fill the active round.',
    ocrNoImage: 'No image selected.',
    ocrEngineFail: 'OCR engine failed to load. Check your connection and refresh.',
    ocrReading: 'Reading image...',
    ocrFound: 'card guesses found.',
    ocrNotFound: 'No card name found. Try a closer/cropped image.',
    ocrError: 'OCR error:',
    applyOcr: 'Apply these cards to active round',
    direct: 'is directly recommended for',
    champTagFit: 'champion tag fit',
    enemyValue: 'enemy-counter value',
    prevSynergy: 'synergy with previous picks',
    metaPriority: 'MetaSRC priority',
    highestRaw: 'highest raw score among these options',
    notFound: 'NOT FOUND',
    notFoundReason: 'Augment or champion not found in database.',
    allies: '4 Allies',
    ally: 'Ally',
    allyScore: 'Team',
    personalScore: 'Personal',
    scoreDetails: 'Detailed score breakdown',
    dataBanner: 'Data note: this version learns from your local match history. Saved results add small personal bonuses/penalties to future scores.',
    matchLog: 'Match History',
    saveMatch: 'Save match',
    matchResult: 'Match result',
    win: 'Win',
    loss: 'Loss',
    note: 'Note',
    notePlaceholder: 'Optional: how did this build feel?',
    historyEmpty: 'No match records yet.',
    games: 'Games',
    wins: 'Wins',
    winrate: 'Winrate',
    clearHistory: 'Clear history',
    matchSaved: 'Match saved.',
    learningHint: 'Personal learning bonus: based on same champion + same augment results in your history.',
  },
};

const normalize = (txt = '') => txt.toString().toLocaleLowerCase('tr-TR').trim();
const uniq = (arr) => [...new Set(arr.filter(Boolean))];
const containsName = (list, name) => list.map(normalize).includes(normalize(name));
const joinTags = (arr) => uniq(arr).join(', ');

const APP_DATA_VERSION = 'Mayhem v8.1 · local learning';
const MATCH_HISTORY_KEY = 'aramSamataMatchHistoryV1';

function safeJsonParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function loadMatchHistory() {
  if (typeof window === 'undefined') return [];
  return safeJsonParse(window.localStorage.getItem(MATCH_HISTORY_KEY), []);
}
function saveMatchHistory(history) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}
function canonicalAugmentName(name) {
  return getAugment(name)?.name || name;
}
function allyTags(allyNames) {
  return allyNames.flatMap(name => getChampion(name)?.tags || []);
}
function personalLearningBonus(augmentName, championName, matchHistory = []) {
  const augName = normalize(canonicalAugmentName(augmentName));
  const champName = normalize(championName);
  const relevant = (matchHistory || []).filter((m) =>
    normalize(m.champion) === champName &&
    (m.picks || []).some((p) => normalize(p) === augName)
  );
  if (relevant.length < 2) return 0;
  const wins = relevant.filter((m) => m.result === 'win').length;
  const wr = wins / relevant.length;
  return Math.max(-5, Math.min(8, Math.round((wr - 0.5) * 16)));
}
function historyStats(history = []) {
  const games = history.length;
  const wins = history.filter(m => m.result === 'win').length;
  const winrate = games ? Math.round((wins / games) * 100) : 0;
  return { games, wins, winrate };
}

function getChampion(name) {
  return champions.find((c) => normalize(c.name) === normalize(name));
}
function getAugment(name) {
  return augments.find((a) => {
    const values = [a.name, a.nameTR, a.nameEN, ...(a.aliases || [])];
    return values.some((v) => normalize(v) === normalize(name));
  });
}
function augmentDisplayName(name, lang = 'tr') {
  const aug = getAugment(name);
  if (!aug) return name;
  if (lang === 'en') return aug.nameEN || aug.name || name;
  return aug.nameTR || aug.name || name;
}
function getMeta(champion) {
  return meta.find((m) => normalize(m.champion) === normalize(champion));
}
function tagScore(tags, sourceTags, kind) {
  const tagSet = new Set((sourceTags || []).map(normalize));
  return (tags || []).reduce((sum, tag) => {
    const w = settings.tagWeights[tag] || settings.tagWeights[Object.keys(settings.tagWeights).find(k => normalize(k) === normalize(tag))];
    if (!w) return sum;
    return sum + (tagSet.has(normalize(tag)) ? Number(w[kind] || 0) : 0);
  }, 0);
}
function directChampionBonus(augment, championName) {
  return containsName(augment.recommendedChampions || [], championName) ? 24 : 0;
}
function metaBonus(augment, championName) {
  const m = getMeta(championName);
  if (!m) return 0;
  const idx = (m.priorityAugments || []).map(normalize).indexOf(normalize(augment.name));
  if (idx === -1) return 0;
  return Math.max(4, 12 - idx * 1.5);
}
function previousTags(turns, currentTurnIndex) {
  const selected = turns.slice(0, currentTurnIndex).map(t => t.lockedChoice).filter(Boolean);
  return selected.flatMap(name => getAugment(name)?.tags || []);
}
function enemyTags(enemyNames) {
  return enemyNames.flatMap(name => getChampion(name)?.tags || []);
}
function explainScore(parts, augment, champion, enemies, lang = 'tr') {
  const t = UI[lang] || UI.tr;
  const bits = [];
  if (parts.direct > 0) bits.push(lang === 'en' ? `${augmentDisplayName(augment.name, lang)} ${t.direct} ${champion}` : `${champion} ${t.direct}`);
  if (parts.championTag > 0) bits.push(`${t.champTagFit} +${parts.championTag}`);
  if (parts.enemy > 0) bits.push(`${t.enemyValue} +${parts.enemy}`);
  if (parts.synergy > 0) bits.push(`${t.prevSynergy} +${parts.synergy}`);
  if (parts.ally > 0) bits.push(`${t.allyScore} +${parts.ally}`);
  if (parts.personal > 0) bits.push(`${t.personalScore} +${parts.personal}`);
  if (parts.meta > 0) bits.push(`${t.metaPriority} +${Math.round(parts.meta)}`);
  if (bits.length === 0) bits.push(t.highestRaw);
  return bits.slice(0, 3).join(' · ');
}
function scoreAugment(augmentName, championName, enemies, turns, currentTurnIndex, lang = 'tr', allies = [], matchHistory = []) {
  const t = UI[lang] || UI.tr;
  const augment = getAugment(augmentName);
  const champ = getChampion(championName);
  if (!augment || !champ) {
    return { name: augmentName, score: 0, decision: t.notFound, reason: t.notFoundReason, parts: {} };
  }
  const champTags = champ.tags || [];
  const eTags = enemyTags(enemies);
  const pTags = previousTags(turns, currentTurnIndex);
  const aTags = allyTags(allies);
  const parts = {
    direct: directChampionBonus(augment, championName),
    championTag: Math.min(28, tagScore(augment.tags, champTags, 'champion')),
    enemy: Math.min(18, tagScore(augment.counterTags?.length ? augment.counterTags : augment.tags, eTags, 'enemy')),
    synergy: Math.min(18, tagScore(augment.tags, pTags, 'synergy')),
    ally: Math.min(10, Math.round(tagScore(augment.tags, aTags, 'synergy') * 0.55)),
    personal: personalLearningBonus(augment.name, championName, matchHistory),
    meta: metaBonus(augment, championName),
    tier: Number(augment.tierScore || 0) * 2,
  };
  const score = Math.round(Object.values(parts).reduce((a, b) => a + b, 0));
  return {
    name: augment.name,
    score,
    tier: augment.tier,
    rarity: augment.rarity,
    tags: augment.tags || [],
    note: augment.note || '',
    parts,
    reason: explainScore(parts, augment, championName, enemies, lang),
  };
}
function evaluateTurn(turnIndex, champion, enemies, turns, lang = 'tr', allies = [], matchHistory = []) {
  const options = turns[turnIndex].options.filter(Boolean);
  const threshold = Number(settings.thresholds[turnIndex + 1] || 50);
  const scored = options.map(opt => scoreAugment(opt, champion, enemies, turns, turnIndex, lang, allies, matchHistory)).sort((a, b) => b.score - a.score);
  const best = scored[0];
  const pass = best && best.score >= threshold;
  return { scored, best, threshold, pass };
}
function AutoCompleteInput({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = normalize(value);
    if (!q) return options.slice(0, 8);
    return options.filter(o => normalize(o).includes(q)).slice(0, 8);
  }, [value, options]);
  return (
    <div className="ac">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 && (
        <div className="ac-list">
          {matches.map((m) => <button key={m} type="button" onMouseDown={() => { onChange(m); setOpen(false); }}>{m}</button>)}
        </div>
      )}
    </div>
  );
}
function Pill({ children }) { return <span className="pill">{children}</span>; }
function ScoreBreakdown({ result, lang = 'tr' }) {
  const t = UI[lang] || UI.tr;
  if (!result) return null;
  return (
    <div className="breakdown">
      <span>{t.championScore}: {Math.round((result.parts.direct || 0) + (result.parts.championTag || 0))}</span>
      <span>{t.enemyScore}: {Math.round(result.parts.enemy || 0)}</span>
      <span>{t.synergy}: {Math.round(result.parts.synergy || 0)}</span>
      <span>{t.allyScore}: {Math.round(result.parts.ally || 0)}</span>
      <span>{t.personalScore}: {Math.round(result.parts.personal || 0)}</span>
      <span>{t.metaTier}: {Math.round((result.parts.meta || 0) + (result.parts.tier || 0))}</span>
    </div>
  );
}


function ScoreDetails({ result, lang = 'tr' }) {
  const t = UI[lang] || UI.tr;
  if (!result) return null;
  const rows = [
    [t.championScore, Math.round((result.parts.direct || 0) + (result.parts.championTag || 0))],
    [t.enemyScore, Math.round(result.parts.enemy || 0)],
    [t.synergy, Math.round(result.parts.synergy || 0)],
    [t.allyScore, Math.round(result.parts.ally || 0)],
    [t.personalScore, Math.round(result.parts.personal || 0)],
    [t.metaTier, Math.round((result.parts.meta || 0) + (result.parts.tier || 0))],
  ];
  return (
    <details className="score-details">
      <summary>{t.scoreDetails}</summary>
      <div className="detail-grid">
        {rows.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <span>{label}</span>
            <b className={value > 0 ? 'pos' : value < 0 ? 'neg' : ''}>{value}</b>
          </div>
        ))}
      </div>
      <p>{t.learningHint}</p>
    </details>
  );
}

function simplifyForMatch(txt = '') {
  return txt
    .toString()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
function similarity(a, b) {
  const aa = simplifyForMatch(a);
  const bb = simplifyForMatch(b);
  if (!aa || !bb) return 0;
  if (aa.includes(bb) || bb.includes(aa)) return 0.96;
  return 1 - levenshtein(aa, bb) / Math.max(aa.length, bb.length, 1);
}
function matchAugmentsFromOcr(text, augmentNames) {
  const cleanText = simplifyForMatch(text);
  const found = [];
  const add = (name, score, source) => {
    if (!name || found.some(x => normalize(x.name) === normalize(name))) return;
    const aug = getAugment(name);
    found.push({ name: aug?.name || name, score, source });
  };

  augmentNames.forEach((name) => {
    const cleanName = simplifyForMatch(name);
    if (cleanName.length >= 4 && cleanText.includes(cleanName)) add(name, 1, 'tam eşleşme');
  });

  const rawLines = text
    .split(/\n|\r|\||•|·|-/)
    .map(x => x.trim())
    .filter(x => x.length >= 3)
    .slice(0, 80);

  rawLines.forEach((line) => {
    let best = { name: '', score: 0 };
    augmentNames.forEach((name) => {
      const sc = similarity(line, name);
      if (sc > best.score) best = { name, score: sc };
    });
    if (best.score >= 0.58) add(best.name, best.score, `OCR: ${line}`);
  });

  return found.sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.name);
}
function OcrCardReader({ augmentNames, onApply, lang = 'tr' }) {
  const t = UI[lang] || UI.tr;
  const [status, setStatus] = useState(t.ocrNoImage);
  const [suggestions, setSuggestions] = useState([]);
  const [progress, setProgress] = useState(0);

  async function handleImage(file) {
    if (!file) return;
    setSuggestions([]);
    setProgress(0);

    if (!window.Tesseract) {
      setStatus(t.ocrEngineFail);
      return;
    }

    try {
      setStatus(t.ocrReading);
      const result = await window.Tesseract.recognize(file, 'tur+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round((m.progress || 0) * 100));
        },
      });
      const text = result?.data?.text || '';
      const matched = matchAugmentsFromOcr(text, augmentNames);
      setSuggestions(matched);
      setStatus(matched.length ? `${matched.length} ${t.ocrFound}` : t.ocrNotFound);
    } catch (err) {
      setStatus(`${t.ocrError} ${err?.message || 'Unknown error'}`);
    }
  }

  return (
    <div className="ocr-box">
      <div className="ocr-head">
        <div>
          <b>{t.ocrTitle}</b>
          <p>{t.ocrDesc}</p>
        </div>
      </div>
      <input
        className="file-input"
        type="file"
        accept="image/*"
        onChange={(e) => handleImage(e.target.files?.[0])}
      />
      <div className="ocr-status">{status}{progress > 0 && progress < 100 ? ` (${progress}%)` : ''}</div>
      {suggestions.length > 0 && (
        <div className="ocr-results">
          <div>{suggestions.map(x => <Pill key={x}>{augmentDisplayName(x, lang)}</Pill>)}</div>
          <button className="primary" type="button" onClick={() => onApply(suggestions)}>{t.applyOcr}</button>
        </div>
      )}
    </div>
  );
}
function App() {
  const [lang, setLang] = useState('tr');
  const t = UI[lang] || UI.tr;
  const championNames = useMemo(() => champions.map(c => c.name), []);
  const augmentNames = useMemo(() => uniq(augments.flatMap(a => [a.name, a.nameTR, a.nameEN, ...(a.aliases || [])]).filter(Boolean)), []);
  const [champion, setChampion] = useState('Dr. Mundo');
  const [enemies, setEnemies] = useState(['Smolder', 'Twisted Fate', 'Illaoi', 'Cassiopeia', 'Lissandra']);
  const [allies, setAllies] = useState(['', '', '', '']);
  const [turns, setTurns] = useState([{...emptyTurn}, {...emptyTurn}, {...emptyTurn}, {...emptyTurn}]);
  const [matchHistory, setMatchHistory] = useState(() => loadMatchHistory());
  const [matchResult, setMatchResult] = useState('win');
  const [matchNote, setMatchNote] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTurn, setActiveTurn] = useState(0);
  const champ = getChampion(champion);
  const metaRow = getMeta(champion);
  const evaluations = turns.map((_, i) => evaluateTurn(i, champion, enemies, turns, lang, allies, matchHistory));
  const currentEval = evaluations[activeTurn];

  function setTurnOption(ti, oi, value) {
    setTurns(prev => prev.map((turn, idx) => idx !== ti ? turn : { ...turn, options: turn.options.map((o, j) => j === oi ? value : o) }));
  }
  function choose(name) {
    const aug = getAugment(name);
    setTurns(prev => prev.map((turn, idx) => idx !== activeTurn ? turn : { ...turn, lockedChoice: aug?.name || name }));
    if (activeTurn < 3) setActiveTurn(activeTurn + 1);
  }
  function reroll() {
    setTurns(prev => prev.map((turn, idx) => idx !== activeTurn ? turn : { ...turn, options: ['', '', ''], lockedChoice: '' }));
  }
  function applyOcrSuggestions(names) {
    setTurns(prev => prev.map((turn, idx) => idx !== activeTurn ? turn : {
      ...turn,
      options: [names[0] || '', names[1] || '', names[2] || ''],
      lockedChoice: '',
    }));
  }
  useEffect(() => {
    saveMatchHistory(matchHistory);
  }, [matchHistory]);

  function resetAll() {
    setTurns([{...emptyTurn}, {...emptyTurn}, {...emptyTurn}, {...emptyTurn}]);
    setActiveTurn(0);
    setSaveMessage('');
  }
  function saveCurrentMatch() {
    const picks = turns.map((turn) => canonicalAugmentName(turn.lockedChoice)).filter(Boolean);
    if (!champion || picks.length === 0) return;
    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      champion,
      enemies,
      allies,
      picks,
      result: matchResult,
      note: matchNote,
    };
    setMatchHistory(prev => [record, ...prev].slice(0, 100));
    setMatchNote('');
    setSaveMessage(t.matchSaved);
  }
  function clearMatchHistory() {
    setMatchHistory([]);
    setSaveMessage('');
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={16}/> LoL ARAM Şamata</div>
          <h1>{t.appName}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="hero-actions">
          <button className="lang-toggle" onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}>{lang === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</button>
          <button className="ghost" onClick={resetAll}><RotateCcw size={16}/> {t.reset}</button>
        </div>
      </section>

      <section className="data-banner">
        <b>{APP_DATA_VERSION}</b>
        <span>{t.dataBanner}</span>
      </section>

      <section className="card setup">
        <h2><Swords size={18}/> {t.setup}</h2>
        <label>{t.yourChampion}</label>
        <AutoCompleteInput value={champion} onChange={setChampion} options={championNames} placeholder={t.championPlaceholder} />
        {champ && <div className="info"><b>{champ.role}</b> · {champ.damage}<br/><span>{joinTags(champ.tags)}</span></div>}
        <label>{t.enemies}</label>
        <div className="enemy-grid">
          {enemies.map((e, i) => (
            <AutoCompleteInput key={i} value={e} onChange={(v) => setEnemies(prev => prev.map((x, j) => j === i ? v : x))} options={championNames} placeholder={`${t.enemy} ${i+1}`} />
          ))}
        </div>
        <label>{t.allies}</label>
        <div className="enemy-grid">
          {allies.map((ally, i) => (
            <AutoCompleteInput key={i} value={ally} onChange={(v) => setAllies(prev => prev.map((x, j) => j === i ? v : x))} options={championNames} placeholder={`${t.ally} ${i+1}`} />
          ))}
        </div>
        {metaRow?.priorityAugments?.length > 0 && <div className="meta"><b>{t.metaPriorities}</b> {metaRow.priorityAugments.slice(0, 6).map(x => <Pill key={x}>{augmentDisplayName(x, lang)}</Pill>)}</div>}
      </section>

      <section className="tabs">
        {turns.map((turn, i) => <button key={i} className={activeTurn === i ? 'active' : ''} onClick={() => setActiveTurn(i)}>{t.turn} {i+1}{turn.lockedChoice ? ' ✓' : ''}</button>)}
      </section>

      <section className="card turn-card">
        <div className="turn-head">
          <div>
            <h2>{activeTurn + 1}. {t.augmentPick}</h2>
            <p>{t.rerollLabel}: <b>{currentEval.threshold}</b>. {t.rerollHelp}</p>
          </div>
          {turns[activeTurn].lockedChoice && <div className="locked"><CheckCircle2 size={16}/> {t.selected} {augmentDisplayName(turns[activeTurn].lockedChoice, lang)}</div>}
        </div>
        <div className="option-grid">
          {[0,1,2].map(i => {
            const optionName = turns[activeTurn].options[i];
            const rank = currentEval.scored.findIndex(s => normalize(s.name) === normalize(getAugment(optionName)?.name || optionName));
            const rankClass = rank === 0 ? 'rank-best' : rank === 1 ? 'rank-mid' : rank === 2 ? 'rank-low' : '';
            const scored = currentEval.scored.find(s => normalize(s.name) === normalize(getAugment(optionName)?.name || optionName));
            return (
              <div className={`option ${rankClass}`} key={i}>
                <label>{t.card} {i+1}</label>
                <AutoCompleteInput value={turns[activeTurn].options[i]} onChange={(v) => setTurnOption(activeTurn, i, v)} options={augmentNames} placeholder={t.augmentPlaceholder} />
                {scored && (
                  <div className="mini-score">
                    {t.score}: {scored.score}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <OcrCardReader augmentNames={augmentNames} onApply={applyOcrSuggestions} lang={lang} />

        <div className={`decision ${currentEval.pass ? 'take' : 'reroll'}`}>
          {currentEval.best ? (
            currentEval.pass ? <><CheckCircle2/> <b>{t.take} {augmentDisplayName(currentEval.best.name, lang)}</b><span>{t.score} {currentEval.best.score}</span></> : <><XCircle/> <b>{t.reroll}</b><span>{t.bestScore} {currentEval.best.score}, {t.threshold} {currentEval.threshold}</span></>
          ) : <><Search/> <b>{t.enter3}</b><span>{t.resultHere}</span></>}
        </div>
        {currentEval.best && <>
          <ScoreBreakdown result={currentEval.best} lang={lang}/>
          <ScoreDetails result={currentEval.best} lang={lang}/>
          <p className="reason"><b>{t.reason}</b> {currentEval.pass ? currentEval.best.reason : t.weakReason}</p>
          <div className="actions three-actions">
            {[0, 1, 2].map((i) => {
              const optionName = turns[activeTurn].options[i];
              const baseName = getAugment(optionName)?.name || optionName;
              const scoredOption = currentEval.scored.find((s) => normalize(s.name) === normalize(baseName));

              if (!optionName || !scoredOption) return null;

              return (
                <button
                  key={i}
                  className="primary"
                  onClick={() => choose(scoredOption.name)}
                >
                  {i + 1}. {t.chooseCard}
                </button>
              );
            })}

            <button className="secondary" onClick={reroll}>
              {t.cleared}
            </button>
          </div>
        </>}
      </section>

      <section className="card">
        <h2><Trophy size={18}/> {t.summary}</h2>
        <div className="summary">
          {turns.map((turn, i) => <div className="sum-row" key={i}><span>{t.turn} {i+1}</span><b>{turn.lockedChoice ? augmentDisplayName(turn.lockedChoice, lang) : t.notPicked}</b><em>{turn.lockedChoice ? `${scoreAugment(turn.lockedChoice, champion, enemies, turns, i, lang, allies, matchHistory).score} ${t.points}` : ''}</em></div>)}
        </div>
        <div className="build-tags"><ShieldAlert size={16}/> {t.buildDirection} {joinTags(previousTags(turns, 4).slice(0, 12)) || t.buildEmpty}</div>
        <div className="save-panel">
          <label>{t.matchResult}</label>
          <div className="result-buttons">
            <button type="button" className={matchResult === 'win' ? 'active-result' : ''} onClick={() => setMatchResult('win')}>{t.win}</button>
            <button type="button" className={matchResult === 'loss' ? 'active-result' : ''} onClick={() => setMatchResult('loss')}>{t.loss}</button>
          </div>
          <label>{t.note}</label>
          <input value={matchNote} onChange={(e) => setMatchNote(e.target.value)} placeholder={t.notePlaceholder} />
          <button className="primary" type="button" onClick={saveCurrentMatch}>{t.saveMatch}</button>
          {saveMessage && <div className="save-message">{saveMessage}</div>}
        </div>
      </section>

      <section className="card history-card">
        <h2><Trophy size={18}/> {t.matchLog}</h2>
        {(() => {
          const stats = historyStats(matchHistory);
          return <div className="history-stats"><span>{t.games}: <b>{stats.games}</b></span><span>{t.wins}: <b>{stats.wins}</b></span><span>{t.winrate}: <b>{stats.winrate}%</b></span></div>;
        })()}
        {matchHistory.length === 0 ? <p>{t.historyEmpty}</p> : (
          <div className="history-list">
            {matchHistory.slice(0, 6).map((m) => (
              <div className="history-item" key={m.id}>
                <div><b>{m.champion}</b> · {m.result === 'win' ? t.win : t.loss}</div>
                <span>{(m.picks || []).map(x => augmentDisplayName(x, lang)).join(' / ')}</span>
                {m.note && <em>{m.note}</em>}
              </div>
            ))}
          </div>
        )}
        {matchHistory.length > 0 && <button className="secondary" type="button" onClick={clearMatchHistory}>{t.clearHistory}</button>}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
