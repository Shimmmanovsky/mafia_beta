/**
 * UI MANAGER (Управление интерфейсом)
 * 
 * Полностью отделен от бизнес-логики (game-engine.js)
 * Слушает события от Game Engine и обновляет интерфейс
 * 
 * Основные методы:
 * - showScreen(screenName): показать экран
 * - renderPlayerList(): отрисовать список игроков
 * - renderNightPhase(): отрисовать ночную фазу
 * - renderDayPhase(): отрисовать дневную фазу
 */

const UIManager = {
    // ========== МОДАЛКИ И СООБЩЕНИЯ ==========

    /**
     * Показать модальное сообщение
     */
    showMessage(title, text, callback = null) {
        document.getElementById('next-role-hint').innerText = String(title);
        document.getElementById('msg-text').innerHTML = String(text);
        document.getElementById('msg-scr').style.display = 'flex';
        window.msgCallback = callback;
    },

    /**
     * Закрыть модальное сообщение
     */
    closeMessage() {
        document.getElementById('msg-scr').style.display = 'none';
        if (window.msgCallback) {
            const callback = window.msgCallback;
            window.msgCallback = null;
            callback();
        }
    },

    // ========== НАВИГАЦИЯ ПО ЭКРАНАМ ==========

    /**
     * Показать экран по номеру
     */
    showScreen(screenNum) {
        document.querySelectorAll('.s').forEach(x => x.classList.remove('a'));
        
        let id;
        if (screenNum === 1.5) {
            id = 's1_5';
        } else {
            id = 's' + screenNum;
        }

        const target = document.getElementById(id);
        if (target) {
            target.classList.add('a');
            window.scrollTo(0, 0);
            this.updateHeader(screenNum);
            
            // Триггеры рендеринга для конкретных экранов
            if (screenNum === 3) this.renderRoleDistribution();
            else if (screenNum === 4) this.renderGameScreen();
            else if (screenNum === 5) this.renderGameEnd();
            else this.renderMainScreens(screenNum);
        }
    },

    /**
     * Обновить заголовок
     */
    updateHeader(screenNum) {
        const titles = {
            1: `Живых душ: ${gameEngine.players.length}`,
            1.5: "Раздача карт",
            2: "Настройка состава",
            3: "Роли",
            4: gameEngine.isDay 
                ? (gameEngine.currentNight === 1 ? "Сбор улик" : `Эпизод ${gameEngine.currentNight}`)
                : `Ночь ${gameEngine.currentNight}`,
            5: "Итоги"
        };
        document.getElementById('main-title').innerText = titles[screenNum] || "";
    },

    // ========== ОСНОВНЫЕ ЭКРАНЫ (1-2) ==========

    renderMainScreens(screenNum) {
        if (screenNum === 1) {
            this.renderPlayerSetup();
        } else if (screenNum === 2) {
            this.renderRoleConfig();
        }
    },

    /**
     * Экран 1: Добавление игроков
     */
    renderPlayerSetup() {
        const l1 = document.getElementById('l1');
        if (!l1) return;

        l1.innerHTML = gameEngine.players.map((p, i) => `
            <div class="r">
                <b class="p-num">${i + 1}</b>
                <input 
                    value="${p.name}" 
                    oninput="gameEngine.renamePlayer(${i}, this.value); UIManager.renderPlayerSetup()" 
                    placeholder="Имя смертного...">
                <button class="del-btn" onclick="gameEngine.removePlayer(${i}); UIManager.renderPlayerSetup(); UIManager.updateHeader(1)">✕</button>
            </div>
        `).join('');
    },

    /**
     * Экран 2: Конфигурация ролей
     */
    renderRoleConfig() {
        const lp = document.getElementById('lp');
        if (!lp) return;

        lp.innerHTML = Object.keys(GAME_CONFIG.ROLES)
            .filter(r => r !== 'Citizen')  // Не показываем Гражданина
            .map(r => {
                const roleInfo = ConfigUtils.getRoleInfo(r);
                return `
                    <div class="r">
                        <span>${roleInfo.emoji} ${roleInfo.displayName}</span>
                        <div class="v-wrap">
                            <button class="v-btn" onclick="gameEngine.setRoleCount('${r}', Math.max(0, gameEngine.roleConfig['${r}'] - 1)); UIManager.renderRoleConfig()">-</button>
                            <div class="v-cnt">${gameEngine.roleConfig[r]}</div>
                            <button class="v-btn" onclick="gameEngine.setRoleCount('${r}', gameEngine.roleConfig['${r}'] + 1); UIManager.renderRoleConfig()">+</button>
                        </div>
                    </div>
                `;
            }).join('');

        const totalRoles = Object.values(gameEngine.roleConfig).reduce((a, b) => a + b, 0);
        const totalCitizens = Math.max(0, gameEngine.players.length - totalRoles);
        
        document.getElementById('totalC').innerText = gameEngine.players.length;
        document.getElementById('citC').innerText = totalCitizens;
    },

    // ========== РАСПРЕДЕЛЕНИЕ РОЛЕЙ (ЭКРАН 3) ==========

    /**
     * Экран 3: Распределение ролей
     */
    renderRoleDistribution() {
        const currentRole = gameEngine.activeNightRoles[gameEngine.currentNightRoleIndex];
        if (!currentRole) return;

        const roleInfo = ConfigUtils.getRoleInfo(currentRole);
        const count = gameEngine.players.filter(p => p.role === currentRole).length;

        document.getElementById('roleLimitInfo').innerHTML = `
            <h3>${roleInfo.emoji} ${roleInfo.displayName}</h3>
            <div class="role-count-badge">${count} из ${gameEngine.roleConfig[currentRole]}</div>
        `;

        document.getElementById('l3').innerHTML = gameEngine.players.map((p, i) => {
            const isSel = (p.role === currentRole);
            const isOther = (p.role !== 'Citizen' && p.role !== currentRole);
            
            return `
                <div class="r ${isSel ? 'sel-' + currentRole : ''} ${isOther ? 'isOut' : ''}" 
                     onclick="${isOther ? '' : `setRole(${i}, '${currentRole}')`}">
                    <b class="p-num">${i + 1}</b>
                    <div class="p-info"><span class="p-name">${p.name}</span></div>
                    ${p.role !== 'Citizen' 
                        ? `<span class="tag ${GAME_CONFIG.ROLES[p.role].cssClass} tag-right">${GAME_CONFIG.ROLES[p.role].displayName}</span>` 
                        : ''}
                </div>
            `;
        }).join('');
    },

    // ========== ИГРОВОЙ ЭКРАН (ЭКРАН 4) ==========

    /**
     * Экран 4: Основной игровой экран
     */
    renderGameScreen() {
        const nP = document.getElementById('nightStatusPanel');
        const l4 = document.getElementById('l4');
        const ctrl = document.getElementById('game-controls');
        const vS = document.getElementById('voteStat');

        if (!gameEngine.isDay) {
            // НОЧНАЯ ФАЗА
            const currentRole = gameEngine.getCurrentNightRole();
            if (!currentRole) {
                this.endNightPhase();
                return;
            }

            ctrl.style.display = 'flex';
            const roleInfo = ConfigUtils.getRoleInfo(currentRole);
            const prompt = ConfigUtils.getRandomPhrase('rolePrompts', null, { role: currentRole });
            
            nP.className = 'header-line-' + currentRole;
            nP.innerHTML = `<h3>${roleInfo.emoji} ${roleInfo.displayName}</h3><p>${prompt}</p>`;
            
            document.getElementById('cfB').innerText = 
                (gameEngine.currentNightRoleIndex === gameEngine.activeNightRoles.length - 1) 
                    ? "Завершить ночь" 
                    : "Далее";
            
            document.getElementById('cfB').style.display = (window.selId !== null) ? "flex" : "none";
            document.getElementById('skB').style.display = (window.selId === null) ? "flex" : "none";

            l4.innerHTML = gameEngine.players.map((p, i) => {
                let status = '';
                let canClick = true;
                let note = '';

                if (p.isEliminated) {
                    status = 'isOut';
                    canClick = false;
                }

                // Проверить ограничения роли
                if (currentRole === 'Doctor' && i === gameEngine.roleStates.Doctor?.lastTarget) {
                    note = '(Не подряд)';
                    status = 'locked';
                    canClick = false;
                }

                if (currentRole === 'Detective' && (gameEngine.roleStates.Detective?.checkedPlayers?.includes(i) || 
                    (p.role === 'Detective' && !p.isEliminated))) {
                    note = (p.role === 'Detective' ? 'Твое досье' : 'Изучен');
                    status = 'locked';
                    canClick = false;
                }

                return `
                    <div class="r ${status} ${window.selId === i ? 'sel-' + currentRole : ''}" 
                         onclick="${canClick ? `clickP(${i})` : ''}">
                        <b class="p-num">${i + 1}</b>
                        <div class="p-info"><span class="p-name">${p.name}</span></div>
                        <span class="tag ${GAME_CONFIG.ROLES[p.role].cssClass}">${GAME_CONFIG.ROLES[p.role].displayName}</span>
                        <small style="margin-left:5px; color:#8e8e93">${note}</small>
                    </div>
                `;
            }).join('');

        } else if (gameEngine.currentNight === 1) {
            // ПЕРВЫЙ ДЕНЬ - ПРЕДСТАВЛЕНИЕ
            ctrl.style.display = 'none';
            nP.className = '';
            nP.innerHTML = `<h3>Представление</h3><p>Пусть посмотрят друг другу в глаза...</p>`;
            
            l4.innerHTML = gameEngine.players.map((p, i) => `
                <div class="r">
                    <b class="p-num">${i + 1}</b>
                    <div class="p-info"><span class="p-name">${p.name}</span></div>
                    <span class="tag ${GAME_CONFIG.ROLES[p.role].cssClass} tag-right">${GAME_CONFIG.ROLES[p.role].displayName}</span>
                </div>
            `).join('') + 
            `<button class="btn b-b" style="margin-top:20px" onclick="startNight()">Погасить свет 🌙</button>`;

        } else {
            // ДНЕВНАЯ ФАЗА - ГОЛОСОВАНИЕ
            ctrl.style.display = 'flex';
            const tV = Object.values(gameEngine.dayVotes).reduce((a, b) => a + b, 0);
            const aC = gameEngine.getAlivePlayers().length;
            
            vS.innerText = `Приговоров: ${tV} / ${aC}`;
            nP.className = 'header-line-Day';
            nP.innerHTML = `<h3>Суд Линча</h3><p style="color:var(--accent-red); font-weight:bold">${gameEngine.morningReport}</p>`;
            
            document.getElementById('cfB').innerText = "Огласить приговор";
            document.getElementById('cfB').style.display = (tV > 0) ? "flex" : "none";
            document.getElementById('skB').style.display = (tV === 0 && gameEngine.tiedPlayers.length === 0) ? "flex" : "none";

            l4.innerHTML = gameEngine.players.map((p, i) => {
                let status = '';
                let votes = gameEngine.dayVotes[i] || 0;
                
                if (p.isEliminated || (gameEngine.tiedPlayers.length > 0 && !gameEngine.tiedPlayers.includes(i))) {
                    status = 'isOut';
                }

                return `
                    <div class="r ${status} ${votes > 0 ? 'sel-Day' : ''}">
                        <b class="p-num">${i + 1}</b>
                        <div class="p-info"><span class="p-name">${p.name}</span></div>
                        <span class="tag ${GAME_CONFIG.ROLES[p.role].cssClass} tag-right" style="margin-right:10px">${GAME_CONFIG.ROLES[p.role].displayName}</span>
                        <div class="v-wrap">
                            <button class="v-btn" onclick="gameEngine.vote(${i}, -1); UIManager.renderGameScreen()">-</button>
                            <div class="v-cnt">${votes}</div>
                            <button class="v-btn" onclick="gameEngine.vote(${i}, 1); UIManager.renderGameScreen()">+</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    // ========== ЗАВЕРШЕНИЕ ИГРЫ (ЭКРАН 5) ==========

    /**
     * Экран 5: Итоги игры
     */
    renderGameEnd() {
        const lastLog = gameEngine.getLog()[gameEngine.getLog().length - 1];
        const winText = lastLog ? lastLog.text : "Финал";
        
        document.getElementById('finalResultsPanel').innerHTML = 
            `<div class="welcome-card" style="border-color:#30d158; text-align:center"><h3>${winText}</h3></div>`;
        
        document.getElementById('finalLogList').innerHTML = gameEngine.getLog()
            .map(log => `<div class="log-item" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${log.text}</div>`)
            .join('');
    },

    // ========== ЛОГ ==========

    /**
     * Переключить видимость лога
     */
    toggleLog() {
        const el = document.getElementById('log-overlay');
        const list = document.getElementById('log-list');
        
        if (el.style.display === 'block') {
            el.style.display = 'none';
        } else {
            list.innerHTML = gameEngine.getLog()
                .map(log => `<div class="log-item" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05)">${log.text}</div>`)
                .join('');
            el.style.display = 'block';
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========

    endNightPhase() {
        gameEngine.processNight();
        const checkWin = gameEngine.endNight();
        
        if (checkWin.gameEnded) {
            UIManager.showMessage("Финал 🏆", checkWin.message, () => UIManager.showScreen(5));
        } else {
            UIManager.showMessage("Рассвет ☀️", gameEngine.morningReport, () => UIManager.showScreen(4));
        }
    }
};
