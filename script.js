const rOrder = ['Doctor', 'Mafia', 'Maniac', 'Detective'];
const rD = {
    Citizen: { n: 'Мирный', e: '😊', c: 'tag-Citizen', desc: 'Найдите преступников.' },
    Mafia: { n: 'Мафия', e: '👺', c: 'tag-Mafia', desc: 'Устраните мирных.' },
    Detective: { n: 'Комиссар', e: '🕵️‍♂️', c: 'tag-Detective', desc: 'Проверяет статус игрока.' },
    Doctor: { n: 'Доктор', e: '💊', c: 'tag-Doctor', desc: 'Спасает одного игрока.' },
    Maniac: { n: 'Маньяк', e: '🔪', c: 'tag-Maniac', desc: 'Играет за себя.' }
};

let ps = [], rs = { Mafia: 1, Maniac: 0, Detective: 1, Doctor: 1 }, 
    activeRs = [], activeNRs = [], curRi = 0, curNi = 0, night = 0, 
    acts = {}, selId = null, isDay = false, tiePs = [], 
    msgCallback = null, lastDocId = null, checkedIds = [], gameLog = [];

window.onload = () => { 
    updateHeader(1); 
    render(); 
};

function confirmReset() { 
    if (confirm("Сбросить игру?")) location.reload(); 
}

function showMsg(t, txt, cb) { 
    document.getElementById('next-role-hint').innerText = String(t); 
    document.getElementById('msg-text').innerHTML = String(txt); 
    document.getElementById('msg-scr').style.display = 'flex'; 
    msgCallback = cb; 
}

function closeMsg() { 
    document.getElementById('msg-scr').style.display = 'none'; 
    if (msgCallback) { 
        const t = msgCallback; 
        msgCallback = null; 
        t(); 
    }
}

function toggleLog() {
    const el = document.getElementById('log-overlay'), list = document.getElementById('log-list');
    if (el.style.display === 'block') {
        el.style.display = 'none';
    } else {
        list.innerHTML = gameLog.map(i => `<div class="log-item">${i.text}</div>`).join('');
        el.style.display = 'block';
    }
}

function addL(text) { 
    gameLog.push({ text: String(text) }); 
}

function getPN(idx) { 
    return (ps[idx] && ps[idx].n) ? ps[idx].n : `Игрок №${idx + 1}`; 
}

function go(n) { 
    document.querySelectorAll('.s').forEach(x => x.classList.remove('a')); 
    let id = (n === 1.5) ? 's1_5' : 's' + n;
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('a'); 
        window.scrollTo(0, 0); 
        updateHeader(n);
        if (n === 3) renderS3(); 
        else if (n === 4) renderGame(); 
        else if (n === 5) showWinUI();
        else render();
    }
}

function updateHeader(n) {
    let title = "";
    if (n === 1) title = "Игроков: " + ps.length;
    else if (n === 1.5) title = "Инструкция";
    else if (n === 2) title = "Настройка";
    else if (n === 3) title = "Раздача";
    else if (n === 4) title = isDay ? (night === 1 ? "Знакомство" : "День " + night) : "Ночь " + night;
    else title = "Итоги";
    document.getElementById('main-title').innerText = title;
}

function addP() { 
    ps.push({ n: '', r: 'Citizen', out: false, v: 0 }); 
    render(); 
    updateHeader(1); 
}

function delP(i) { 
    ps.splice(i, 1); 
    render(); 
    updateHeader(1); 
}

function render() {
    const l1 = document.getElementById('l1'), lp = document.getElementById('lp');
    if (l1 && document.getElementById('s1').classList.contains('a')) {
        l1.innerHTML = ps.map((p, i) => 
            `<div class="r">
                <span class="p-num">${i+1}</span>
                <input value="${p.n}" oninput="ps[${i}].n=this.value" placeholder="Имя игрока...">
                <button class="del-btn" onclick="delP(${i})">✕</button>
            </div>`
        ).join('');
    }
    if (lp && document.getElementById('s2').classList.contains('a')) {
        lp.innerHTML = Object.keys(rs).map(r => 
            `<div class="r">
                <span style="font-size:18px;margin-right:12px">${rD[r].e}</span>
                ${rD[r].n}
                <div class="v-wrap">
                    <button class="v-btn" onclick="rs['${r}']=Math.max(0,rs['${r}']-1);render();">-</button>
                    <div class="v-cnt">${rs[r]}</div>
                    <button class="v-btn" onclick="rs['${r}']++;render();">+</button>
                </div>
            </div>`
        ).join('');
        document.getElementById('totalC').innerText = ps.length; 
        document.getElementById('citC').innerText = Math.max(0, ps.length - Object.values(rs).reduce((a, b) => a + b, 0));
    }
}

function checkR() { 
    if (Object.values(rs).reduce((a,b)=>a+b,0) >= ps.length) { 
        alert("Слишком много ролей!"); 
        return; 
    }
    curRi = 0; 
    ps.forEach(p => { p.r = 'Citizen'; p.out = false; p.v = 0; }); 
    activeRs = rOrder.filter(r => rs[r] > 0); 
    showMsg("Ночь знакомства", "Ведущий: «Город засыпает». Отмечайте роли.", () => go(3));
}

function renderS3() {
    let r = activeRs[curRi]; 
    if(!r) return;
    let count = ps.filter(p => p.r === r).length;
    document.getElementById('roleLimitInfo').innerHTML = 
        `<div class="role-header-card">
            <h3>${rD[r].e} ${rD[r].n}</h3>
            <div class="role-count-badge">${count} из ${rs[r]}</div>
        </div>`;
    document.getElementById('l3').innerHTML = ps.map((p, i) => {
        let isSel = (p.r === r), isOther = (p.r !== 'Citizen' && p.r !== r);
        let cls = isSel ? 'sel' : (isOther ? 'isOut' : '');
        let onclick = isOther ? '' : `onclick="setRole(${i},'${r}')"; cursor:pointer`;
        return `<div class="r ${cls}" ${onclick}>
            <span class="p-num">${i+1}</span>
            <div class="p-info">
                <span class="p-name">${p.n||'Игрок '+(i+1)}</span>
            </div>
            ${p.r!=='Citizen' ? `<span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>` : ''}
        </div>`;
    }).join('');
}

function setRole(i, r) { 
    if (ps[i].r === r) {
        ps[i].r = 'Citizen';
    } else if (ps[i].r === 'Citizen') {
        if (rs[r] === 1) ps.forEach(p => { if(p.r === r) p.r = 'Citizen'; });
        if (ps.filter(p => p.r === r).length < rs[r]) ps[i].r = r;
    }
    renderS3(); 
}

function nextRS() { 
    if (ps.filter(p => p.r === activeRs[curRi]).length === rs[activeRs[curRi]]) { 
        curRi++; 
        if (curRi >= activeRs.length) startFirstDay(); 
        else renderS3(); 
    } else { 
        alert("Выберите всех игроков для роли"); 
    }
}

function startFirstDay() {
    isDay = true; 
    night = 1; 
    addL(`--- ДЕНЬ 1: Знакомство ---`); 
    go(4); 
}

function startNight() { 
    isDay = false; 
    curNi = 0; 
    acts = {}; 
    selId = null; 
    tiePs = []; 
    activeNRs = rOrder.filter(r => rs[r] > 0 && ps.some(p => p.r === r && !p.out)); 
    addL(`--- НОЧЬ ${night} ---`); 
    go(4); 
}

function renderGame() {
    updateHeader(4); 
    const vS = document.getElementById('voteStat'), nP = document.getElementById('nightStatusPanel'), 
          l4 = document.getElementById('l4'), ctrl = document.getElementById('game-controls');
    
    if (!isDay) {
        let cR = activeNRs[curNi]; 
        if(!cR) { endNight(); return; }
        
        ctrl.style.display = 'flex';
        nP.innerHTML = `<div class="role-header-card">
            <h3>${rD[cR].e} ${rD[cR].n}</h3>
            <div class="role-count-badge">${rD[cR].desc}</div>
        </div>`;
        document.getElementById('cfB').innerText = (curNi === activeNRs.length - 1) ? "Завершить ночь" : "Далее";
        document.getElementById('cfB').style.display = (selId !== null) ? "block" : "none";
        document.getElementById('skB').style.display = (selId === null) ? "block" : "none";
        
        l4.innerHTML = ps.map((p, i) => {
            let ex = '', st = '', cl = true;
            if (p.out) { st = 'isOut'; cl = false; }
            if (cR === 'Doctor' && i === lastDocId) { ex = '(Не подряд)'; st = 'locked'; cl = false; }
            if (cR === 'Detective' && (checkedIds.includes(i) || (p.r === 'Detective' && !p.out))) { 
                ex = (p.r === 'Detective' ? 'Вы' : 'Проверен'); st = 'locked'; cl = false; 
            }
            let selClass = selId === i ? 'sel' : '';
            let onclick = cl ? `onclick="clickP(${i})"` : '';
            return `<div class="r ${st} ${selClass}" ${onclick}>
                <span class="p-num">${i+1}</span>
                <div class="p-info">
                    <span class="p-name">${p.n||'Игрок '+(i+1)}</span>
                </div>
                <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>
                ${ex ? `<small style="color:#8e8e93;margin-left:8px">${ex}</small>` : ''}
            </div>`;
        }).join('');
    } else if (night === 1) {
        ctrl.style.display = 'none';
        nP.innerHTML = '<div class="role-header-card"><h3>День знакомства</h3></div>';
        l4.innerHTML = ps.map((p, i) => 
            `<div class="r">
                <span class="p-num">${i+1}</span>
                <div class="p-info">
                    <span class="p-name">${getPN(i)}</span>
                </div>
                <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>
            </div>`
        ).join('') + 
        `<button class="btn b-b" style="margin-top:24px;width:100%" onclick="night++; startNight()">Начать боевую ночь</button>`;
    } else {
        ctrl.style.display = 'flex';
        let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length;
        vS.innerText = `Голосов: ${tV} / ${aC}`;
        nP.innerHTML = "";
        document.getElementById('cfB').innerText = "Итоги дня";
        document.getElementById('cfB').style.display = (tV > 0) ? "block" : "none";
        document.getElementById('skB').style.display = (tV === 0 && tiePs.length === 0) ? "block" : "none"; 
        
        l4.innerHTML = ps.map((p, i) => {
            let st = (p.out || (tiePs.length > 0 && !tiePs.includes(i))) ? 'isOut' : '';
            return `<div class="r ${st}">
                <span class="p-num">${i+1}</span>
                <div class="p-info">
                    <span class="p-name">${getPN(i)}</span>
                </div>
                <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span>
                <div class="v-wrap">
                    <button class="v-btn" onclick="vote(${i},-1)">-</button>
                    <div class="v-cnt">${p.v}</div>
                    <button class="v-btn" onclick="vote(${i},1)">+</button>
                </div>
            </div>`;
        }).join('');
    }
}

function clickP(i) { 
    selId = (selId === i) ? null : i; 
    renderGame(); 
}

function vote(i, v) { 
    let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length; 
    if (v > 0 && tV < aC) ps[i].v++; 
    if (v < 0 && ps[i].v > 0) ps[i].v--; 
    renderGame(); 
}

function doAction(id) {
    if (isDay) {
        let cand = ps.filter((p, idx) => !p.out && (tiePs.length === 0 || tiePs.includes(idx)));
        let maxV = Math.max(...cand.map(p => p.v)), leaders = cand.filter(p => p.v === maxV);
        if (maxV === 0) { 
            showMsg("День окончен", "Никто не уходит.", () => { night++; startNight(); }); 
            return; 
        }
        if (leaders.length === 1) { 
            let vic = leaders[0]; 
            vic.out = true; 
            addL(`Покинул город: ${getPN(ps.indexOf(vic))}`);
            showMsg("Итоги дня", `Жители выгнали ${getPN(ps.indexOf(vic))}.`, () => { 
                if (!checkWin()) { night++; startNight(); } 
            });
        } else { 
            if (tiePs.length > 0) { 
                addL(`Вторая ничья: Никто не уходит.`); 
                showMsg("Ничья", "Город засыпает.", () => { night++; startNight(); }); 
            } else { 
                tiePs = leaders.map(p => ps.indexOf(p)); 
                ps.forEach(p => p.v = 0); 
                showMsg("Ничья!", "Переголосование.", () => renderGame()); 
            } 
        }
    } else {
        acts[activeNRs[curNi]] = id; 
        curNi++; 
        selId = null;
        if (curNi >= activeNRs.length) endNight(); 
        else renderGame();
    }
}

function endNight() {
    let savedId = acts['Doctor'], targets = []; 
    lastDocId = savedId;
    
    if (savedId !== null) addL(`Доктор лечил: ${getPN(savedId)}`);
    
    ['Mafia', 'Maniac'].forEach(r => {
        let t = acts[r];
        if (t !== null && t !== undefined) {
            addL(`${rD[r].e} ${rD[r].n} стрелял в: ${getPN(t)}`);
            if (t !== savedId) targets.push(t);
        }
    });
    
    let det = acts['Detective'];
    if (det !== null && det !== undefined) {
        let evil = (ps[det].r === 'Mafia' || ps[det].r === 'Maniac');
        addL(`Комиссар проверил ${getPN(det)}: ${evil?'ЧЕРНЫЙ':'КРАСНЫЙ'}`);
        if (!checkedIds.includes(det)) checkedIds.push(det);
    }
    
    let killed = [...new Set(targets)];
    killed.forEach(idx => ps[idx].out = true);
    let mText = killed.length ? "Погибли: " + killed.map(idx => getPN(idx)).join(", ") : "Ночь без жертв.";
    addL(`УТРО ${night}: ${mText}`);
    
    isDay = true; 
    ps.forEach(p => p.v = 0); 
    tiePs = [];
    if (!checkWin()) showMsg("Утро наступило", mText, () => go(4));
}

function checkWin() {
    let alive = ps.filter(p => !p.out), 
        m = alive.filter(p => p.r === 'Mafia').length, 
        mn = alive.filter(p => p.r === 'Maniac').length, 
        c = alive.length - m - mn;
    if (m > 0 && m >= (c + mn)) { 
        showWin("Победа Мафии!"); 
        return true; 
    }
    if (mn > 0 && alive.length <= 2 && m === 0) { 
        showWin("Победа Маньяка!"); 
        return true; 
    }
    if (m === 0 && mn === 0) { 
        showWin("Победа Города!"); 
        return true; 
    }
    return false;
}

function showWin(t) { 
    addL(`${t}`); 
    go(5); 
}

function showWinUI() {
    const winT = gameLog[gameLog.length-1].text;
    document.getElementById('finalResultsPanel').innerHTML = 
        `<div class="role-header-card" style="border-color:#30d158">
            <h3>${winT}</h3>
        </div>`;
    document.getElementById('finalLogList').innerHTML = gameLog.map(i => `<div class="log-item">${i.text}</div>`).join('');
}
