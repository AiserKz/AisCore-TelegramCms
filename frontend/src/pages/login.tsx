import { useState, useEffect } from "react";
import { useAppContext } from "../layout/AppLayout";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import useTitle from "../script/useTitle";

export default function Login() {
    useTitle("Вход");
    const context = useAppContext();
    const { handleLogin } = context;

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const [remember, setRemember] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const loging = async () => {
        if (!username || !password) return;
        setLoading(true);
        try {
            await handleLogin(username, password);
        } catch (e) {
            setError('Неправильный логин или пароль');
        } finally {
            setLoading(false);
        }
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') loging();
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-6">
            <div className={`card w-full max-w-md shadow-2xl bg-base-100 transform transition-all rgb-btn-purple duration-500 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
                <div className="card-body p-8">
                    <div className="flex flex-col items-center mb-6 select-none">
                        <img src="/Logo.png" alt="Logo" className="w-25 h-25 select-none" />
                        <h1 className="text-2xl font-extrabold text-base-content mb-1">Вход в панель</h1>
                        <p className="text-sm text-base-content/60">Управление вашим Telegram-ботом</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="form-control w-full">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-base-content/40 z-10" />
                                </span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Логин"
                                    onChange={(e) => setUsername(e.target.value)}
                                    value={username}
                                    onKeyDown={onKeyDown}
                                    className="input input-bordered w-full pl-10 rounded-md focus:ring-2 focus:ring-primary/30 transition"
                                />
                            </div>
                        </label>

                        <label className="form-control w-full">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-base-content/40 z-10" />
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Пароль"
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    onKeyDown={onKeyDown}
                                    className="input input-bordered w-full pl-10 rounded-md focus:ring-2 focus:ring-primary/30 transition"
                                />
                            </div>
                        </label>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="checkbox" />
                                <span>Запомнить меня</span>
                            </label>
                            <a href="#" className="text-primary hover:underline">Забыли пароль?</a>
                        </div>

                        <button
                            onClick={loging}
                            className={`btn btn-primary w-full mt-2 rounded-md flex items-center justify-center gap-3 ${loading ? 'opacity-90' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" />
                                    <span>Вход...</span>
                                </>
                            ) : (
                                <span>Войти</span>
                            )}
                        </button>

                        <div className="text-center text-xs text-base-content/60 mt-2">
                            <span>Нет аккаунта? </span>
                            <a href="#" className="text-primary hover:underline">Свяжитесь с администратором</a>
                        </div>
                        <span className="text-sm text-error mt-2 text-center">
                            {error}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}