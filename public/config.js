window.Config = {
    // Название сайта
    SiteName: 'Nerjel',

    // UptimeRobot Api Keys
    // Поддерживает Monitor-Specific и Read-Only
    ApiKeys: [
        'm800673107-e0c2ebe9751e77346e8481a0', // Read-Only ключ
        'm800673135-585a7f95c55b61c43bc818b4', // Read-Only ключ
        'm800911467-ae3c9c2dc001bd9dc4a6bd1a', // Read-Only ключ
        'm801031885-db86f05252c99d9bc8d58a76', // Read-Only ключ
        // 'm800679644-4ee3480057a34ce157103cba', // Read-Only ключ
    ],

    // URL для проверки пинга (по порядку соответствуют API ключам)
    PingUrls: [
        'http://itachi.nj0.ru', // Для первого API ключа
        'http://hidan.nj0.ru', // Для второго API ключа
        'http://yugito.nj0.ru', // Для третьего API ключа
        'http://lando.nj0.ru', // Для четвертого API ключа
    ],

    // Количество дней в логах
    CountDays: 20,

    // Показывать ли ссылки на проверяемые сайты
    ShowLink: false,

    // Настройки пинга
    PingSettings: {
        enabled: true,
        timeout: 3000,
        attempts: 3,
        interval: 15000, // Обновление каждые 15 сек
    },

    // Меню навигации
    Navi: [
        {
            text: 'support',
            url: 'https://t.me/nerjel_help',
        },
        // {
        //     text: 'GitHub',
        //     url: 'https://github.com/yb/uptime-status',
        // },
        // {
        //     text: 'Блог',
        //     url: 'https://abo.xyz/',
        // },
    ],
}
