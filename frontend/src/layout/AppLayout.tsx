import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ThemeSwitcher from "../components/themeSwithcer";
import Toast from "../components/toast";
import type { UserType, ToastType, MainDataType, BotSetting } from "../interface/types";
import { getProfile, login } from "../script/api";
import api from "../script/apiFetch";

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
    botSetting: BotSetting;
}

const AppContext = createContext<AppLayoutContext | null>(null);


export function AppLayoutProvider({ children }: AppLayoutProviderProps) {
    const [theme, setTheme] = useState("light");
    const [user, setUser] = useState<UserType>();
    const [data, setData] = useState<MainDataType>();
    const [loading, setLoading] = useState<boolean>(true);
    const [botRebut, setBotReboat] = useState<boolean>(false);
    const isFirstLoad = useRef(true);
    const [botSetting] = useState<BotSetting>(localStorage.getItem("bot_settings_v1") ? JSON.parse(localStorage.getItem("bot_settings_v1") as string) : {});

    const handleLogin = async (username: string, password: string) => {
        const data = await login(username, password);
        if (data.token) {
            localStorage.setItem("token", data.token);
            const profile = await getProfile(data.token);
            setUser(profile.user);
        } else {
            callToast("error", data.error);
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        setUser(undefined);
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            getProfile(token).then((profile) => {
                setUser(profile.user);
            });
        }
        const fetchData = async () => {
            const res = await api.get(`/api/main-data/${botSetting.name}`);
            setData(res.data);
            setLoading(false);
            setTimeout(() => isFirstLoad.current = false, 1000);
            
        }
        fetchData();

    }, []);


    // заменяем одиночный toast на очередь
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
        // новые сверху
        setToasts(prev => [item, ...prev]);

        const timer = window.setTimeout(() => {
            removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);

        return { status, message };
    };

    // Очистка всех таймеров при размонтировании
    useEffect(() => {
        return () => {
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current.clear();
        };
    }, []);

    useEffect(() => {
        if (isFirstLoad.current) return;
        setBotReboat(true);
    }, [data]);

    return (
        <AppContext.Provider value={{ theme, setTheme, user, handleLogin, callToast, logout, data, setData, loading, botRebut, setBotReboat, botSetting }}>
            {children}
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