/**
 * ИГРОВОЙ ДВИЖОК (Game Engine)
 * 
 * Управляет состоянием игры и всеми переходами между фазами
 * Полностью отделен от UI - это чистая бизнес-логика
 * 
 * Преимущества:
 * - Легко тестировать
 * - Легко добавлять новые правила
 * - Полная история игры в логах
 * - Независимость от интерфейса
 */

class GameEngine {
    constructor() {
        this.reset();
    }

    /**
     * Инициализировать новую игру
     */
    reset() {
        this.players = [];
        this.roleConfig = { ...GAME_CONFIG.DEFAULT_ROLE_CONFIG };
        this.currentNight = 0;
        this.isDay = false;
        this.currentNightRoleIndex = 0;
        this.activeNightRoles = [];
        this.nightActions = {};
        this.selectedPlayerId = null;
        this.dayVotes = {};
        this.tiedPlayers = [];
        this.gameLog = [];
        this.morningReport = "";
        this.winner = null;
        this.roleStates = {};  // Для хранения состояния каждой роли (например, последняя цель Доктора)
        
        this.log("🎮 Игра инициализирована");
    }

    // ========== УПРАВЛЕНИЕ ИГРОКАМИ ==========

    /**
     * Добавить игрока
     */
    addPlayer(name = '') {
        this.players.push({
            id: this.players.length,
            name: name || `Игрок ${this.players.length + 1}`,
            role: 'Citizen',
            isEliminated: false,
            voteCount: 0
        });
        this.log(`👤 Добавлен игрок: ${name || 'новый'}`);
        return this.players[this.players.length - 1];
    }

    /**
     * Удалить игрока
     */
    removePlayer(id) {
        const player = this.players[id];
        if (player) {
            this.players.splice(id, 1);
            this.log(`👤 Удален игрок: ${player.name}`);
        }
    }

    /**
     * Переименовать игрока
     */
    renamePlayer(id, newName) {
        if (this.players[id]) {
            this.players[id].name = newName;
        }
    }

    /**
     * Получить имя игрока
     */
    getPlayerName(id) {
        return this.players[id]?.name || `Игрок ${id + 1}`;
    }

    /**
     * Получить кол-во живых игроков
     */
    getAlivePlayers() {
        return this.players.filter(p => !p.isEliminated);
    }

    /**
     * Проверить валидность конфигурации ролей
     */
    isRoleConfigValid() {
        const totalRoles = Object.values(this.roleConfig).reduce((a, b) => a + b, 0);
        return totalRoles >= 4 && totalRoles < this.players.length;
    }

    // ========== РАСПРЕДЕЛЕНИЕ РОЛЕЙ ==========

    /**
     * Раздать роли игрокам
     */
    distributeRoles(roleAssignments) {
        // roleAssignments: массив { playerId, role }
        this.players.forEach(p => p.role = 'Citizen');
        
        roleAssignments.forEach(assignment => {
            if (this.players[assignment.playerId]) {
                this.players[assignment.playerId].role = assignment.role;
            }
        });

        this.activeNightRoles = ConfigUtils.getActiveNightRoles(this.roleConfig);
        this.log(`✅ Роли распределены. Активные ночные роли: ${this.activeNightRoles.join(', ')}`);
    }

    /**
     * Изменить кол-во роли в конфигурации
     */
    setRoleCount(role, count) {
        if (GAME_CONFIG.ROLES[role]) {
            this.roleConfig[role] = Math.max(0, count);
            this.log(`🔧 ${ConfigUtils.getRoleInfo(role).displayName}: ${count}`);
        }
    }

    // ========== ФАЗЫ ИГРЫ ==========

    /**
     * Начать первый день (представление ролей)
     */
    startFirstDay() {
        this.isDay = true;
        this.currentNight = 1;
        this.morningReport = "Город проснулся. Пока все целы. Пока...";
        this.activeNightRoles = ConfigUtils.getActiveNightRoles(this.roleConfig);
        
        this.log(`<span class="log-day">--- ЭПИЗОД 1: Знакомство ---</span>`);
        this.log("📢 Представление ролей началось");
        
        return {
            phase: 'DAY',
            night: this.currentNight,
            isFirstDay: true,
            message: "Город проснулся. Пусть посмотрят друг другу в глаза..."
        };
    }

    /**
     * Начать ночь
     */
    startNight() {
        this.isDay = false;
        this.currentNightRoleIndex = 0;
        this.nightActions = {};
        this.selectedPlayerId = null;
        
        this.log(`<span class="log-night">--- НОЧЬ ${this.currentNight} ---</span>`);
        
        return {
            phase: 'NIGHT',
            night: this.currentNight,
            currentRole: this.getCurrentNightRole(),
            message: `Ночь ${this.currentNight}`
        };
    }

    /**
     * Получить текущую ночную роль
     */
    getCurrentNightRole() {
        return this.activeNightRoles[this.currentNightRoleIndex] || null;
    }

    /**
     * Получить всех живых игроков, которые еще имеют текущую роль
     */
    getAlivePlayersWithRole(role) {
        return this.players.filter(p => p.role === role && !p.isEliminated);
    }

    // ========== НОЧНЫЕ ДЕЙСТВИЯ ==========

    /**
     * Выполнить ночное действие для текущей роли
     */
    submitNightAction(playerTarget = null) {
        const currentRole = this.getCurrentNightRole();
        if (!currentRole) return null;

        if (playerTarget !== null) {
            // Проверить, может ли цель быть выбрана
            if (!RoleUtils.canSelectTarget(currentRole, playerTarget, this)) {
                return { error: "Эта цель не может быть выбрана" };
            }

            // Выполнить действие роли
            const result = RoleUtils.executeNightAction(currentRole, playerTarget, this);
            this.nightActions[currentRole] = result;
            this.log(result.message);
        }

        // Перейти к следующей роли
        this.currentNightRoleIndex++;
        
        if (this.currentNightRoleIndex >= this.activeNightRoles.length) {
            // Ночь закончилась
            return { phase: 'END_NIGHT', nextPhase: 'PROCESS_NIGHT' };
        }

        return {
            phase: 'NIGHT',
            currentRole: this.getCurrentNightRole(),
            roleIndex: this.currentNightRoleIndex
        };
    }

    /**
     * Пропустить ночное действие
     */
    skipNightAction() {
        const currentRole = this.getCurrentNightRole();
        if (!currentRole) return null;

        this.nightActions[currentRole] = {
            type: 'SKIP',
            message: `💤 ${ConfigUtils.getRoleInfo(currentRole).displayName} пропустила ход`
        };
        this.log(this.nightActions[currentRole].message);

        this.currentNightRoleIndex++;
        
        if (this.currentNightRoleIndex >= this.activeNightRoles.length) {
            return { phase: 'END_NIGHT', nextPhase: 'PROCESS_NIGHT' };
        }

        return {
            phase: 'NIGHT',
            currentRole: this.getCurrentNightRole()
        };
    }

    /**
     * Обработать результаты ночи (смерти, информация детективу)
     */
    processNight() {
        const targets = [];
        const doctorProtected = this.roleStates.Doctor?.protected;

        // Определить убитых
        ['Mafia', 'Maniac'].forEach(role => {
            const action = this.nightActions[role];
            if (action && action.target !== undefined && action.target !== null) {
                // Если не спасен доктором
                if (action.target !== doctorProtected) {
                    targets.push(action.target);
                }
            }
        });

        // Убить уникальные цели
        const killed = [...new Set(targets)];
        killed.forEach(idx => {
            if (this.players[idx]) {
                this.players[idx].isEliminated = true;
                this.log(`☠️ Убит: <b>${this.getPlayerName(idx)}</b>`);
            }
        });

        // Установить отчет о утре
        if (killed.length > 0) {
            const names = killed.map(idx => `<b>${this.getPlayerName(idx)}</b>`).join(', ');
            this.morningReport = ConfigUtils.getRandomPhrase('morningKilled', null, { name: names });
        } else {
            this.morningReport = ConfigUtils.getRandomPhrase('morningSafe');
        }

        this.log(`<span class="log-day">УТРО ${this.currentNight}: ${this.morningReport}</span>`);

        this.isDay = true;
        this.dayVotes = {};
        this.tiedPlayers = [];

        return {
            phase: 'DAWN',
            killed: killed,
            message: this.morningReport
        };
    }

    // ========== ДНЕВНЫЕ ДЕЙСТВИЯ (ГОЛОСОВАНИЕ) ==========

    /**
     * Проголосовать за игрока
     */
    vote(playerIdx, voteChange) {
        const votes = this.dayVotes[playerIdx] || 0;
        const newVotes = Math.max(0, votes + voteChange);
        
        if (newVotes > 0) {
            this.dayVotes[playerIdx] = newVotes;
        } else {
            delete this.dayVotes[playerIdx];
        }
    }

    /**
     * Провести голосование (изгнание)
     */
    castVote(playerIdx = null) {
        const alivePlayers = this.getAlivePlayers();
        const candidates = this.tiedPlayers.length > 0 
            ? alivePlayers.filter(p => this.tiedPlayers.includes(this.players.indexOf(p)))
            : alivePlayers;

        const maxVotes = Math.max(...candidates.map(p => this.dayVotes[this.players.indexOf(p)] || 0));

        if (maxVotes === 0) {
            return { phase: 'NO_EXILE', message: "Никто не набрал голосов. День для палача - преступен." };
        }

        const leaders = candidates.filter(p => (this.dayVotes[this.players.indexOf(p)] || 0) === maxVotes);

        if (leaders.length === 1) {
            // Одна жертва
            const victim = leaders[0];
            victim.isEliminated = true;
            const victimIdx = this.players.indexOf(victim);
            this.log(`⚖️ Покинул город: <b>${this.getPlayerName(victimIdx)}</b>`);
            
            return {
                phase: 'EXILE',
                exiled: victimIdx,
                message: `Город избавился от <b>${this.getPlayerName(victimIdx)}</b>.`
            };
        } else {
            // Ничья
            if (this.tiedPlayers.length > 0) {
                // Вторая ничья - никого не убиваем
                this.log(`⚖️ Вторая ничья: Смерть сегодня отдыхает.`);
                return {
                    phase: 'SECOND_TIE',
                    message: "Город в замешательстве. Все спят."
                };
            } else {
                // Первая ничья
                this.tiedPlayers = leaders.map(p => this.players.indexOf(p));
                this.dayVotes = {};
                return {
                    phase: 'FIRST_TIE',
                    message: "Ничья! Переголосование...",
                    tiedPlayers: this.tiedPlayers
                };
            }
        }
    }

    // ========== ПРОВЕРКА ПОБЕД ==========

    /**
     * Проверить условия побед
     */
    checkWinCondition() {
        const alivePlayers = this.getAlivePlayers();
        const mafia = alivePlayers.filter(p => p.role === 'Mafia').length;
        const maniac = alivePlayers.filter(p => p.role === 'Maniac').length;
        const total = alivePlayers.length;

        // Мафия
        if (mafia > 0 && mafia >= (total - mafia - maniac)) {
            this.winner = 'Mafia';
            const msg = ConfigUtils.getRandomPhrase('winMafia');
            this.log(`🏆 <b>${msg}</b>`);
            return { winner: 'Mafia', message: msg };
        }

        // Маньяк
        if (maniac > 0 && total <= 2 && mafia === 0) {
            this.winner = 'Maniac';
            const msg = ConfigUtils.getRandomPhrase('winManiac');
            this.log(`🏆 <b>${msg}</b>`);
            return { winner: 'Maniac', message: msg };
        }

        // Граждане
        if (mafia === 0 && maniac === 0) {
            this.winner = 'Citizens';
            const msg = ConfigUtils.getRandomPhrase('winCitizen');
            this.log(`🏆 <b>${msg}</b>`);
            return { winner: 'Citizens', message: msg };
        }

        return null;
    }

    /**
     * Завершить ночь и проверить победу
     */
    endNight() {
        this.currentNight++;
        const winCondition = this.checkWinCondition();
        
        if (winCondition) {
            return { gameEnded: true, ...winCondition };
        }

        return { phase: 'DAY', night: this.currentNight };
    }

    /**
     * Попытаться изгнать игрока и проверить победу
     */
    endDay() {
        const winCondition = this.checkWinCondition();
        
        if (winCondition) {
            return { gameEnded: true, ...winCondition };
        }

        return { phase: 'NIGHT', night: this.currentNight };
    }

    // ========== ЛОГИРОВАНИЕ ==========

    /**
     * Добавить запись в лог
     */
    log(message) {
        this.gameLog.push({
            timestamp: new Date().toLocaleTimeString('ru-RU'),
            text: String(message),
            phase: this.isDay ? 'День' : 'Ночь',
            night: this.currentNight
        });
    }

    /**
     * Получить весь лог
     */
    getLog() {
        return this.gameLog;
    }

    /**
     * Получить состояние игры для отладки
     */
    getGameState() {
        return {
            players: this.players,
            roleConfig: this.roleConfig,
            currentNight: this.currentNight,
            isDay: this.isDay,
            currentNightRoleIndex: this.currentNightRoleIndex,
            activeNightRoles: this.activeNightRoles,
            nightActions: this.nightActions,
            winner: this.winner
        };
    }
}

// Создаем глобальный экземпляр движка
let gameEngine = new GameEngine();
