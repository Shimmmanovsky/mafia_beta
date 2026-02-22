const rOrder = ['Doctor', 'Mafia', 'Maniac', 'Detective'];
const rD = {
    Citizen: { n: 'Мирный', e: '😊', c: 'tag-Citizen' },
    Mafia: { n: 'Мафия', e: '👺', c: 'tag-Mafia' },
    Detective: { n: 'Комиссар', e: '🕵️‍♂️', c: 'tag-Detective' },
    Doctor: { n: 'Доктор', e: '💊', c: 'tag-Doctor' },
    Maniac: { n: 'Маньяк', e: '🔪', c: 'tag-Maniac' }
};

let ps = [], rs = { Mafia: 1, Maniac: 0, Detective: 1, Doctor: 1 }, 
    activeRs = [], activeNRs = [], curRi = 0, curNi = 0, night = 1, 
    acts = {}, selId = null, isDay = false, tiePs = [], 
    msgCallback = null, lastDocId = null, checkedIds = [];

function confirmReset() { if (confirm("Сбросить игру?")) location.reload(); }
function showMsg(t, txt, cb) { document.getElementById('next-role-hint').innerText = t; document.getElementById('msg-text').innerHTML = txt; document.getElementById('msg-scr').style.display = 'flex'; msgCallback = cb; }
function closeMsg() { document.getElementById('msg-scr').style.display = 'none'; if (msgCallback) msgCallback(); }

function go(n) { 
    document.querySelectorAll('.s').forEach(x => x.classList.remove('a')); 
    document.getElementById('s' + n).classList.add('a'); 
    window.scrollTo(0, 0); 
    if (n === 3) renderS3(); else if (n === 4) renderGame(); else { updateHeader(n); render(); }
}

function updateHeader(n) {
    const titles = { 1: `Игроки (${ps.length})`, 2: "Настройка ролей", 3: `Знакомство: ${activeRs[curRi] ? rD[activeRs[curRi]].n : ''}`, 4: isDay ? (tiePs.length ? "Автокатастрофа" : `День ${night}`) : `Ночь ${night}` };
    document.getElementById('main-title').innerText = titles[n] || "Мафия";
}

function addP() { ps.push({ n: '', r: 'Citizen', out: false, v: 0 }); render(); }
function delP(i) { ps.splice(i, 1); render(); }

function render() {
    const l1 = document.getElementById('l1'), lp = document.getElementById('lp');
    if (l1 && document.getElementById('s1').classList.contains('a')) {
        l1.innerHTML = ps.map((p, i) => `<div class="r"><b style="color:#444;width:20px">${i+1}</b><input value="${p.n}" oninput="ps[${i}].n=this.value" placeholder="Имя"><button class="del-btn" onclick="delP(${i})">✕</button></div>`).join('');
        updateHeader(1);
    }
    if (lp && document.getElementById('s2').classList.contains('a')) {
        lp.innerHTML = Object.keys(rs).map(r => `<div class="r"><span>${rD[r].e} ${rD[r].n}</span><div class="v-wrap"><button class="v-btn" onclick="rs['${r}']=Math.max(0,rs['${r}']-1);render()">-</button><div class="v-cnt">${rs[r]}</div><button class="v-btn" onclick="rs['${r}']++;render()">+</button></div></div>`).join('');
        let spec = Object.values(rs).reduce((a, b) => a + b, 0);
        document.getElementById('totalC').innerText = ps.length; document.getElementById('citC').innerText = Math.max(0, ps.length - spec);
    }
}

function checkR() { if (ps.length > 2) { curRi = 0; ps.forEach(p => { p.r = 'Citizen'; p.out = false; p.v = 0; }); activeRs = rOrder.filter(r => rs[r] > 0); go(3); } }

function renderS3() {
    updateHeader(3); let r = activeRs[curRi], count = ps.filter(p => p.r === r).length;
    document.getElementById('roleLimitInfo').innerText = `Выбрано: ${count} из ${rs[r]}`;
    document.getElementById('l3').innerHTML = ps.map((p, i) => `<div class="r ${p.r===r?'sel':''} ${p.r!=='Citizen'&&p.r!==r?'isOut':''}" onclick="setRole(${i},'${r}')"><b>${i+1}</b> ${p.n||'Игрок '+(i+1)} ${p.r!=='Citizen' ? `<span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>` : ''}</div>`).join('');
}

function setRole(i, r) { if (ps[i].r === r) ps[i].r = 'Citizen'; else { if (rs[r] === 1) { ps.forEach(p => { if(p.r === r) p.r = 'Citizen'; }); ps[i].r = r; } else if (ps.filter(p => p.r === r).length < rs[r]) { if (ps[i].r === 'Citizen') ps[i].r = r; } } renderS3(); }

function nextRS() { 
    if (ps.filter(p => p.r === activeRs[curRi]).length === rs[activeRs[curRi]]) { 
        curRi++; 
        if (curRi >= activeRs.length) {
            let sum = ps.map((p, i) => `<b>${i+1}.</b> ${p.n||'Игрок '+(i+1)} — ${rD[p.r].e} ${rD[p.r].n}`).join('<br>');
            showMsg("Итоги распределения", `<div style="text-align:left; font-size:14px; background:#1c1c1e; padding:12px; border-radius:12px; margin-bottom:10px; max-height:200px; overflow-y:auto;">${sum}</div>Пора засыпать. 😴`, () => startNight());
        } else renderS3(); 
    } 
}

function startNight() { isDay = false; curNi = 0; acts = {}; selId = null; tiePs = []; activeNRs = rOrder.filter(r => rs[r] > 0 && ps.some(p => p.r === r && !p.out)); go(4); }

function renderGame() {
    updateHeader(4); const voteStat = document.getElementById('voteStat'), nightPanel = document.getElementById('nightStatusPanel'), skB = document.getElementById('skB'), cfB = document.getElementById('cfB'), l4 = document.getElementById('l4');
    let actorIds = [], currentRole = null;
    if (!isDay) {
        currentRole = activeNRs[curNi];
        if (currentRole) {
            actorIds = ps.map((p, i) => p.r === currentRole && !p.out ? i : null).filter(x => x !== null);
            nightPanel.innerHTML = `<div class="actor-card">Ходит: ${rD[currentRole].n}</div>`;
            cfB.innerText = (curNi === activeNRs.length - 1) ? "Город просыпается ☀️" : "Следующий ход";
            cfB.style.display = (selId !== null) ? "flex" : "none"; skB.style.display = (selId === null) ? "flex" : "none"; skB.innerText = "Пропустить ход";
        }
    } else {
        nightPanel.innerHTML = ""; let totalV = ps.reduce((s, p) => s + p.v, 0), aliveC = ps.filter(p => !p.out).length;
        voteStat.innerText = `Голосов: ${totalV} / ${aliveC}`; cfB.innerText = "Завершить день"; cfB.style.display = (totalV > 0) ? "flex" : "none"; skB.style.display = (totalV === 0 && tiePs.length === 0) ? "flex" : "none"; skB.innerText = "Никто не ушел";
    }
    l4.innerHTML = ps.map((p, i) => {
        const isActor = actorIds.includes(i), isTie = tiePs.length === 0 || tiePs.includes(i);
        let extra = '', state = '', click = true;
        if (!isDay && currentRole === 'Doctor' && i === lastDocId) { extra = `<small style="color:#ff9f0a;margin-left:8px;font-weight:bold">(Нельзя лечить подряд)</small>`; state = 'locked'; click = false; }
        if (!isDay && currentRole === 'Detective' && checkedIds.includes(i)) { extra = `<small style="color:#0a84ff;margin-left:8px;font-weight:bold">(Уже проверен)</small>`; state = 'locked'; click = false; }
        if (p.out) state = 'isOut', click = false; if (isDay && !isTie) state = 'isOut', click = false;
        return `<div class="r ${state} ${isActor ? 'actor-focus' : ''} ${selId === i ? 'sel' : ''}" onclick="${click ? `clickP(${i})` : ''}"><b>${i+1}</b> <span>${p.n||'Игрок '+(i+1)}</span> ${extra} <span class="tag ${rD[p.r].c}">${rD[p.r].e} ${rD[p.r].n}</span> ${isDay && !p.out ? `<div class="v-wrap" onclick="event.stopPropagation()"><button class="v-btn" onclick="vote(${i},-1)">-</button><div class="v-cnt">${p.v}</div><button class="v-btn" onclick="vote(${i},1)">+</button></div>` : ''}</div>`;
    }).join('');
}

function clickP(i) { if (isDay || (!isDay && curNi >= activeNRs.length)) return; selId = (selId === i) ? null : i; renderGame(); }
function vote(i, v) { let totalV = ps.reduce((s, p) => s + p.v, 0), aliveC = ps.filter(p => !p.out).length; if (v > 0 && totalV < aliveC) ps[i].v++; if (v < 0 && ps[i].v > 0) ps[i].v--; renderGame(); }

function checkWin() {
    let alive = ps.filter(p => !p.out), mafs = alive.filter(p => p.r === 'Mafia').length, mans = alive.filter(p => p.r === 'Maniac').length, citizens = alive.length - mafs - mans;
    if (mafs >= (citizens + mans) && mafs > 0) { showWin("Победа Мафии! 👺", "Мафия победила."); return true; }
    if (mafs === 0 && mans === 0) { showWin("Победа Города! 😊", "Все преступники пойманы."); return true; }
    if (mans > 0 && mafs === 0 && alive.length <= 2) { showWin("Победа Маньяка! 🔪", "Остался один маньяк."); return true; }
    return false;
}
function showWin(t, txt) { showMsg(t, txt + "<br><br>Начать заново?", () => location.reload()); }

function doAction(id) {
    if (isDay) {
        let totalV = ps.reduce((s, p) => s + p.v, 0);
        if (id === null && totalV === 0) { showMsg("День окончен", "Никто не ушел.", () => { ps.forEach(p => p.v = 0); night++; startNight(); }); return; }
        let cand = ps.filter((p, idx) => !p.out && (tiePs.length === 0 || tiePs.includes(idx))), maxV = Math.max(...cand.map(p => p.v)); if (maxV === 0) return;
        let leaders = cand.filter(p => p.v === maxV);
        if (leaders.length === 1) { leaders[0].out = true; if (checkWin()) return; showMsg("Голосование", `${leaders[0].n || "№" + (ps.indexOf(leaders[0]) + 1)} покидает город.`, () => { ps.forEach(p => p.v = 0); night++; startNight(); }); }
        else { if (tiePs.length > 0) { showMsg("Ничья", "Никто не покидает город.", () => { ps.forEach(p => p.v = 0); night++; startNight(); }); } else { tiePs = leaders.map(p => ps.indexOf(p)); ps.forEach(p => p.v = 0); showMsg("Автокатастрофа!", "Ничья. Переголосование!", () => renderGame()); } }
    } else {
        acts[activeNRs[curNi]] = id; let roleNow = rD[activeNRs[curNi]].n; curNi++; selId = null;
        if (curNi >= activeNRs.length) { showMsg(roleNow + " засыпает", "Все сделали ход. Просыпаемся!", () => endNight()); } 
        else showMsg(roleNow + " засыпает", "Просыпается: <br><b>" + rD[activeNRs[curNi]].n + "</b>", () => renderGame());
    }
}

function endNight() {
    curNi = 0; let killed = [], savedId = acts['Doctor']; lastDocId = savedId;
    if (acts['Mafia'] !== null && acts['Mafia'] !== savedId) killed.push(acts['Mafia']);
    if (acts['Maniac'] !== null && acts['Maniac'] !== savedId && !killed.includes(acts['Maniac'])) killed.push(acts['Maniac']);
    killed.forEach(idx => { if (ps[idx]) ps[idx].out = true; });
    let msg = killed.length ? `Погибли: <br><b>${killed.map(idx => ps[idx].n || '№' + (idx+1)).join(", ")}</b>` : "Никто не погиб.";
    if (acts['Detective'] !== null && ps[acts['Detective']]) {
        let t = ps[acts['Detective']]; if (!checkedIds.includes(acts['Detective'])) checkedIds.push(acts['Detective']);
        msg += `<br><br><small>🕵️‍♂️ Комиссар: ${t.n || '№' + (ps.indexOf(t)+1)} — <b>${t.r==='Mafia'?'МАФИЯ':'МИРНЫЙ'}</b></small>`;
    }
    showMsg("Утро наступило ☀️", msg, () => { isDay = true; ps.forEach(p => p.v = 0); if (!checkWin()) go(4); });
}
