
import { useState } from "react";
import { useAppContext } from "../layout/AppLayout";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function Login() {
    const context = useAppContext();
    const { handleLogin } = context;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const loging = () => {
        if (!username || !password) return;
        handleLogin(username, password);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body p-8">
                    <div className="flex flex-col items-center mb-8">
                        <UserIcon className="h-12 w-12 text-primary mb-2" />
                        <h1 className="text-3xl font-extrabold text-base-content mb-1">Вход в панель</h1>
                        <p className="text-sm text-base-content/60">Управление вашим Telegram ботом</p>
                    </div>
                    <div className="flex flex-col gap-6">
                        <label className="form-control w-full">
                            <div className="label mb-2">
                                <span className="label-text">Логин</span>
                            </div>
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
                                    className="input input-primary w-full pl-10 rounded-md"
                                />
                            </div>
                        </label>
                                              
                              
                        <label className="form-control w-full">
                            <div className="label mb-2">
                                <span className="label-text">Пароль</span>
                            </div>
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
                                    className="input input-primary w-full pl-10 rounded-md"

                                />
                            </div>
                        </label>
                        <button
                            onClick={loging}
                            className="btn btn-primary w-full mt-2 rounded-md"
                        >
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}