import { HomeIcon, PuzzlePieceIcon, UsersIcon, Cog6ToothIcon, PaperAirplaneIcon, CommandLineIcon, CubeTransparentIcon } from "@heroicons/react/24/outline";

const navItems = [
    { name: "Главная", icon: HomeIcon, href: "/" },
    { name: "Команды", icon: CommandLineIcon, href: "/commands" },
    { name: "Плагины", icon: PuzzlePieceIcon, href: "/plagins" },
    { name: "Пользователи", icon: UsersIcon, href: "/users" },
    { name: "Рассылки", icon: PaperAirplaneIcon, href: "/send" },
    { name: "Настройки", icon: Cog6ToothIcon, href: "/settings" },
    { name: "О проекте", icon: CubeTransparentIcon, href: "/about" }
];

const checkPage = () => {
    const index = navItems.findIndex((item: any) => item.href === location.pathname);
    return index >= 0 ? index : 0;
}

export { navItems, checkPage }
