import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw, Trophy, Swords, Sparkles, ShieldAlert, CheckCircle2, XCircle, Search } from 'lucide-react';
import { champions, augments, meta, settings } from './data/gameData.js';
import './styles.css';

const emptyTurn = { options: ['', '', ''], lockedChoice: '' };
const normalize = (txt = '') => txt.toString().toLocaleLowerCase('tr-TR').trim();
const uniq = (arr) => [...new Set(arr.filter(Boolean))];
const containsName = (list, name) => list.map(normalize).includes(normalize(name));
const joinTags = (arr) => uniq(arr).join(', ');

function getChampion(name) {
  return champions.find((c) => normalize(c.name) === normalize(name));
}
function getAugment(name) {
  return augments.find((a) => normalize(a.name) === normalize(name));
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
function explainScore(parts, augment, champion, enemies) {
  const bits = [];
  if (parts.direct > 0) bits.push(`${champion} için doğrudan önerilen eklenti`);
  if (parts.championTag > 0) bits.push(`şampiyon etiketi uyumu +${parts.championTag}`);
  if (parts.enemy > 0) bits.push(`rakiplere karşı değer +${parts.enemy}`);
  if (parts.synergy > 0) bits.push(`önceki seçimlerle sinerji +${parts.synergy}`);
  if (parts.meta > 0) bits.push(`MetaSRC önceliği +${Math.round(parts.meta)}`);
  if (bits.length === 0) bits.push('bu üçlü içinde en yüksek ham puanı aldı');
  return bits.slice(0, 3).join(' · ');
}
function scoreAugment(augmentName, championName, enemies, turns, currentTurnIndex) {
  const augment = getAugment(augmentName);
  const champ = getChampion(championName);
  if (!augment || !champ) {
    return { name: augmentName, score: 0, decision: 'BULUNAMADI', reason: 'Eklenti veya şampiyon veritabanında bulunamadı.', parts: {} };
  }
  const champTags = champ.tags || [];
  const eTags = enemyTags(enemies);
  const pTags = previousTags(turns, currentTurnIndex);
  const parts = {
    direct: directChampionBonus(augment, championName),
    championTag: Math.min(28, tagScore(augment.tags, champTags, 'champion')),
    enemy: Math.min(18, tagScore(augment.counterTags?.length ? augment.counterTags : augment.tags, eTags, 'enemy')),
    synergy: Math.min(18, tagScore(augment.tags, pTags, 'synergy')),
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
    reason: explainScore(parts, augment, championName, enemies),
  };
}
function evaluateTurn(turnIndex, champion, enemies, turns) {
  const options = turns[turnIndex].options.filter(Boolean);
  const threshold = Number(settings.thresholds[turnIndex + 1] || 50);
  const scored = options.map(opt => scoreAugment(opt, champion, enemies, turns, turnIndex)).sort((a, b) => b.score - a.score);
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
function ScoreBreakdown({ result }) {
  if (!result) return null;
  return (
    <div className="breakdown">
      <span>Şampiyon: {Math.round((result.parts.direct || 0) + (result.parts.championTag || 0))}</span>
      <span>Rakip: {Math.round(result.parts.enemy || 0)}</span>
      <span>Sinerji: {Math.round(result.parts.synergy || 0)}</span>
      <span>Meta/Tier: {Math.round((result.parts.meta || 0) + (result.parts.tier || 0))}</span>
    </div>
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
    found.push({ name, score, source });
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
function OcrCardReader({ augmentNames, onApply }) {
  const [status, setStatus] = useState('Görsel seçilmedi.');
  const [rawText, setRawText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [progress, setProgress] = useState(0);

  async function handleImage(file) {
    if (!file) return;
    setRawText('');
    setSuggestions([]);
    setProgress(0);

    if (!window.Tesseract) {
      setStatus('OCR motoru yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.');
      return;
    }

    try {
      setStatus('Görsel okunuyor...');
      const result = await window.Tesseract.recognize(file, 'tur+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round((m.progress || 0) * 100));
        },
      });
      const text = result?.data?.text || '';
      const matched = matchAugmentsFromOcr(text, augmentNames);
      setRawText(text.trim());
      setSuggestions(matched);
      setStatus(matched.length ? `${matched.length} kart tahmini bulundu.` : 'Kart adı bulunamadı. Görseli daha yakından/kırpılmış şekilde dene.');
    } catch (err) {
      setStatus(`OCR hata verdi: ${err?.message || 'Bilinmeyen hata'}`);
    }
  }

  return (
    <div className="ocr-box">
      <div className="ocr-head">
        <div>
          <b>Ekran görüntüsünden kartları oku</b>
          <p>Opsiyonel: Fotoğraf/screenshot yükle, bulunan kartları aktif turun 3 alanına uygula.</p>
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
          <div>{suggestions.map(x => <Pill key={x}>{x}</Pill>)}</div>
          <button className="primary" type="button" onClick={() => onApply(suggestions)}>Bu kartları aktif tura uygula</button>
        </div>
      )}
      {rawText && (
        <details className="ocr-raw">
          <summary>OCR ham metni göster</summary>
          <pre>{rawText}</pre>
        </details>
      )}
    </div>
  );
}
function App() {
  const championNames = useMemo(() => champions.map(c => c.name), []);
  const augmentNames = useMemo(() => augments.map(a => a.name), []);
  const [champion, setChampion] = useState('Dr. Mundo');
  const [enemies, setEnemies] = useState(['Smolder', 'Twisted Fate', 'Illaoi', 'Cassiopeia', 'Lissandra']);
  const [turns, setTurns] = useState([{...emptyTurn}, {...emptyTurn}, {...emptyTurn}, {...emptyTurn}]);
  const [activeTurn, setActiveTurn] = useState(0);
  const champ = getChampion(champion);
  const metaRow = getMeta(champion);
  const evaluations = turns.map((_, i) => evaluateTurn(i, champion, enemies, turns));
  const currentEval = evaluations[activeTurn];

  function setTurnOption(ti, oi, value) {
    setTurns(prev => prev.map((t, idx) => idx !== ti ? t : { ...t, options: t.options.map((o, j) => j === oi ? value : o) }));
  }
  function choose(name) {
    setTurns(prev => prev.map((t, idx) => idx !== activeTurn ? t : { ...t, lockedChoice: name }));
    if (activeTurn < 3) setActiveTurn(activeTurn + 1);
  }
  function reroll() {
    setTurns(prev => prev.map((t, idx) => idx !== activeTurn ? t : { ...t, options: ['', '', ''], lockedChoice: '' }));
  }
  function applyOcrSuggestions(names) {
    setTurns(prev => prev.map((t, idx) => idx !== activeTurn ? t : {
      ...t,
      options: [names[0] || '', names[1] || '', names[2] || ''],
      lockedChoice: '',
    }));
  }
  function resetAll() {
    setTurns([{...emptyTurn}, {...emptyTurn}, {...emptyTurn}, {...emptyTurn}]);
    setActiveTurn(0);
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={16}/> LoL ARAM Şamata</div>
          <h1>Eklenti Taktik Programı</h1>
          <p>Excel v2 karar motorunun mobil uygulama prototipi. Şampiyonunu, rakipleri ve gelen 3 kartı gir; sistem AL veya ÇEVİR kararını verir.</p>
        </div>
        <button className="ghost" onClick={resetAll}><RotateCcw size={16}/> Sıfırla</button>
      </section>

      <section className="card setup">
        <h2><Swords size={18}/> Oyun Girişi</h2>
        <label>Şampiyonun</label>
        <AutoCompleteInput value={champion} onChange={setChampion} options={championNames} placeholder="Şampiyon seç" />
        {champ && <div className="info"><b>{champ.role}</b> · {champ.damage}<br/><span>{joinTags(champ.tags)}</span></div>}
        <label>5 Rakip</label>
        <div className="enemy-grid">
          {enemies.map((e, i) => (
            <AutoCompleteInput key={i} value={e} onChange={(v) => setEnemies(prev => prev.map((x, j) => j === i ? v : x))} options={championNames} placeholder={`Rakip ${i+1}`} />
          ))}
        </div>
        {metaRow?.priorityAugments?.length > 0 && <div className="meta"><b>Meta öncelikleri:</b> {metaRow.priorityAugments.slice(0, 6).map(x => <Pill key={x}>{x}</Pill>)}</div>}
      </section>

      <section className="tabs">
        {turns.map((t, i) => <button key={i} className={activeTurn === i ? 'active' : ''} onClick={() => setActiveTurn(i)}>Tur {i+1}{t.lockedChoice ? ' ✓' : ''}</button>)}
      </section>

      <section className="card turn-card">
        <div className="turn-head">
          <div>
            <h2>{activeTurn + 1}. Eklenti Seçimi</h2>
            <p>Reroll eşiği: <b>{currentEval.threshold}</b>. Bu eşiğin altındaysa kart çevirmek daha mantıklı.</p>
          </div>
          {turns[activeTurn].lockedChoice && <div className="locked"><CheckCircle2 size={16}/> Seçildi: {turns[activeTurn].lockedChoice}</div>}
        </div>
        <div className="option-grid">
          {[0,1,2].map(i => {
            const optionName = turns[activeTurn].options[i];
            const rank = currentEval.scored.findIndex(s => normalize(s.name) === normalize(optionName));
            const rankClass = rank === 0 ? 'rank-best' : rank === 1 ? 'rank-mid' : rank === 2 ? 'rank-low' : '';
            return (
            <div className={`option ${rankClass}`} key={i}>
              <label>Kart {i+1}</label>
              <AutoCompleteInput value={turns[activeTurn].options[i]} onChange={(v) => setTurnOption(activeTurn, i, v)} options={augmentNames} placeholder="Eklenti yaz" />
              {currentEval.scored.find(s => normalize(s.name) === normalize(turns[activeTurn].options[i])) && (
                <div className="mini-score">
                  Skor: {currentEval.scored.find(s => normalize(s.name) === normalize(turns[activeTurn].options[i]))?.score}
                </div>
              )}
            </div>
          )})}
        </div>

        <OcrCardReader augmentNames={augmentNames} onApply={applyOcrSuggestions} />

        <div className={`decision ${currentEval.pass ? 'take' : 'reroll'}`}>
          {currentEval.best ? (
            currentEval.pass ? <><CheckCircle2/> <b>AL: {currentEval.best.name}</b><span>Skor {currentEval.best.score}</span></> : <><XCircle/> <b>Kartları çevir</b><span>En iyi skor {currentEval.best.score}, eşik {currentEval.threshold}</span></>
          ) : <><Search/> <b>3 eklentiyi gir</b><span>Sonuç burada görünecek.</span></>}
        </div>
        {currentEval.best && <>
          <ScoreBreakdown result={currentEval.best}/>
          <p className="reason"><b>Gerekçe:</b> {currentEval.pass ? currentEval.best.reason : 'Bu üçlü mevcut şampiyon, rakip ve önceki seçimlere göre yeterince güçlü görünmüyor.'}</p>
          <div className="actions three-actions">
            {[0, 1, 2].map((i) => {
              const optionName = turns[activeTurn].options[i];
              const scoredOption = currentEval.scored.find(
                (s) => normalize(s.name) === normalize(optionName)
              );

              if (!optionName || !scoredOption) return null;

              return (
                <button
                  key={i}
                  className="primary"
                  onClick={() => choose(scoredOption.name)}
                >
                  {i + 1}. kartı seçtim, devam
                </button>
              );
            })}

            <button className="secondary" onClick={reroll}>
              Kartları çevirdim, alanı temizle
            </button>
          </div>
        </>}
      </section>

      <section className="card">
        <h2><Trophy size={18}/> Seçim Özeti</h2>
        <div className="summary">
          {turns.map((t, i) => <div className="sum-row" key={i}><span>Tur {i+1}</span><b>{t.lockedChoice || 'Henüz seçilmedi'}</b><em>{t.lockedChoice ? `${scoreAugment(t.lockedChoice, champion, enemies, turns, i).score} puan` : ''}</em></div>)}
        </div>
        <div className="build-tags"><ShieldAlert size={16}/> Build yönü: {joinTags(previousTags(turns, 4).slice(0, 12)) || 'Seçim yaptıkça burada oluşacak.'}</div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
