import type { PluginType } from "../interface/types";

const pluginsTestData: PluginType[] = [
    {
        id: 5,
        name: "Echo",
        enabled: false,
        description: "Простой плагин-эхо: повторяет сообщение пользователя.",
        price: 0,
        version: "1.0.0",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/Echo.zip",
        poster: "https://interesnyefakty.org/wp-content/uploads/chto-takoe-plagin.jpg"
    },
    {
        id: 6,
        name: "Welcome",
        enabled: false,
        description: "Отправляет приветственное сообщение новым пользователям.",
        price: 199,
        version: "1.2.0",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/Welcome.zip",
        poster: "https://content.timeweb.com/assets/65c70e62-4ae9-48bc-92ff-7886de5f50fa.jpg?width=3080&height=1600"
    },
    {
        id: 11,
        name: "Calculator",
        enabled: false,
        description: "Калькулятор.",
        price: 0,
        version: "1.0.2",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/Calculator.zip",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4msaMIrvPeFegjYbfOVjSWO5jEmnQQKKqvQ&s"
    },
    {
        id: 9,
        name: "Weather",
        enabled: false,
        description: "Показывает погоду.",
        price: 0,
        version: "1.0.2",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/Weather.zip",
        poster: "https://img.freepik.com/premium-vector/weather-logo-gradient-vector-icon-illustration_269830-2064.jpg"
    },
    {
        id: 10,
        name: "WebAppButton",
        enabled: false,
        description: "Веб-приложение Кнопка рядом с полем ввода.",
        price: 0,
        version: "1.0.2",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/WebAppButton.zip",
        poster: "https://habrastorage.org/getpro/habr/upload_files/159/0bf/7f2/1590bf7f2c9295f7934da9b760d8696e.jpeg"
    },
    {
        id: 7,
        name: "Translate",
        enabled: false,
        description: "Переводит сообщение в другую локаль.",
        price: 299,
        version: "1.0.0",
        author: "Aiser",
        license: "Ais",
        url: "http://localhost:5000/static/uploads/plugins/Translate.zip",
        poster: "https://translations.telegram.org/img/translations/lang_banner.png?1"
    },
    // {
    //     id: 12,
    //     name: "AutoResponder",
    //     enabled: false,
    //     description: "Автоответчик по ключевым словам.",
    //     price: 299,
    //     version: "1.0.2",
    //     author: "Aiser",
    //     license: "Ais",
    //     url: "http://localhost:5000/static/uploads/plugins/Autoreponder.zip",
    //     poster: "https://play-lh.googleusercontent.com/NgqZfB39BS_DRtFhfrPcwFvabP5CJsMQl5rMsexEkpxse4StzNrJ2LwHOwke__FSwA"
    // }
]

export default pluginsTestData

// {
//     id: 8,
//     name: "Analytics",
//     enabled: false,
//     description: "Собирает статистику по действиям пользователей и командам.",
//     price: 499,
//     version: "0.9.1",
//     author: "Aiser Labs",
//     license: "Ais",
//     url: "aisblack.ru",
//     poster: "https://minesborka.com/uploads/posts/2021-06/1623506343_poster1234242423224.png"
// },