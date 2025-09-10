import HeaderPageTitle from "../components/headerPage";
import useTitle from "../script/useTitle";

export default function About() {
    useTitle("О проекте");

    return (
        <div className="text-base-content w-full">
            <div className="container mx-auto py-8">
                <HeaderPageTitle title="О проекте" />

                <div className="space-y-6">
                    <div className="card bg-base-200 p-6 shadow-lg">
                        <h2 className="text-2xl font-bold mb-2">AisCore — CMS для Telegram-ботов</h2>
                        <p className="text-base-content/70">AisCore — это CMS-платформа для Telegram-ботов, вдохновлённая WordPress. Она позволяет создавать и управлять ботами без программирования через удобную веб-панель. Идея проекта — «Бот за 5 минут»: выбери плагины, включи модули и получи работающего помощника.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card bg-base-200 p-4 shadow-md">
                            <h3 className="font-semibold mb-3">Основные возможности</h3>
                            <ul className="space-y-3 text-sm">
                                <li>🧩 <b>Система плагинов</b> — установка, активация и перезагрузка плагинов без рестарта бота.</li>
                                <li>🛒 <b>Онлайн‑магазин</b> — каталог плагинов с описанием, версией и ценой, установка одним кликом.</li>
                                <li>📦 <b>Локальная библиотека</b> — скачанные плагины хранятся локально для дальнейшей активации.</li>
                                <li>🌐 <b>Веб‑панель (React + Vite)</b> — удобный интерфейс управления с мобильной адаптацией.</li>
                                <li>🔑 <b>Авторизация по токенам</b> — безопасные API‑запросы с контролем доступа.</li>
                                <li>🔄 <b>Горячая перезагрузка</b> — плагины и команды подгружаются динамически.</li>
                            </ul>
                        </div>

                        <div className="card bg-base-200 p-4 shadow-md">
                            <h3 className="font-semibold mb-3">Базовые плагины</h3>
                            <ul className="space-y-3 text-sm">
                                <li>🌍 <b>Переводчик текста</b></li>
                                <li>☁️ <b>Погода</b> — команда <code>/weather Город</code></li>
                                <li>📢 <b>Система рассылки</b></li>
                                <li>⚙️ <b>Загрузка новых плагинов</b> с сервера</li>
                            </ul>
                        </div>
                    </div>

                    <div className="card bg-base-200 p-4 shadow-md">
                        <h3 className="font-semibold mb-3">Архитектура проекта</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="font-medium">Bot Core (Aiogram)</div>
                                <div className="text-base-content/70">Ядро бота с системой плагинов и динамических команд.</div>
                            </div>
                            <div>
                                <div className="font-medium">Backend (Flask)</div>
                                <div className="text-base-content/70">API, база данных и управление плагинами/пользователями.</div>
                            </div>
                            <div>
                                <div className="font-medium">Frontend (React + Vite)</div>
                                <div className="text-base-content/70">Админ‑панель с визуальным управлением и адаптивным интерфейсом.</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card bg-base-200 p-4 shadow-md">
                            <h3 className="font-semibold mb-3">Технологии</h3>
                            <ul className="text-sm space-y-2 text-base-content/70">
                                <li>Python: Aiogram, aiohttp, Flask / FastAPI</li>
                                <li>JavaScript: React, Vite</li>
                                <li>БД: MySQL / SQLite</li>
                                <li>Архитектура: асинхронность, динамический импорт, hot‑reload</li>
                            </ul>
                        </div>

                        <div className="card bg-base-200 p-4 shadow-md">
                            <h3 className="font-semibold mb-3">Планы развития</h3>
                            <ul className="text-sm space-y-2 text-base-content/70">
                                <li>Поддержка мультиботов (несколько ботов в одной панели)</li>
                                <li>Маркетплейс плагинов с монетизацией для сторонних разработчиков</li>
                                <li>Подписочная модель (SaaS) — быстрое создание бота для бизнеса</li>
                                <li>Новые плагины: магазин, бронирования, CRM‑интеграции</li>
                            </ul>
                        </div>
                    </div>

                    <div className="card bg-base-200 p-4 shadow-md">
                        <h3 className="font-semibold mb-3">Миссия проекта</h3>
                        <p className="text-base-content/70">Сделать запуск Telegram‑бота простым и доступным для каждого — так же, как WordPress сделал создание сайтов. Наша цель — дать инструмент для бизнеса, сообществ и разработчиков, чтобы они могли быстро и надёжно запускать полезных ботов.</p>
                    </div>

                    <div className="card bg-base-100 p-4 shadow-md border">
                        <h3 className="font-semibold mb-3">Связаться с автором</h3>
                        <p className="text-sm text-base-content/70 mb-3">Если вам нужно что‑то уточнить, предложить фичу или сообщить об ошибке — напишите:</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* <a className="btn btn-primary btn-soft" href="mailto:aibekmiribekov0217@gmail.com">Написать на e‑mail</a> */}
                            <a className="btn btn-info btn-soft" href="https://t.me/aisblackm" target="_blank" rel="noreferrer">Написать в Telegram</a>
                            <span className="text-sm text-base-content/60 btn btn-primary btn-soft">Почта: aibekmiribekov0217@gmail.com</span>
                            <span className="text-sm text-base-content/60">Или создайте issue в репозитории проекта.</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}