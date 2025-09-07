import { CloudIcon, MoonIcon, SparklesIcon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";


// DaisyUI ThemeSwitcher (используем встроенный select)
export default function ThemeSwitcher() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const renderIconSelect = () => {
        switch (theme) {
            case "light":
                return <SunIcon className="h-6 w-6" />;
            case "dark":
                return <MoonIcon className="h-6 w-6" />;
            case "silk":
                return <CloudIcon className="h-6 w-6" />;
            case "night":
                return <SparklesIcon className="h-6 w-6" />;
            default:
                return <SunIcon className="h-6 w-6" />;
        }
    }
    
    return (
        <div className="fab fab-flower">
            <div tabIndex={0} role="button" className="btn btn-lg btn-info btn-circle">{renderIconSelect()}</div>
            <button className="fab-main-action btn btn-circle btn-lg btn-success"><XMarkIcon className="h-6 w-6" /></button>

            <div className="tooltip tooltip-left" data-tip="Светлая">
                <button className="btn btn-lg btn-circle btn-soft btn-secondary" onClick={() => setTheme("light")}><SunIcon className="h-6 w-6" /></button>
            </div>
            
            <div className="tooltip tooltip-left" data-tip="Темная">
                <button className="btn btn-lg btn-circle btn-soft" onClick={() => setTheme("dark")}><MoonIcon className="h-6 w-6" /></button>
            </div>
            
            <div className="tooltip tooltip-left" data-tip="Щелк">
                <button className="btn btn-lg btn-circle btn-soft btn-info" onClick={() => setTheme("silk")}><CloudIcon className="h-6 w-6" /></button>
            </div>
            
            <div className="tooltip tooltip-left" data-tip="Ночь">
                <button className="btn btn-lg btn-circle btn-soft btn-primary" onClick={() => setTheme("night")}><SparklesIcon className="h-6 w-6" /></button>
            </div>

        </div>
    );
}