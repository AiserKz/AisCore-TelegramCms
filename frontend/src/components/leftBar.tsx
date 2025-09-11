import { PuzzlePieceIcon, ChevronDoubleLeftIcon, ArrowLeftEndOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../layout/AppLayout";
import { SaveBtn } from "./saveBtn";
import { checkPage, navItems } from "../data/navBarItemsData";
import StartBotBtn from "./startBotBtn";

const logoutItem = { name: "Выйти", icon: ArrowLeftEndOnRectangleIcon, href: "#" };


export default function LeftBar() {
    const context = useAppContext();
    const { user, logout, botRebut, versionApp, botSetting } = context;
    const [opened, setOpened] = useState(localStorage.getItem("opened") === "true" ? true : false);
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState<number>(checkPage());
    useEffect(() => {
        setCurrentPage(checkPage());
       
        if (!botSetting.name && user && location.pathname !== "/settings") {
            window.location.href = "/settings";
        }
    
    }, [location]);

    return (
        <div
            className={` fixed top-0 left-0 h-screen bg-base-100 shadow flex-col justify-between transition-[width] duration-500 ease-out hidden md:flex  ${
                opened ? "w-56" : "w-20"
            }`}
        >
            {/* Кнопка переключения режима */}
            <button
                className="absolute -right-5 top-4 bg-base-100 border border-base-100 rounded-md shadow p-1 flex items-center justify-center transition-all duration-300 hover:bg-base-200"
                onClick={() => {
                    setOpened(!opened);
                    localStorage.setItem("opened", String(!opened));
                }}
                aria-label={opened ? "Свернуть" : "Развернуть"}
            >
                
                <ChevronDoubleLeftIcon className={`h-6 w-6 text-info transition-transform duration-600 ${ opened ? "rotate-180" : ""}` }/>
              
            </button>

            <div className="flex flex-col gap-4 p-4 pt-12">
                <div className="flex items-center gap-2 mb-6 ml-2 select-none">
                    <PuzzlePieceIcon className="h-8 w-8 text-info shrink-0" />
                    <span
                        className={`font-bold text-lg ml-10 text-base-content absolute text-nowrap transition-opacity duration-300 ease-out ${
                            opened ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ pointerEvents: opened ? "auto" : "none" }}
                    >
                        <span className="text-3xl text-base-content"><span className="text-info animate-pulse">A</span>is<span className="text-info">C</span>ore</span>
                        <span className="text-sm text-base-content/60 font-sans m-2">{versionApp}</span>
                    </span>
                </div>
                <nav className="flex flex-col gap-2 relative">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center rounded-md px-2 py-2 hover:bg-info/50 transition-all select-none 
                                ${currentPage === navItems.indexOf(item) ? "bg-info/50 transform scale-105 translate-x-1" : " opacity-70" }`}
                        >
                            <item.icon className="h-7 w-7 text-base-content shrink-0" />
                            <span
                                className={`text-md font-medium text-base-content ml-10 duration-300 absolute transition-opacity ease-out truncate ${
                                    opened ? "opacity-100" : "opacity-0 "
                                }`}
                                style={{ pointerEvents: opened ? "auto" : "none" }}
                            >
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </nav>
                {botRebut && <SaveBtn absolute={false}  opened={opened}/>}
                <StartBotBtn isOpen={opened} />
            </div>
            <div className="border-t border-base-200 p-4 ">
                <div className="flex items-center rounded-md px-2 py-2 hover:bg-base-200 justify-start">
                    <UserIcon className="h-6 w-6 shrink-0" />
                    <span className={`text-xl absolute transition-opacity ml-10 duration-500  ${opened ? "opacity-100" : "opacity-0"}`}>{user?.username}</span>
                    
                </div>
                <button
                    onClick={logout}
                    className={`flex items-center rounded-md px-2 py-2 hover:bg-base-200 transition-colors text-red-400 w-full justify-start `}
                >
                    <logoutItem.icon className="h-6 w-6 shrink-0 cursor-pointer" />
                    <span
                        className={`text-sm font-medium ml-10 absolute transition-opacity duration-500 ${
                            opened ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        {logoutItem.name}
                    </span>
                </button>
            </div>
        </div>
    );
}