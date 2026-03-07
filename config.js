/**
 * ГЛОБАЛЬНАЯ КОНФИГУРАЦИЯ ИГРЫ
 * Здесь определены все роли, фразы, правила и параметры
 * 
 * Для добавления новой роли:
 * 1. Добавить объект в ROLES
 * 2. Добавить фразы в PHRASES
 * 3. Опционально - добавить специальную логику в roles.js
 */

const GAME_CONFIG = {
    /**
     * РОЛИ - определение и параметры
     * 
     * Параметры:
     * - displayName: имя роли на русском
     * - emoji: эмодзи роли
     * - cssClass: CSS класс для стилизации
     * - alignment: 'evil' | 'good' | 'neutral' (для проверки побед)
     * - actionType: 'select' | 'none' (требует ли выбора цели)
     * - canSkip: может ли роль пропустить ход
     * - temperament: 'peaceful' | 'aggressive' (для подбора фраз)
     * - restrictions: { preventSameTwice: true } (дополнительные правила)
     */
    ROLES: {
        Citizen: {
            displayName: 'Мирный',
            emoji: '😊',
            cssClass: 'tag-Citizen',
            alignment: 'good',
            actionType: 'none',
            isNightRole: false,
            temperament: null
        },
        Mafia: {
            displayName: 'Мафия',
            emoji: '👺',
            cssClass: 'tag-Mafia',
            alignment: 'evil',
            actionType: 'select',
            isNightRole: true,
            canSkip: false,
            temperament: 'aggressive'
        },
        Detective: {
            displayName: 'Комиссар',
            emoji: '🕵️‍♂️',
            cssClass: 'tag-Detective',
            alignment: 'good',
            actionType: 'select',
            isNightRole: true,
            canSkip: true,
            temperament: 'peaceful',
            restrictions: { preventSameTwice: true }
        },
        Doctor: {
            displayName: 'Доктор',
            emoji: '💊',
            cssClass: 'tag-Doctor',
            alignment: 'good',
            actionType: 'select',
            isNightRole: true,
            canSkip: true,
            temperament: 'peaceful',
            restrictions: { preventConsecutive: true }
        },
        Maniac: {
            displayName: 'Маньяк',
            emoji: '🔪',
            cssClass: 'tag-Maniac',
            alignment: 'neutral',
            actionType: 'select',
            isNightRole: true,
            canSkip: false,
            temperament: 'aggressive'
        }
    },

    /**
     * ПОРЯДОК АКТИВАЦИИ РОЛЕЙ НОЧЬЮ
     * Определяет, в каком порядке активируются роли
     */
    NIGHT_ROLE_ORDER: ['Doctor', 'Mafia', 'Maniac', 'Detective'],

    /**
     * СТАНДАРТНЫЕ КОНФИГУРАЦИИ ИГРЫ
     */
    DEFAULT_ROLE_CONFIG: {
        Mafia: 1,
        Maniac: 0,
        Detective: 1,
        Doctor: 1
    },

    /**
     * УСЛОВИЯ ПОБЕДЫ
     * Проверяются после каждого события
     */
    WIN_CONDITIONS: {
        mafia: {
            check: (alive, mafia, maniac) => mafia > 0 && mafia >= (alive - mafia - maniac),
            message: 'winMafia'
        },
        maniac: {
            check: (alive, mafia, maniac) => maniac > 0 && alive <= 2 && mafia === 0,
            message: 'winManiac'
        },
        citizens: {
            check: (alive, mafia, maniac) => mafia === 0 && maniac === 0,
            message: 'winCitizen'
        }
    },

    /**
     * ФРАЗЫ И СООБЩЕНИЯ
     * Структурирована по типам событий
     */
    PHRASES: {
        // Начало ночи (по темпераменту роли)
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

        // Промпты для каждой роли
        rolePrompts: {
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

        // Пропуск хода
        confirmSkip: [
            "Ход роли {role} будет пропущен. Продолжить? 💤",
            "У роли {role} на эту ночь нет планов. Подтверждаешь? 🏥",
            "Действие ({role}) не выбрано. Оставить всё как есть? 🌑",
            "Похоже, {role} сегодня в режиме созерцания. Продолжаем?"
        ],

        // Убийства
        morningKilled: [
            "Результат ночи: {name} — вне игры. ⚰️",
            "Список потерь этого утра: {name}. Какая досада.",
            "Утро началось не для всех. Покидают стол: {name}.",
            "Протокол осмотра места событий: {name} больше не с нами. 🐛"
        ],

        // Безопасные ночи
        morningSafe: [
            "Удивительно, но этой ночью все проснулись живыми. Мафия стареет? 😴",
            "Матрасы целы, головы на месте. Ночь прошла без огонька. ✨",
            "Ни одного трупа? Ведущему скучно, а городу повезло. 🍀"
        ],

        // День - изгнание
        dayExile: [
            "Общественное мнение против {name}. Подтвердить изгнание? ⚖️",
            "Решение толпы: исключить {name} из списка живых?",
            "Приговор для {name}: привести в исполнение? 🪓",
            "Голоса подсчитаны. Сказать {name} 'прощай'? 👋"
        ],

        // Победы
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
    }
};

/**
 * Вспомогательные функции для работы с конфигурацией
 */
const ConfigUtils = {
    /**
     * Получить случайную фразу по ключу
     */
    getRandomPhrase(key, subKey = null, data = {}) {
        let list;

        // Определяем базовый список фраз
        if (key === 'nightStart' && data.roleType) {
            list = GAME_CONFIG.PHRASES.nightStart[data.roleType];
        } else if (key === 'rolePrompts') {
            list = GAME_CONFIG.PHRASES.rolePrompts[data.role];
        } else {
            list = subKey 
                ? GAME_CONFIG.PHRASES[key]?.[subKey] 
                : GAME_CONFIG.PHRASES[key];
        }

        // Fallback
        if (!list || !list.length) {
            console.warn(`Phrases not found for: ${key}${subKey ? '.' + subKey : ''}`);
            return ""; 
        }

        // Выбор случайной фразы
        let str = list[Math.floor(Math.random() * list.length)];

        // Подстановка данных
        for (let k in data) {
            str = str.replaceAll(`{${k}}`, data[k]);
        }

        return str;
    },

    /**
     * Получить информацию о роли
     */
    getRoleInfo(roleName) {
        return GAME_CONFIG.ROLES[roleName];
    },

    /**
     * Получить все ночные роли (активные)
     */
    getNightRoles() {
        return GAME_CONFIG.NIGHT_ROLE_ORDER.filter(r => GAME_CONFIG.ROLES[r].isNightRole);
    },

    /**
     * Получить только ночные роли, которые активны в текущей игре
     */
    getActiveNightRoles(gameRoles) {
        return GAME_CONFIG.NIGHT_ROLE_ORDER.filter(r => 
            gameRoles[r] && gameRoles[r] > 0 && GAME_CONFIG.ROLES[r].isNightRole
        );
    }
};
