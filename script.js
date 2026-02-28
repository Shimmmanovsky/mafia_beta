const PHRASES = {
    // Разделяем начало ночи по темпераменту ролей
    nightStart: {
        peaceful: [
            "Пока город спит, {role} заступает на дежурство. 🚑",
            "Закон не спит. На сцену выходит {role}. ⚖️",
            "Тихий час объявлен. Просыпается {role}. 💤",
            "Жизнь висит на волоске. {role}, время действовать. 🕯️",
            "Кто-то сегодня получит второй шанс. Твой ход, {role}. ✨",
            "В этом квартале сегодня будет спокойно. Или нет? {role}, работай. 🛡️"
        ],
        aggressive: [
            "Тьма сгущается. На охоту выходит {role}. 🌙",
            "Город замер. На темные улицы выходит {role}. 👺",
            "Время затыкать рты. Просыпается {role}. 🤐",
            "Тихий час окончен. {role}, ваш выход. 🔫",
            "Кто-то сегодня не доживет до утра. {role}, выбирай. 🌑",
            "В городском морге подготовили лучшие места. Ждем твоего решения, {role}. ⚰️",
            "Адвокаты не помогут. На сцене — {role}. ⛓️",
            "Шоу начинается. {role}, покажи класс. 🎭"
        ]
    },
    prompts: {
        'Doctor': [
            "Кого сегодня вытащим с того света? 💉",
            "Кому сегодня продлим мучения? 🩹",
            "На чье спасение потратим последнюю аптечку? 🩹",
            "В чьем свидетельстве о смерти сегодня поставим прочерк? 📝",
            "Кого сегодня не пустим на встречу с предками? 👼",
            "Кто сегодня станет чудом медицины? ✨"
        ],
        'Mafia': [
            "Укажите на того, кто не увидит рассвет. 👺",
            "Вынесите смертный приговор. 🔫",
            "Чье имя сегодня вычеркнем из списка живых? 📝",
            "Кто сегодня станет донором для цемента? 🏗️",
            "Кому сегодня заказано такси в один конец? 🚕",
            "Чья голова сегодня окажется лишней на плечах? 🪓"
        ],
        'Maniac': [
            "Кто сегодня станет донором органов? 🔪",
            "Выбери того, кто лишний в этом списке. 🩸",
            "Чья очередь украсить подворотню? ☠️",
            "В чьей квартире сегодня будет слишком тихо? 🤫",
            "Кто сегодня встретит свою судьбу в темном переулке? 🌃"
        ],
        'Detective': [
            "Чье грязное досье сегодня изучим? 🔍",
            "На ком сегодня пахнет порохом и ложью? 🕵️‍♂️",
            "Кто выглядит слишком подозрительно для этого города? ⚖️",
            "Ищем крысу... на кого падает подозрение? 🕵️‍♂️",
            "Кому сегодня устроим допрос с пристрастием? 💡"
        ]
    },
    confirmSkip: [
        "Ход роли {role} будет пропущен. Продолжить? 💤",
        "У роли {role} на эту ночь нет планов. Подтверждаешь? 🏥",
        "Действие ({role}) не выбрано. Оставить всё как есть? 🌑",
        "Похоже, {role} сегодня в режиме созерцания. Продолжаем?"
    ],
    morningKilled: [
        "Результат ночи: {name} — вне игры. ⚰️",
        "Список потерь этого утра: {name}. Какая досада.",
        "Утро началось не для всех. Покидают стол: {name}.",
        "Протокол осмотра места событий: {name} больше не с нами. 🐛"
    ],
    morningSafe: [
        "Удивительно, но этой ночью все проснулись живыми. Мафия стареет? 😴",
        "Матрасы целы, головы на месте. Ночь прошла без огонька. ✨",
        "Ни одного трупа? Ведущему скучно, а городу повезло. 🍀"
    ],
    dayExile: [
        "Общественное мнение против {name}. Подтвердить изгнание? ⚖️",
        "Решение толпы: исключить {name} из списка живых?",
        "Приговор для {name}: привести в исполнение? 🪓",
        "Голоса подсчитаны. Сказать {name} 'прощай'? 👋"
    ],
    winMafia: [
        "Закон мертв. Мафия теперь — это и есть закон. 🥂",
        "Город пал. Мафия пьет шампанское на руинах порядка. 👺"
    ],
    winCitizen: [
        "Зло повержено... до следующей партии. Выжившие, расходитесь. 😊",
        "Город очищен от заразы. Мирные могут спать спокойно. 🏛️"
    ],
    winManiac: [
        "В живых остался только один. Кровавое шоу окончено. 🩸",
        "Одинокий хищник съел всех. Занавес. 🔪"
    ]
};

function getRnd(key, subKey = null, data = {}) {
    let list;

    // 1. Определяем базовый список фраз
    if (key === 'nightStart' && data.roleType) {
        list = PHRASES.nightStart[data.roleType];
    } else {
        list = subKey ? PHRASES[key]?.[subKey] : PHRASES[key];
    }

    // 2. Проверка на случай ошибки в ключах (fallback)
    if (!list || !list.length) {
        console.warn(`Phrases not found for: ${key}${subKey ? '.' + subKey : ''}`);
        return ""; 
    }

    // 3. Выбор случайной фразы
    let str = list[Math.floor(Math.random() * list.length)];

    // 4. Подстановка данных (используем replaceAll для надежности)
    for (let k in data) {
        str = str.replaceAll(`{${k}}`, data[k]);
    }

    return str;
}


const rOrder = ['Doctor', 'Mafia', 'Maniac', 'Detective'];
const rD = {
    Citizen: { n: 'Мирный', e: '😊', c: 'tag-Citizen' },
    Mafia: { n: 'Мафия', e: '👺', c: 'tag-Mafia' },
    Detective: { n: 'Комиссар', e: '🕵️‍♂️', c: 'tag-Detective' },
    Doctor: { n: 'Доктор', e: '💊', c: 'tag-Doctor' },
    Maniac: { n: 'Маньяк', e: '🔪', c: 'tag-Maniac' }
};

let ps = [], rs = { Mafia: 1, Maniac: 0, Detective: 1, Doctor: 1 }, 
    activeRs = [], activeNRs = [], curRi = 0, curNi = 0, night = 0, 
    acts = {}, selId = null, isDay = false, tiePs = [], 
    msgCallback = null, lastDocId = null, checkedIds = [], gameLog = [],
    morningReport = "";

window.onload = () => { updateHeader(1); render(); };

function confirmReset() { if (confirm("Замести следы и начать заново? 🧹")) location.reload(); }

function showMsg(t, txt, cb) {
    document.getElementById('next-role-hint').innerText = String(t);
    document.getElementById('msg-text').innerHTML = String(txt);
    document.getElementById('msg-scr').style.display = 'flex';
    msgCallback = cb;
}

function closeMsg() {
    document.getElementById('msg-scr').style.display = 'none';
    if (msgCallback) { const t = msgCallback; msgCallback = null; t(); }
}

function toggleLog() {
    const el = document.getElementById('log-overlay'), list = document.getElementById('log-list');
    if (el.style.display === 'block') el.style.display = 'none';
    else {
        list.innerHTML = gameLog.map(i => `<div class="log-item" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${i.text}</div>`).join('');
        el.style.display = 'block';
    }
}

function addL(text) { gameLog.push({ text: String(text) }); }
function getPN(idx) { return (ps[idx] && ps[idx].n) ? ps[idx].n : `Игрок №${idx + 1}`; }

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
    if (n === 1) title = "Живых душ: " + ps.length;
    else if (n === 1.5) title = "Раздача карт";
    else if (n === 2) title = "Настройка состава";
    else if (n === 3) title = "Роли";
    else if (n === 4) title = isDay ? (night === 1 ? "Сбор улик" : "Эпизод " + night) : "Ночь " + night;
    else title = "Итоги";
    document.getElementById('main-title').innerText = title;
}

function addP() { ps.push({ n: '', r: 'Citizen', out: false, v: 0 }); render(); updateHeader(1); }
function delP(i) { ps.splice(i, 1); render(); updateHeader(1); }

function render() {
    const l1 = document.getElementById('l1'), lp = document.getElementById('lp');
    if (l1 && document.getElementById('s1').classList.contains('a')) {
        l1.innerHTML = ps.map((p, i) => `<div class="r"><b class="p-num">${i+1}</b><input value="${p.n}" oninput="ps[${i}].n=this.value" placeholder="Имя смертного..."><button class="del-btn" onclick="delP(${i})">✕</button></div>`).join('');
    }
    if (lp && document.getElementById('s2').classList.contains('a')) {
        lp.innerHTML = Object.keys(rs).map(r => `<div class="r"><span>${rD[r].e} ${rD[r].n}</span><div class="v-wrap"><button class="v-btn" onclick="rs['${r}']=Math.max(0,rs['${r}']-1);render()">-</button><div class="v-cnt">${rs[r]}</div><button class="v-btn" onclick="rs['${r}']++;render()">+</button></div></div>`).join('');
        document.getElementById('totalC').innerText = ps.length;
        document.getElementById('citC').innerText = Math.max(0, ps.length - Object.values(rs).reduce((a, b) => a + b, 0));
    }
}
function checkR() {
    if (Object.values(rs).reduce((a,b)=>a+b,0) >= ps.length) { alert("Слишком много ролей для такого маленького города! ⚰️"); return; }
    curRi = 0; ps.forEach(p => { p.r = 'Citizen'; p.out = false; p.v = 0; });
    activeRs = rOrder.filter(r => rs[r] > 0);
    // Определяем тип первой роли для подбора фразы
    let type = (activeRs[0] === 'Doctor' || activeRs[0] === 'Detective') ? 'peaceful' : 'aggressive';
    let msg = getRnd('nightStart', null, {role: '<b>' + rD[activeRs[0]].n + '</b>', roleType: type});
    showMsg("Время знакомиться 🌙", msg, () => go(3));
}

function renderS3() {
    let r = activeRs[curRi]; if(!r) return;
    let count = ps.filter(p => p.r === r).length;
    document.getElementById('roleLimitInfo').innerHTML = `<h3>${rD[r].e} ${rD[r].n}</h3><div class="role-count-badge">${count} из ${rs[r]}</div>`;
    document.getElementById('l3').innerHTML = ps.map((p, i) => {
        let isSel = (p.r === r), isOther = (p.r !== 'Citizen' && p.r !== r);
        return `<div class="r ${isSel ? 'sel-' + r : ''} ${isOther ? 'isOut' : ''}" onclick="${isOther ? '' : `setRole(${i},'${r}')`}">
            <b class="p-num">${i+1}</b><div class="p-info"><span class="p-name">${p.n||'Игрок '+(i+1)}</span></div>
            ${p.r!=='Citizen' ? `<span class="tag ${rD[p.r].c} tag-right">${rD[p.r].n}</span>` : ''}
        </div>`;
    }).join('');
}

function setRole(i, r) {
    if (ps[i].r === r) ps[i].r = 'Citizen';
    else if (ps[i].r === 'Citizen') {
        if (rs[r] === 1) ps.forEach(p => { if(p.r === r) p.r = 'Citizen'; });
        if (ps.filter(p => p.r === r).length < rs[r]) ps[i].r = r;
    }
    renderS3();
}

function nextRS() {
    let currentRole = activeRs[curRi];
    if (ps.filter(p => p.r === currentRole).length === rs[currentRole]) {
        curRi++;
        if (curRi >= activeRs.length) {
            showMsg("Протокол заполнен ✅", "Карты розданы. Пусть город встретит свой первый рассвет.", () => startFirstDay());
        } else {
            let nextRole = activeRs[curRi];
            let type = (nextRole === 'Doctor' || nextRole === 'Detective') ? 'peaceful' : 'aggressive';
            let msg = getRnd('nightStart', null, {role: '<b>' + rD[nextRole].n + '</b>', roleType: type});
            showMsg(`${rD[currentRole].n} засыпает 💤`, msg, () => renderS3());
        }
    } else { alert(`Назначь всех ${rD[currentRole].n}. Никто не должен остаться без судьбы!`); }
}

function startFirstDay() { 
    isDay = true; night = 1; morningReport = "Город проснулся. Пока все целы. Пока...";
    addL(`<span class="log-day">--- ЭПИЗОД 1: Знакомство ---</span>`); go(4); 
}

function startNight() {
    isDay = false; curNi = 0; acts = {}; selId = null; tiePs = [];
    document.getElementById('voteStat').innerText = ""; 
    document.getElementById('nightStatusPanel').className = '';
    activeNRs = rOrder.filter(r => rs[r] > 0 && ps.some(p => p.r === r && !p.out));
    addL(`<span class="log-night">--- НОЧЬ ${night} ---</span>`);
    let firstRole = activeNRs[0];
    let type = (firstRole === 'Doctor' || firstRole === 'Detective') ? 'peaceful' : 'aggressive';
    let msg = getRnd('nightStart', null, {role: '<b>' + rD[firstRole].n + '</b>', roleType: type});
    showMsg(`Ночь ${night} 🌙`, msg, () => go(4));
}

function renderGame() {
    updateHeader(4);
    const nP = document.getElementById('nightStatusPanel'), l4 = document.getElementById('l4'), ctrl = document.getElementById('game-controls'), vS = document.getElementById('voteStat');
    if (!isDay) {
        let cR = activeNRs[curNi]; if(!cR) { endNight(); return; }
        ctrl.style.display = 'flex';
        const prompt = getRnd('prompts', cR);
        nP.className = 'header-line-' + cR;
        nP.innerHTML = `<h3>${rD[cR].e} ${rD[cR].n}</h3><p>${prompt}</p>`;
        document.getElementById('cfB').innerText = (curNi === activeNRs.length - 1) ? "Завершить ночь" : "Далее";
        document.getElementById('cfB').style.display = (selId !== null) ? "flex" : "none";
        document.getElementById('skB').style.display = (selId === null) ? "flex" : "none";
        l4.innerHTML = ps.map((p, i) => {
            let ex = '', st = '', cl = true;
            if (p.out) { st = 'isOut'; cl = false; }
            if (cR === 'Doctor' && i === lastDocId) { ex = '(Не подряд)'; st = 'locked'; cl = false; }
            if (cR === 'Detective' && (checkedIds.includes(i) || (p.r === 'Detective' && !p.out))) { ex = (p.r === 'Detective' ? 'Твое досье' : 'Изучен'); st = 'locked'; cl = false; }
            return `<div class="r ${st} ${selId === i ? 'sel-' + cR : ''}" onclick="${cl ? `clickP(${i})` : ''}">
                <b class="p-num">${i+1}</b><div class="p-info"><span class="p-name">${p.n||'Игрок '+(i+1)}</span></div>
                <span class="tag ${rD[p.r].c}">${rD[p.r].n}</span><small style="margin-left:5px; color:#8e8e93">${ex}</small>
            </div>`;
        }).join('');
    } else if (night === 1) {
        ctrl.style.display = 'none'; nP.className = '';
        nP.innerHTML = `<h3>Представление</h3><p>Пусть посмотрят друг другу в глаза...</p>`;
        l4.innerHTML = ps.map((p, i) => `<div class="r"><b class="p-num">${i+1}</b><div class="p-info"><span class="p-name">${getPN(i)}</span></div><span class="tag ${rD[p.r].c} tag-right">${rD[p.r].n}</span></div>`).join('') + `<button class="btn b-b" style="margin-top:20px" onclick="night++; startNight()">Погасить свет 🌙</button>`;
    } else {
        ctrl.style.display = 'flex';
        let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length;
        vS.innerText = `Приговоров: ${tV} / ${aC}`; 
        nP.className = 'header-line-Day'; 
        nP.innerHTML = `<h3>Суд Линча</h3><p style="color:var(--accent-red); font-weight:bold">${morningReport}</p>`;
        document.getElementById('cfB').innerText = "Огласить приговор";
        document.getElementById('cfB').style.display = (tV > 0) ? "flex" : "none";
        document.getElementById('skB').style.display = (tV === 0 && tiePs.length === 0) ? "flex" : "none";
        l4.innerHTML = ps.map((p, i) => {
            let st = (p.out || (tiePs.length > 0 && !tiePs.includes(i))) ? 'isOut' : '';
            return `<div class="r ${st} ${p.v > 0 ? 'sel-Day' : ''}"><b class="p-num">${i+1}</b><div class="p-info"><span class="p-name">${getPN(i)}</span></div><span class="tag ${rD[p.r].c} tag-right" style="margin-right:10px">${rD[p.r].n}</span><div class="v-wrap"><button class="v-btn" onclick="vote(${i},-1)">-</button><div class="v-cnt">${p.v}</div><button class="v-btn" onclick="vote(${i},1)">+</button></div></div>`;
        }).join('');
    }
}

function clickP(i) { selId = (selId === i) ? null : i; renderGame(); }
function vote(i, v) {
    let tV = ps.reduce((s, p) => s + p.v, 0), aC = ps.filter(p => !p.out).length;
    if (v > 0 && tV < aC) ps[i].v++; if (v < 0 && ps[i].v > 0) ps[i].v--; renderGame();
}

function doAction(id) {
    if (isDay) {
        let cand = ps.filter((p, idx) => !p.out && (tiePs.length === 0 || tiePs.includes(idx)));
        let maxV = Math.max(...cand.map(p => p.v)), leaders = cand.filter(p => p.v === maxV);
        if (maxV === 0) { if (confirm("Никто не набрал голосов. Оставим их в живых до завтра?")) { showMsg("День окончен", "Палач уходит ни с чем.", () => { night++; startNight(); }); } return; }
        if (leaders.length === 1) {
            let vic = leaders[0];
            let msg = getRnd('dayExile', null, {name: `<b>${getPN(ps.indexOf(vic))}</b>`});
            if (confirm(msg.replace(/<b>|<\/b>/g, ''))) {
                vic.out = true;
                addL(`⚖️ Покинул город: <b>${getPN(ps.indexOf(vic))}</b>`);
                showMsg("Итоги дня", `Город избавился от <b>${getPN(ps.indexOf(vic))}</b>.`, () => { if (!checkWin()) { night++; startNight(); } });
            }
        } else {
            if (tiePs.length > 0) { addL(`⚖️ Вторая ничья: Смерть сегодня отдыхает.`); showMsg("Ничья", "Город в замешательстве. Все спят.", () => { night++; startNight(); }); }
            else { tiePs = leaders.map(p => ps.indexOf(p)); ps.forEach(p => p.v = 0); showMsg("Ничья!", "Переголосование. Выберите жертву из равных.", () => renderGame()); }
        }
    } else {
        if (id === null) {
            let skipMsg = getRnd('confirmSkip', null, {role: rD[activeNRs[curNi]].n});
            if (!confirm(skipMsg)) return;
        }
        acts[activeNRs[curNi]] = id;
        let cR = activeNRs[curNi];
        curNi++; selId = null;
        if (curNi >= activeNRs.length) { showMsg(`${rD[cR].n} засыпает 💤`, "Кровавая жатва окончена. Город просыпается...", () => endNight()); }
        else { 
            let nR = activeNRs[curNi]; 
            let type = (nR === 'Doctor' || nR === 'Detective') ? 'peaceful' : 'aggressive';
            let nextMsg = getRnd('nightStart', null, {role: '<b>' + rD[nR].n + '</b>', roleType: type});
            showMsg(`${rD[cR].n} засыпает 💤`, nextMsg, () => renderGame()); 
        }
    }
}

function endNight() {
    let savedId = acts['Doctor'], targets = []; lastDocId = savedId;
    if (savedId !== null) addL(`💊 Доктор возился с: <b>${getPN(savedId)}</b>`);
    ['Mafia', 'Maniac'].forEach(r => {
        let t = acts[r]; if (t !== null && t !== undefined) {
            addL(`${rD[r].e} ${rD[r].n} целился в: <b>${getPN(t)}</b>`);
            if (t !== savedId) targets.push(t);
        }
    });
    let det = acts['Detective'];
    if (det !== null && det !== undefined) {
        let evil = (ps[det].r === 'Mafia' || ps[det].r === 'Maniac');
        addL(`🔍 Комиссар изучал <b>${getPN(det)}</b>: ${evil?'МАФИЯ 👺':'ЧИСТ 😊'}`);
        if (!checkedIds.includes(det)) checkedIds.push(det);
    }
    let killed = [...new Set(targets)];
    killed.forEach(idx => ps[idx].out = true);
    let namesList = killed.map(idx => `<b>${getPN(idx)}</b>`).join(", ");
    morningReport = killed.length ? getRnd('morningKilled', null, {name: namesList}) : getRnd('morningSafe');
    addL(`<span class="log-day">УТРО ${night}: ${morningReport}</span>`);
    isDay = true; ps.forEach(p => p.v = 0); tiePs = [];
    if (!checkWin()) showMsg("Рассвет ☀️", morningReport, () => go(4));
}

function checkWin() {
    let alive = ps.filter(p => !p.out), m = alive.filter(p => p.r === 'Mafia').length, mn = alive.filter(p => p.r === 'Maniac').length, c = alive.length - m - mn;
    if (m > 0 && m >= (c + mn)) { showWin(getRnd('winMafia')); return true; }
    if (mn > 0 && alive.length <= 2 && m === 0) { showWin(getRnd('winManiac')); return true; }
    if (m === 0 && mn === 0) { showWin(getRnd('winCitizen')); return true; }
    return false;
}

function showWin(t) { addL(`🏆 <b>${t}</b>`); go(5); }

function showWinUI() {
    const lastLog = gameLog[gameLog.length-1];
    const winT = lastLog ? lastLog.text : "Финал";
    document.getElementById('finalResultsPanel').innerHTML = `<div class="welcome-card" style="border-color:#30d158; text-align:center"><h3>${winT}</h3></div>`;
    document.getElementById('finalLogList').innerHTML = gameLog.map(i => `<div class="log-item" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${i.text}</div>`).join('');
}
