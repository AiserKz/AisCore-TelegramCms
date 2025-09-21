import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ThemeSwitcher from "../components/themeSwithcer";
import Toast from "../components/toast";
import type { UserType, ToastType, MainDataType, BotSetting } from "../interface/types";
import { login } from "../script/api";
import api from "../script/apiFetch";
import BotSelect from "../pages/botSelect";
import Login from "../pages/login";
import versionApp from "../data/version";
import ManualPage from "../pages/manual";

type AppLayoutProviderProps = {
    children: React.ReactNode;
}

type AppLayoutContext = {
    theme: string;
    setTheme: (theme: string) => void;
    user: UserType | undefined;
    data: MainDataType | undefined;
    loading: boolean;
    botRebut: boolean;
    setBotReboat: React.Dispatch<React.SetStateAction<boolean>>;
    setData: React.Dispatch<React.SetStateAction<MainDataType | undefined>>;
    handleLogin: (username: string, password: string) => void;
    callToast: (status: "info" | "success" | "error", message: string, duration?: number) => ToastType;
    logout: () => void;
    botSetting: BotSetting | null;
    authLoading: boolean;
    versionApp: string
}

const AppContext = createContext<AppLayoutContext | null>(null);

type TokenType = {
    access_token: string;
    refresh_token: string;
}

export function AppLayoutProvider({ children }: AppLayoutProviderProps) {
    const [theme, setTheme] = useState("light");
    const [user, setUser] = useState<UserType>();
    const [data, setData] = useState<MainDataType>();
    const [loading, setLoading] = useState<boolean>(true);
    const [botRebut, setBotReboat] = useState<boolean>(false);
    const isFirstLoad = useRef(true);
    const [botSetting, setBotSetting] = useState<BotSetting | null>(localStorage.getItem("bot_settings_v1") ? JSON.parse(localStorage.getItem("bot_settings_v1") as string) : null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    const [isManual, setIsManual] = useState<boolean>(localStorage.getItem("isManual") === "false" ? false : true);

    const handleLogin = async (username: string, password: string) => {
        const data: TokenType = await login(username, password);
        if (data) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            const res = await api.get("/auth/profile");
            setUser(res.data.user);
            fetchData();
        } else {
            callToast("error", "Неправильный логин или пароль");
        }
    }

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("bot_settings_v1");
        setBotSetting(null);
        setUser(undefined);
    }

    const fetchData = async () => {
        if (!botSetting) return;
        const res = await api.get(`/api/main-data/${botSetting.name}`);
        setData(res.data);
        setLoading(false);
        setTimeout(() => isFirstLoad.current = false, 1000);
    }

    useEffect(() => {
        setAuthLoading(true);
        const token = localStorage.getItem("access_token");
        if (token) {
            const res = api.get("/auth/profile");
            res.then(res => setUser(res.data.user)).finally(() => setAuthLoading(false));
        } else {
            setAuthLoading(false);
        }
        if (token && botSetting) {
            fetchData();  
        }

        return () => {
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current.clear();
        };
    }, []);

    type ToastItem = ToastType & { id: number };
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timersRef = useRef<Map<number, number>>(new Map());

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    };

    const callToast = (status: "info" | "success" | "error", message: string, duration: number = 3000): ToastType => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const item: ToastItem = { id, status, message };
        setToasts(prev => [item, ...prev]);

        const timer = window.setTimeout(() => {
            removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);

        return { status, message };
    };

    const readManual = () => {
        setIsManual(false);
        localStorage.setItem("isManual", "false");
    }

    useEffect(() => {
        if (isFirstLoad.current) return;
        setBotReboat(true);
    }, [data]);


    return (
        <AppContext.Provider value={{ theme, setTheme, user, handleLogin, callToast, logout,
            data, setData, loading, botRebut, setBotReboat, botSetting, authLoading, versionApp }}>
            {
                botSetting ? ( children ) : 
                isManual ? <ManualPage readManual={readManual} /> : 
                user ? <BotSelect setBotSetting={setBotSetting} user={user} /> : <Login />
            }
            <ThemeSwitcher />
            <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
                {toasts.map(t => (
                    <div key={t.id} onClick={() => removeToast(t.id)} className="w-80">
                        <Toast status={t.status} message={t.message} />
                    </div>
                ))}
            </div>

        </AppContext.Provider>
    )
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext должен использоваться внутри <AppLayoutProvider>");
    }
    return context;
}