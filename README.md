# 🎭 Mafia Moderator Helper - Новая Архитектура

> **Переструктурированное приложение для модератора игры в Мафию**  
> Теперь легко добавлять новые роли, фишки и менять логику игры

---

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Структура файлов](#структура-файлов)
3. [Как добавить новую роль](#как-добавить-новую-роль)
4. [Как изменить фразы и сообщения](#как-изменить-фразы-и-сообщения)
5. [Как добавить новую фишку](#как-добавить-новую-фишку)
6. [API документация](#api-документация)

---

## 🏗️ Обзор Архитектуры

Приложение разделено на **5 независимых модулей**, каждый отвечает за свою область:

```
┌─────────────────────────────────────────────────┐
│          HTML Interface (index.html)            │
│  Кнопки, экраны, 100% совместимо со старым     │
└────────────────────┬────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
      ↓                             ↓
┌──────────────┐          ┌──────────────┐
│  script.js   │          │ ui-manager.js│
│ Инициализ.  │          │ Отрисовка    │
│ Callbacks    │          │ UI / Events  │
└──────┬───────┘          └────┬─────────┘
       │                       │
       └───────────┬───────────┘
                   ↓
          ┌─────────────────┐
          │ game-engine.js  │
          │ ОСНОВНАЯ ЛОГИКА │
          │ Состояние игры  │
          └────────┬────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
  ┌──────────┐          ┌────────────┐
  │roles.js  │          │config.js   │
  │Логика    │          │Конфигурац. │
  │ролей    │          │Фразы       │
  └──────────┘          │Правила     │
                        └────────────┘
```

### Ключевые принципы:

- **config.js** - БД со всеми данными (роли, фразы, правила)
- **roles.js** - Логическая реализация каждой роли
- **game-engine.js** - Игровой движок (не знает про UI!)
- **ui-manager.js** - Визуализация и взаимодействие (не меняет логику!)
- **script.js** - Глюе-код, интеграция всех компонентов

---

## 📁 Структура Файлов

```
mafia_beta/
├── index.html          # UI - не меняется часто
├── style.css           # Стили - не меняется часто
│
├── config.js           # ⭐ КОНФИГУРАЦИЯ (редактируй отсюда)
│   ├── GAME_CONFIG.ROLES          - определение ролей
│   ├── GAME_CONFIG.PHRASES        - все фразы и сообщения
│   ├── GAME_CONFIG.WIN_CONDITIONS - условия побед
│   └── ConfigUtils                - вспомогательные функции
│
├── roles.js            # ⭐ ЛОГИКА РОЛЕЙ (добавляй новые роли)
│   ├── RoleHandlers.Doctor        - специфичная логика Доктора
│   ├── RoleHandlers.Mafia         - специфичная логика Мафии
│   ├── RoleHandlers.Detective     - специфичная логика Комиссара
│   ├── RoleHandlers.Maniac        - специфичная логика Маньяка
│   └── RoleUtils                  - вспомогательные функции ролей
│
├── game-engine.js      # ⭐ ИГРОВОЙ ДВИЖОК (основная логика)
│   └── class GameEngine           - управление состоянием
│
├── ui-manager.js       # ⭐ УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ
│   └── UIManager                  - объект с методами UI
│
├── script.js           # ⭐ ИНИЦИАЛИЗАЦИЯ И CALLBACKS
│   └── Старый HTML совместимый код
│
└── script-old.js       # Резервная копия старого кода
```

---

## ➕ Как Добавить Новую Роль

### Пример: "Detective Junior" (младший комиссар)

#### Шаг 1: Добавить роль в `config.js`

```javascript
// В GAME_CONFIG.ROLES добавить:

ROLES: {
    // ... существующие роли ...
    DetectiveJunior: {
        displayName: 'Младший Комиссар',
        emoji: '🔎',
        cssClass: 'tag-DetectiveJunior',
        alignment: 'good',
        actionType: 'select',
        isNightRole: true,
        canSkip: true,
        temperament: 'peaceful',
        restrictions: { preventSameTwice: false }  // Может проверять одного дважды
    }
}
```

#### Шаг 2: Добавить фразы в `config.js`

```javascript
// В PHRASES.rolePrompts добавить:

rolePrompts: {
    // ... существующие ...
    'DetectiveJunior': [
        "Кого проверим? Помогай старшему! 🔎",
        "Шпионов не боимся. На кого подозрение? 🕵️‍♂️",
        // ... еще фразы ...
    ]
}
```

#### Шаг 3: Добавить логику в `roles.js`

```javascript
RoleHandlers: {
    // ... существующие роли ...
    
    DetectiveJunior: {
        canSelectTarget(targetIdx, gameState) {
            const player = gameState.players[targetIdx];
            if (player.isEliminated) return false;
            
            // Junior не проверяет себя
            const myIdx = gameState.players.findIndex(p => p.role === 'DetectiveJunior' && !p.isEliminated);
            if (myIdx === targetIdx) return false;
            
            return true;
        },

        onNightAction(targetIdx, gameState) {
            const target = gameState.players[targetIdx];
            const isEvil = target.role === 'Mafia' || target.role === 'Maniac';
            
            gameState.roleStates.DetectiveJunior = gameState.roleStates.DetectiveJunior || {};
            
            return {
                type: 'DETECTIVE_JUNIOR_ACTION',
                target: targetIdx,
                result: isEvil ? 'EVIL' : 'GOOD',
                message: `🔎 Младший комиссар изучал <b>${gameState.getPlayerName(targetIdx)}</b>: ${isEvil ? 'ПОДОЗРИТЕЛЬНАЯ ЛИЧНОСТЬ' : 'ВЫГЛЯДИТ НОРМАЛЬНО'}`
            };
        },

        getRestrictions() {
            return {};  // Никаких ограничений
        }
    }
}
```

#### Шаг 4: Добавить в порядок ночных ролей (опционально)

```javascript
// В config.js:
NIGHT_ROLE_ORDER: ['Doctor', 'Mafia', 'Maniac', 'Detective', 'DetectiveJunior'],
```

#### Шаг 5: Добавить в стили (опционально)

```css
/* В style.css: */
.tag-DetectiveJunior { background: #0a84ff; opacity: 0.8; }
.sel-DetectiveJunior { border-color: #0a84ff !important; background: rgba(10, 132, 255, 0.1) !important; }
.header-line-DetectiveJunior { border-bottom: 3px solid #0a84ff !important; }
```

**Готово!** Новая роль теперь полностью интегрирована! ✨

---

## 🎤 Как Изменить Фразы и Сообщения

Все фразы находятся в `config.js` в объекте `PHRASES`.

### Например, изменить фразы Мафии:

```javascript
// config.js -> PHRASES.rolePrompts

'Mafia': [
    "Укажите на того, кто не увидит рассвет. 👺",
    "Вынесите смертный приговор. 🔫",
    // ← ТУТ МОЖНО МЕНЯТЬ
    "Чье имя сегодня вычеркнем из списка живых? 📝",
    // ← И ТУТ
]
```

### Структура PHRASES:

```javascript
PHRASES: {
    nightStart: {
        peaceful: [...],      // Фразы для добрых ролей (Доктор, Комиссар)
        aggressive: [...]     // Фразы для злых ролей (Мафия, Маньяк)
    },
    rolePrompts: {
        'Doctor': [...],      // Промпт для каждой роли во время ночи
        'Mafia': [...],
        // ...
    },
    confirmSkip: [...],       // Подтверждение пропуска хода
    morningKilled: [...],     // Сообщения об убийстве
    morningSafe: [...],       // Сообщения о безопасной ночи
    dayExile: [...],          // Сообщения при голосовании
    winMafia: [...],          // Сообщения при победе Мафии
    winCitizen: [...],        // Сообщения при победе граждан
    winManiac: [...]          // Сообщения при победе маньяка
}
```

### Использование переменных в фразах:

```javascript
// Доступные переменные:
"{role}"    // Имя роли с эмодзи
"{name}"    // Имя игрока
"{nightNumber}"  // Номер ночи
```

### Пример с переменными:

```javascript
ConfigUtils.getRandomPhrase('nightStart', null, {
    role: '<b>Доктор</b>',
    roleType: 'peaceful'
});
// → "Закон не спит. На сцену выходит Доктор. ⚖️"
```

---

## 🎯 Как Добавить Новую Фишку

### Пример: "Правило 72 часа" (Доктор может спасать каждого только раз в 3 ночи)

#### Шаг 1: Расширить состояние роли в `game-engine.js`

```javascript
class GameEngine {
    reset() {
        // ... существующий код ...
        
        this.roleStates = {
            Doctor: {
                protected: null,
                lastSavedPlayers: {},  // { playerId: lastNightSaved }
                // canSavePlayer(id): check if can save this player
            }
        };
    }
}
```

#### Шаг 2: Изменить логику в `roles.js`

```javascript
Doctor: {
    canSelectTarget(targetIdx, gameState) {
        const player = gameState.players[targetIdx];
        if (player.isEliminated) return false;
        
        // Проверить правило "72 часа"
        const lastSaved = gameState.roleStates.Doctor?.lastSavedPlayers?.[targetIdx];
        if (lastSaved !== undefined && gameState.currentNight - lastSaved < 3) {
            return false;  // Слишком скоро
        }
        
        return true;
    },

    onNightAction(targetIdx, gameState) {
        gameState.roleStates.Doctor = gameState.roleStates.Doctor || {};
        gameState.roleStates.Doctor.lastSavedPlayers = 
            gameState.roleStates.Doctor.lastSavedPlayers || {};
        
        // Обновить время последнего спасения
        gameState.roleStates.Doctor.lastSavedPlayers[targetIdx] = gameState.currentNight;
        gameState.roleStates.Doctor.protected = targetIdx;
        
        return {
            type: 'DOCTOR_ACTION',
            target: targetIdx,
            message: `💊 Доктор возился с: <b>${gameState.getPlayerName(targetIdx)}</b>`
        };
    }
}
```

**Готово!** Новая фишка внедрена! 🎯

---

## 📚 API Документация

### GameEngine - Основной класс

```javascript
// Инициализация
gameEngine = new GameEngine()
gameEngine.reset()  // Сброс игры

// Управление игроками
gameEngine.addPlayer(name)
gameEngine.removePlayer(id)
gameEngine.renamePlayer(id, newName)
gameEngine.getPlayerName(id)
gameEngine.getAlivePlayers()

// Роли
gameEngine.setRoleCount(role, count)
gameEngine.distributeRoles(roleAssignments)
gameEngine.isRoleConfigValid()

// Фазы игры
gameEngine.startFirstDay()
gameEngine.startNight()
gameEngine.endNight()
gameEngine.endDay()

// Ночные действия
gameEngine.submitNightAction(targetId)
gameEngine.skipNightAction()
gameEngine.processNight()
gameEngine.getCurrentNightRole()

// Дневные действия
gameEngine.vote(playerIdx, voteChange)
gameEngine.castVote()

// Победы
gameEngine.checkWinCondition()

// Логирование
gameEngine.log(message)
gameEngine.getLog()
gameEngine.getGameState()
```

### UIManager - управление интерфейсом

```javascript
// Сообщения
UIManager.showMessage(title, text, callback)
UIManager.closeMessage()

// Экраны
UIManager.showScreen(screenNum)
UIManager.updateHeader(screenNum)

// Рендеринг
UIManager.renderPlayerSetup()
UIManager.renderRoleConfig()
UIManager.renderRoleDistribution()
UIManager.renderGameScreen()
UIManager.renderGameEnd()
UIManager.toggleLog()

// Вспомогательные
UIManager.endNightPhase()
```

### ConfigUtils - работа с конфигурацией

```javascript
ConfigUtils.getRandomPhrase(key, subKey, data)
ConfigUtils.getRoleInfo(roleName)
ConfigUtils.getNightRoles()
ConfigUtils.getActiveNightRoles(gameRoles)
```

### RoleUtils - работа с ролями

```javascript
RoleUtils.getHandler(roleName)
RoleUtils.canSelectTarget(roleName, targetIdx, gameState)
RoleUtils.executeNightAction(roleName, targetIdx, gameState)
RoleUtils.getRestrictions(roleName)
RoleUtils.getAlignment(roleName)
```

---

## 🚀 Быстрые Примеры

### Изменить количество Мафии по умолчанию

```javascript
// config.js
DEFAULT_ROLE_CONFIG: {
    Mafia: 3,  // ← было 1
    Maniac: 0,
    Detective: 1,
    Doctor: 1
}
```

### Добавить новое условие победы

```javascript
// config.js
WIN_CONDITIONS: {
    // ... существующие ...
    
    // Новое: Если остался только 1 игрок
    lastManStanding: {
        check: (alive, mafia, maniac) => alive === 1,
        message: 'winLastMan'
    }
}

// Затем добавить фразы:
// PHRASES.winLastMan = ["Последний герой стоит одиноко... 🏜️"]
```

### Получить информацию о ролях во время игры

```javascript
// В script.js или консоли
const allRoles = Object.keys(GAME_CONFIG.ROLES);
const activeRoles = gameEngine.activeNightRoles;
const playerRole = gameEngine.players[0].role;
const roleInfo = ConfigUtils.getRoleInfo(playerRole);
console.log(roleInfo.displayName);  // "Мафия"
```

---

## 🔍 Отладка

### Вывести состояние игры в консоль

```javascript
debugGameState()
// Выведет: Game State, Game Log
```

### Посмотреть логи игры

Кнопка "Лог" в интерфейсе или:

```javascript
gameEngine.getLog()
```

### Тестировать роли в консоли

```javascript
// Проверить, может ли роль выбирать цели
RoleUtils.canSelectTarget('Doctor', 2, gameEngine)  // true/false

// Выполнить действие роли
const result = RoleUtils.executeNightAction('Doctor', 2, gameEngine)
console.log(result)
```

---

## 📝 Чек-лист Масштабирования

- [ ] Добавляешь новую роль?
  - [ ] Добавить в `ROLES`
  - [ ] Добавить фразы в `rolePrompts`
  - [ ] Создать `RoleHandler` в `roles.js`
  - [ ] Добавить CSS стили (опционально)
  - [ ] Добавить в `NIGHT_ROLE_ORDER` (если ночная роль)

- [ ] Меняешь фразы?
  - [ ] Обновить `PHRASES` в `config.js`
  - [ ] Проверить переменные `{role}`, `{name}`

- [ ] Добавляешь новую фишку/правило?
  - [ ] Расширить `roleStates` в `GameEngine` (если нужно)
  - [ ] Изменить `RoleHandler` логику
  - [ ] Добавить проверки в `canSelectTarget`
  - [ ] Протестировать в полной игре

- [ ] Меняешь условия победы?
  - [ ] Обновить `WIN_CONDITIONS` в `config.js`
  - [ ] Изменить `checkWinCondition()` в `game-engine.js`
  - [ ] Добавить фразы победы

---

## 🎓 Принципы Архитектуры

### Separation of Concerns (разделение ответственности)

- **config.js**: только данные
- **roles.js**: только логика ролей
- **game-engine.js**: только игровая логика
- **ui-manager.js**: только отрисовка UI
- **script.js**: интеграция и callbacks

### DRY (Don't Repeat Yourself)

Все фразы, роли, правила определены в одном месте (`config.js`). Изменяешь один раз - применяется везде.

### Extensibility (расширяемость)

Новые роли, фишки, фразы - добавляются через расширение структур, а не редактирование кода.

### Testability (тестируемость)

GameEngine полностью независим от UI. Можно тестировать логику отдельно:

```javascript
const engine = new GameEngine();
engine.addPlayer('Test1');
engine.addPlayer('Test2');
engine.setRoleCount('Mafia', 1);
// ... тестирование ...
```

---

## 📞 Помощь

Вопросы? Проверь:

1. Файлы в порядке ли подключены в `index.html`?
2. Нет ошибок в консоли браузера (F12)?
3. Функции существуют в объектах (RoleHandlers, PHRASES)?
4. Переменные и ключи написаны правильно?

---

**Создано с ❤️ для легкого масштабирования**
