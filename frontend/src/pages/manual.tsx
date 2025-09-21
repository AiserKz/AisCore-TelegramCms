import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface Block {
  id: string;
  title: string;
  description: string;
  image: string;
}

const blocks: Block[] = [
  {
    id: "login",
    title: "Вход",
    description: "Здесь вы входите в систему, используя свой логин и пароль. \n 1. Дефолтный логин и пароль admin. \n 2. Здесь можно выбрать тему сайта.",
    image: "/onboard/Login.png",
  },
  {
    id: "botselect",
    title: "Выбор бота",
    description: "Выберите бота, с которым хотите работать. \n 1. Выберите существующего бота. \n 2. Добавление нового бота.",
    image: "/onboard/BotSelect.png",
  },
  {
    id: "botNew",
    title: "Создание нового бота",
    description: "Добавьте нового бота и настройте его параметры. \n 1. Вставьте токен бота. \n 2. Нажмите «Проверить токен». \n 3. Установите пароль для входа в панель бота (можно оставить пустым).",
    image: "/onboard/BotNew.png",
  },
  {
    id: "botEnter",
    title: "Вход в панель бота",
    description: " 1. Пароль от панели бота. \n Если бот не требует пароля, то оставьте поле пустым.",
    image: "/onboard/BotSelectPass.png",
  },
  {
    id: "dashboard",
    title: "Панель управления",
    description: "Здесь собраны все основные функции управления ботом. \n 1. Текущий бот. \n 2. Общая статистика. \n 3. Список команд бота. \n 4. Список плагинов. \n 5. Управление запуском и остановкой бота.",
    image: "/onboard/Dashboard.png",
  },
  {
    id: "commandAdd",
    title: "Добавление команды",
    description: "Создайте кастомные команды для вашего бота. \n 1. Название команды. \n 2. Описание команды для панели. \n 3. Текст ответа. \n 4. Сохранение изменений.",
    image: "/onboard/CommandAdd.png",
  },
  {
    id: "plugin",
    title: "Плагины",
    description: "Подключайте плагины для расширения возможностей. \n 1. Список установленных плагинов. \n 2. Библиотека плагинов. \n 3. Магазин плагинов.",
    image: "/onboard/Plugin.png",
  },
  {
    id: "users",
    title: "Пользователи",
    description: "Просмотр статистики и управление пользователями.",
    image: "/onboard/Users.png",
  },
  {
    id: "broadcast",
    title: "Рассылка",
    description: "Отправляйте массовые сообщения всем пользователям. \n 1. Прикрепление медиафайлов. \n 2. Выбор аудитории для рассылки.",
    image: "/onboard/Broadcast.png",
  },
];

type ManualPageProps = {
  readManual: () => void;
};


export default function ManualPage({ readManual }: ManualPageProps) {
  const [active, setActive] = useState(0);

  const nextSlide = () => setActive((prev) => prev === blocks.length - 1 ? prev : (prev + 1) % blocks.length);
  const prevSlide = () => setActive((prev) => prev === 0 ? prev : (prev - 1 + blocks.length) % blocks.length);

  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
        <div className="flex flex-col items-center justify-center w-full md:w-2/3 lg:w-1/2 h-fit">
            <div className="bg-base-200 shadow-md rounded p-6 overflow-hidden transition-all duration-500">
                <h1 className="text-2xl font-bold mb-4 text-center">Руководство</h1>

                {/* Карусель */}
                <div className="relative flex-1 flex-row items-center justify-center">
                    {blocks.map((block, index) => (
                        <div
                        key={block.id}
                        className={`flex flex-col items-center justify-center transition-opacity duration-500 ${
                            active === index ? "" : "hidden"
                        }`}
                        >
                        <img
                            src={block.image}
                            className="w-[90%] h-[40vh] object-cover md:object-fill rounded shadow"
                        />
                        <h2 className="text-xl font-semibold mt-4">{block.title}</h2>
                        <p className="text-sm text-base-content/70 text-center max-w-md mt-2 whitespace-pre-line">
                            {block.description}
                        </p>
                        </div>
                    ))}

                {/* Кнопки */}
                <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 hover:-translate-x-1 transition duration-300 hover:text-primary"
                    onClick={prevSlide}
                >
                    <ChevronDoubleLeftIcon className="h-10 w-10" />
                </button>
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 hover:translate-x-1 transition duration-300 hover:text-primary"
                    onClick={nextSlide}
                >
                    <ChevronDoubleRightIcon className="h-10 w-10" />
                </button>

                    <ul className="steps scroll-bar-none mt-6">
                        {blocks.map((block, index) => (
                        <li
                            key={block.id}
                            className={`step text-xs ${active >= index ? "step-primary" : ""}`}
                            onClick={() => setActive(index)}
                        >
                            {block.title}
                        </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex w-full justify-end">
                <button className={`btn btn-primary mt-12 md:mt-6 transition-opacity duration-500 ${active === blocks.length - 1 ? "opacity-100" : "opacity-0"}`} onClick={readManual}>
                    Начать
                </button>
            </div>
        </div>
    </div>
  );
}
