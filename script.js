/**
 * MAIN SCRIPT - Инициализация и управление потоком игры
 * 
 * Этот файл:
 * 1. Инициализирует компоненты при загрузке
 * 2. Управляет основным потоком игры
 * 3. Содержит function callbacks для HTML элементов
 * 
 * Архитектура:
 * - config.js: конфигурация игры
 * - roles.js: логика ролей
 * - game-engine.js: основная игровая логика
 * - ui-manager.js: управление интерфейсом
 * - script.js (этот файл): инициализация и интеграция
 */

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОВМЕСТИМОСТИ ==========

// Для совместимости со старым HTML
window.selId = null;
window.msgCallback = null;

// ps - это ссылка на players из gameEngine (будет доступна после инициализации)
// Используется в HTML: ps.length, ps[i].n и т.д.

// ========== ИНИЦИАЛИЗАЦИЯ ==========

window.onload = () => {
    gameEngine.reset();
    // Создаем ссылку ps на players gameEngine
    window.ps = gameEngine.players;
    UIManager.showScreen(1);
};

// ========== СОВМЕСТИМОСТЬ СО СТАРЫМ HTML ==========
// Эти функции поддерживают старый HTML, но используют новый движок

/**
 * Добавить игрока (старое имя функции для HTML)
 */
function addP() {
    gameEngine.addPlayer();
    UIManager.renderPlayerSetup();
    UIManager.updateHeader(1);
}

/**
 * Удалить игрока (старое имя функции для HTML)
 */
function delP(index) {
    gameEngine.removePlayer(index);
    UIManager.renderPlayerSetup();
    UIManager.updateHeader(1);
}

/**
 * Перейти на экран (старое имя функции для HTML)
 */
function go(screenNum) {
    UIManager.showScreen(screenNum);
}

/**
 * Проверить конфигурацию ролей и начать распределение (старое имя)
 */
function checkR() {
    if (!gameEngine.isRoleConfigValid()) {
        alert("Слишком много ролей для такого маленького города! ⚰️");
        return;
    }

    gameEngine.activeNightRoles = ConfigUtils.getActiveNightRoles(gameEngine.roleConfig);
    gameEngine.currentNightRoleIndex = 0;
    gameEngine.players.forEach(p => {
        p.role = 'Citizen';
        p.isEliminated = false;
        p.voteCount = 0;
    });

    const firstRole = gameEngine.activeNightRoles[0];
    const roleInfo = ConfigUtils.getRoleInfo(firstRole);
    const type = roleInfo.temperament;
    const msg = ConfigUtils.getRandomPhrase('nightStart', null, {
        role: '<b>' + roleInfo.displayName + '</b>',
        roleType: type
    });

    UIManager.showMessage("Время знакомиться 🌙", msg, () => UIManager.showScreen(3));
}

/**
 * Установить роль игроку (старое имя)
 */
function setRole(playerIdx, roleName) {
    const player = gameEngine.players[playerIdx];
    const requiredCount = gameEngine.roleConfig[roleName];
    const currentCount = gameEngine.players.filter(p => p.role === roleName).length;

    if (player.role === roleName) {
        player.role = 'Citizen';
    } else if (player.role === 'Citizen') {
        if (currentCount < requiredCount) {
            if (requiredCount === 1) {
                gameEngine.players.forEach(p => {
                    if (p.role === roleName) p.role = 'Citizen';
                });
            }
            player.role = roleName;
        }
    }

    UIManager.renderRoleDistribution();
}

/**
 * Подтвердить распределение роли (старое имя)
 */
function nextRS() {
    const currentRole = gameEngine.activeNightRoles[gameEngine.currentNightRoleIndex];
    if (!currentRole) return;

    const count = gameEngine.players.filter(p => p.role === currentRole).length;
    const required = gameEngine.roleConfig[currentRole];

    if (count !== required) {
        alert(`Назначь всех ${ConfigUtils.getRoleInfo(currentRole).displayName}. Никто не должен остаться без судьбы!`);
        return;
    }

    gameEngine.currentNightRoleIndex++;

    if (gameEngine.currentNightRoleIndex >= gameEngine.activeNightRoles.length) {
        UIManager.showMessage(
            "Протокол заполнен ✅",
            "Карты розданы. Пусть город встретит свой первый рассвет.",
            () => startFirstDay()
        );
    } else {
        const nextRole = gameEngine.activeNightRoles[gameEngine.currentNightRoleIndex];
        const roleInfo = ConfigUtils.getRoleInfo(nextRole);
        const msg = ConfigUtils.getRandomPhrase('nightStart', null, {
            role: '<b>' + roleInfo.displayName + '</b>',
            roleType: roleInfo.temperament
        });

        UIManager.showMessage(
            `${ConfigUtils.getRoleInfo(currentRole).displayName} засыпает 💤`,
            msg,
            () => UIManager.renderRoleDistribution()
        );
    }
}

/**
 * Кликнуть на игрока (выбрать для ночного действия)
 */
function clickP(i) {
    window.selId = (window.selId === i) ? null : i;
    UIManager.renderGameScreen();
}

/**
 * Проголосовать в дневной фазе
 */
function vote(playerIdx, direction) {
    gameEngine.vote(playerIdx, direction);
    UIManager.renderGameScreen();
}

/**
 * Начать первый день
 */
function startFirstDay() {
    gameEngine.startFirstDay();
    UIManager.showScreen(4);
}

/**
 * Начать ночь
 */
function startNight() {
    const result = gameEngine.startNight();
    const firstRole = result.currentRole;
    
    if (firstRole) {
        const roleInfo = ConfigUtils.getRoleInfo(firstRole);
        const msg = ConfigUtils.getRandomPhrase('nightStart', null, {
            role: '<b>' + roleInfo.displayName + '</b>',
            roleType: roleInfo.temperament
        });

        UIManager.showMessage(
            `Ночь ${gameEngine.currentNight} 🌙`,
            msg,
            () => UIManager.renderGameScreen()
        );
    }
}

/**
 * Основной обработчик действий (ночных и дневных)
 * Это основная функция, которая вызывается из HTML
 */
function doAction(targetId) {
    // Если это дневная фаза
    if (gameEngine.isDay) {
        // Дневное голосование
        const tV = Object.values(gameEngine.dayVotes).reduce((a, b) => a + b, 0);
        
        if (tV === 0 && gameEngine.tiedPlayers.length === 0) {
            // Пропустить, если никто не голосовал
            if (confirm("Никто не набрал голосов. Оставим их в живых до завтра?")) {
                UIManager.showMessage("День окончен", "Палач уходит ни с чем.", () => startNight());
            }
            return;
        }

        // Провести голосование
        const result = gameEngine.castVote();

        if (result.phase === 'EXILE') {
            const victimIdx = result.exiled;
            UIManager.showMessage(
                "Итоги дня",
                result.message,
                () => {
                    const winCheck = gameEngine.checkWinCondition();
                    if (winCheck) {
                        UIManager.showMessage("Финал 🏆", winCheck.message, () => UIManager.showScreen(5));
                    } else {
                        startNight();
                    }
                }
            );
        } else if (result.phase === 'FIRST_TIE') {
            gameEngine.tiedPlayers = result.tiedPlayers;
            UIManager.showMessage("Ничья!", result.message, () => UIManager.renderGameScreen());
        } else if (result.phase === 'SECOND_TIE') {
            UIManager.showMessage("Ничья", result.message, () => startNight());
        }
    } else {
        // Ночное действие
        const currentRole = gameEngine.getCurrentNightRole();
        const currentRoleInfo = ConfigUtils.getRoleInfo(currentRole);
        
        if (targetId === null) {
            // Пропустить
            const skipMsg = ConfigUtils.getRandomPhrase('confirmSkip', null, {
                role: currentRoleInfo.displayName
            });

            if (!confirm(skipMsg)) return;

            gameEngine.skipNightAction();
            window.selId = null;
        } else {
            // Выбрать цель
            const result = gameEngine.submitNightAction(targetId);
            window.selId = null;
            
            if (!result) return;
            
            if (result.phase === 'END_NIGHT') {
                UIManager.showMessage(
                    `${currentRoleInfo.displayName} засыпает 💤`,
                    "Кровавая жатва окончена. Город просыпается...",
                    () => UIManager.endNightPhase()
                );
                return;
            } else if (result.currentRole) {
                const nextRole = result.currentRole;
                const nextRoleInfo = ConfigUtils.getRoleInfo(nextRole);
                
                UIManager.showMessage(
                    `${currentRoleInfo.displayName} засыпает 💤`,
                    ConfigUtils.getRandomPhrase('nightStart', null, {
                        role: '<b>' + nextRoleInfo.displayName + '</b>',
                        roleType: nextRoleInfo.temperament
                    }),
                    () => UIManager.renderGameScreen()
                );
            }
        }

        UIManager.renderGameScreen();
    }
}

// ========== ОБЩИЕ УПРАВЛЕНИЯ ==========

/**
 * Переключить видимость лога
 */
function toggleLog() {
    UIManager.toggleLog();
}

/**
 * Подтвердить сброс игры
 */
function confirmReset() {
    if (confirm("Замести следы и начать заново? 🧹")) {
        location.reload();
    }
}

/**
 * Закрыть модальное сообщение
 */
function closeMsg() {
    UIManager.closeMessage();
}

// ========== ОТЛАДКА ==========

/**
 * Вывести состояние игры в консоль
 */
function debugGameState() {
    console.log('🎮 Game State:', gameEngine.getGameState());
    console.log('📋 Game Log:', gameEngine.getLog());
}

