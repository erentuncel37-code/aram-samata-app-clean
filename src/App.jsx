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
          {[0,1,2].map(i => (
            <div className="option" key={i}>
              <label>Kart {i+1}</label>
              <AutoCompleteInput value={turns[activeTurn].options[i]} onChange={(v) => setTurnOption(activeTurn, i, v)} options={augmentNames} placeholder="Eklenti yaz" />
              {currentEval.scored.find(s => normalize(s.name) === normalize(turns[activeTurn].options[i])) && (
                <div className="mini-score">
                  Skor: {currentEval.scored.find(s => normalize(s.name) === normalize(turns[activeTurn].options[i]))?.score}
                </div>
              )}
            </div>
          ))}
        </div>

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

  <button
    className="secondary"
    onClick={reroll}
  >
    Kartları çevirdim, alanı temizle
  </button>
</div>
        </>}
      </section>

      <section className="card">
        <h2><Trophy size={18}/> Seçim Özeti</h2>
        <div className="summary">
          {turns.map((t, i) => <div className="sum-row" key={i}><span>Tur {i+1}</span><b>{t.lockedChoice || 'Henüz seçilmedi'}</b><em>{t.lockedChoice ? `${evaluations[i].best?.score || ''} puan` : ''}</em></div>)}
        </div>
        <div className="build-tags"><ShieldAlert size={16}/> Build yönü: {joinTags(previousTags(turns, 4).slice(0, 12)) || 'Seçim yaptıkça burada oluşacak.'}</div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
