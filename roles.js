/**
 * ЛОГИКА РОЛЕЙ
 * 
 * Каждая роль может иметь свою специальную логику через RoleHandler
 * Это позволяет легко добавлять новые роли и менять их поведение
 * 
 * Структура RoleHandler:
 * - canSelectTarget(target, gameState): проверить, можно ли выбрать эту цель
 * - onNightAction(target, gameState): обработать ночное действие
 * - getRestrictions(): получить ограничения роли
 */

const RoleHandlers = {
    /**
     * DOCTOR (Доктор)
     * - Может спасать одного игрока за ночь
     * - Не может спасать одного и того же два раза подряд
     */
    Doctor: {
        canSelectTarget(targetIdx, gameState) {
            const player = gameState.players[targetIdx];
            
            // Не мертв
            if (player.isEliminated) return false;
            
            // Не может спасать одного и того же два раза подряд
            if (targetIdx === gameState.roleStates.Doctor?.lastTarget) {
                return false;
            }
            
            return true;
        },

        onNightAction(targetIdx, gameState) {
            gameState.roleStates.Doctor = gameState.roleStates.Doctor || {};
            gameState.roleStates.Doctor.lastTarget = targetIdx;
            gameState.roleStates.Doctor.protected = targetIdx;
            
            return {
                type: 'DOCTOR_ACTION',
                target: targetIdx,
                message: `💊 Доктор возился с: <b>${gameState.getPlayerName(targetIdx)}</b>`
            };
        },

        getRestrictions() {
            return { preventConsecutive: true };
        }
    },

    /**
     * MAFIA (Мафия)
     * - Может убивать одного игрока за ночь
     * - Может пропустить
     */
    Mafia: {
        canSelectTarget(targetIdx, gameState) {
            const player = gameState.players[targetIdx];
            
            // Не мертв
            if (player.isEliminated) return false;
            
            return true;
        },

        onNightAction(targetIdx, gameState) {
            gameState.roleStates.Mafia = gameState.roleStates.Mafia || {};
            gameState.roleStates.Mafia.target = targetIdx;
            
            return {
                type: 'MAFIA_ACTION',
                target: targetIdx,
                message: `👺 Мафия целилась в: <b>${gameState.getPlayerName(targetIdx)}</b>`
            };
        },

        getRestrictions() {
            return {};
        }
    },

    /**
     * DETECTIVE (Комиссар)
     * - Может проверять одного игрока за ночь
     * - Узнает, мафия они или нет
     * - Не может проверять одного и того же два раза
     */
    Detective: {
        canSelectTarget(targetIdx, gameState) {
            const player = gameState.players[targetIdx];
            
            // Не мертв
            if (player.isEliminated) return false;
            
            // Не может проверять себя
            const detective = gameState.players.find(p => p.role === 'Detective' && !p.isEliminated);
            if (detective && gameState.players.indexOf(detective) === targetIdx) {
                return false;
            }
            
            // Не может проверять одного и того же
            if (gameState.roleStates.Detective?.checkedPlayers?.includes(targetIdx)) {
                return false;
            }
            
            return true;
        },

        onNightAction(targetIdx, gameState) {
            const target = gameState.players[targetIdx];
            const isEvil = target.role === 'Mafia' || target.role === 'Maniac';
            
            gameState.roleStates.Detective = gameState.roleStates.Detective || {};
            gameState.roleStates.Detective.checkedPlayers = 
                gameState.roleStates.Detective.checkedPlayers || [];
            
            if (!gameState.roleStates.Detective.checkedPlayers.includes(targetIdx)) {
                gameState.roleStates.Detective.checkedPlayers.push(targetIdx);
            }
            
            return {
                type: 'DETECTIVE_ACTION',
                target: targetIdx,
                result: isEvil ? 'EVIL' : 'GOOD',
                message: `🔍 Комиссар изучал <b>${gameState.getPlayerName(targetIdx)}</b>: ${isEvil ? 'МАФИЯ 👺' : 'ЧИСТ 😊'}`
            };
        },

        getRestrictions() {
            return { preventSameTwice: true };
        }
    },

    /**
     * MANIAC (Маньяк)
     * - Может убивать одного игрока за ночь
     * - Не может пропускать
     * - Может убивать своих
     */
    Maniac: {
        canSelectTarget(targetIdx, gameState) {
            const player = gameState.players[targetIdx];
            
            // Не мертв
            if (player.isEliminated) return false;
            
            return true;
        },

        onNightAction(targetIdx, gameState) {
            gameState.roleStates.Maniac = gameState.roleStates.Maniac || {};
            gameState.roleStates.Maniac.target = targetIdx;
            
            return {
                type: 'MANIAC_ACTION',
                target: targetIdx,
                message: `🔪 Маньяк целилась в: <b>${gameState.getPlayerName(targetIdx)}</b>`
            };
        },

        getRestrictions() {
            return {};
        }
    },

    /**
     * CITIZEN (Мирный)
     * - Не имеет ночных действий
     */
    Citizen: {
        canSelectTarget() {
            return false;
        },

        onNightAction() {
            return { type: 'NO_ACTION' };
        },

        getRestrictions() {
            return {};
        }
    }
};

/**
 * Вспомогательные функции для работы с ролями
 */
const RoleUtils = {
    /**
     * Получить обработчик роли
     */
    getHandler(roleName) {
        return RoleHandlers[roleName] || RoleHandlers.Citizen;
    },

    /**
     * Проверить, может ли роль выбирать цели
     */
    canSelectTarget(roleName, targetIdx, gameState) {
        const handler = this.getHandler(roleName);
        return handler.canSelectTarget(targetIdx, gameState);
    },

    /**
     * Выполнить ночное действие роли
     */
    executeNightAction(roleName, targetIdx, gameState) {
        const handler = this.getHandler(roleName);
        return handler.onNightAction(targetIdx, gameState);
    },

    /**
     * Получить ограничения роли
     */
    getRestrictions(roleName) {
        const handler = this.getHandler(roleName);
        return handler.getRestrictions();
    },

    /**
     * Определить сторону (alignment) роли для проверки побед
     */
    getAlignment(roleName) {
        const roleInfo = ConfigUtils.getRoleInfo(roleName);
        return roleInfo?.alignment || 'neutral';
    }
};
