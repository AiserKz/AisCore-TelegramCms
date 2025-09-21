import { useEffect, useState } from "react";
import type { BotLightSetting, BotSetting, NewBotSetting, UserType } from "../interface/types";
import { ArrowRightIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../script/apiFetch";
import StatusBar from "../components/statusBar";
import versionApp from "../data/version";
import { AxiosError } from "axios";


export default function BotSelect({ setBotSetting, user }: { setBotSetting: React.Dispatch<React.SetStateAction<BotSetting | null>>, user: UserType | undefined }) {
    const [botList, setBotList] = useState<BotLightSetting[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedBot, setSelectedBot] = useState<BotLightSetting | null>(null);
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const [is_NewBot, setIsNewBot] = useState<boolean>(false);
    const [newBotData, setNewBotData] = useState<NewBotSetting | null>(null);

    const [maxBots] = useState<number>(5);
    const [is_Done, setIsDone] = useState<boolean>(false);

    useEffect(() => {
        const fetchBots = async () => {
            setLoading(true);
            const res = await api.get("/api/bot/list"); 
            if (!res || !res.data) return;
            setBotList(res.data);
            setLoading(false);
        }
        fetchBots();
    }, []);

    useEffect(() => {
        if (!newBotData?.token) return;
        setIsDone(false);
    }, [newBotData?.token]);

    const handleSelectBot = (bot: BotLightSetting) => setSelectedBot(bot);

    const checkToken = async () => {
        if (!newBotData || !newBotData.token || newBotData.token.trim() === '') {
            setError('Пожалуйста, введите токен бота');
            return false;
        }
        try {
            const res = await api.post("/api/check_token", { token: newBotData?.token });
            if (res.status === 200) {
                setNewBotData((prev) => ({ ...(prev || {}), name: res.data.bot?.first_name || '' }));
                setError('');
                setIsDone(true);
                return true;
            }
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                let error = e.response?.data?.error || 'Ошибка при проверке токена';
                setIsDone(false);
                setError(error);
            } else {
                setError("Неизвестная ошибка");
            }
        }
        return false;
    }

    const fetchCheckBot = async (password: string) => {
        if (!selectedBot) return false;
        try {
            const res = await api.get("/api/bot/check", { params: { bot_id: selectedBot?.id, password } });
            if (res.status === 200) {
                setBotSetting(res.data);
                localStorage.setItem("bot_settings_v1", JSON.stringify(res.data));
                window.location.reload();
            }
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                let error = e.response?.data?.error || 'Ошибка при проверке бота';
                setError(error);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    }

    const fetchCreateBot = async () => {
        if (botList.length >= maxBots) {
            setError(`Вы достигли максимального количества ботов (${maxBots}). Пожалуйста, удалите существующего бота, прежде чем создавать нового.`);
            return false;
        }
    
        if (!newBotData || !newBotData.name || newBotData.name.trim() === '') {
            setError('Пожалуйста, введите имя бота');
            return false;
        }
        try {
            const res = await api.post("/api/bot/create", newBotData);
            if (res.status === 200) {
                console.log(res.data);
                setBotSetting(res.data);
                localStorage.setItem("bot_settings_v1", JSON.stringify(res.data));
                window.location.reload();
            }
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                let error = e.response?.data?.error || 'Ошибка при создании бота';
                setError(error);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    }

    const handleDeleteBot = async (botname: string) => {
        try {
            const res = await api.delete(`/api/bot/${botname}`);
            if (res.status === 200) {
                setBotList(botList.filter(bot => bot.name !== botname));
            }
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                let error = e.response?.data?.error || 'Ошибка при удалении бота';
                setError(error);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    }

    const renderItems = () => {
        if (loading) return Array.from({ length: 3 }).map((_, index) => (<SkeletonTableBot key={index} />));
        return botList.length !== 0 ? botList.map((bot) => (
                    <div key={bot.name} className={`bg-base-100 rounded-lg p-4 
                                                    w-full hover:bg-base-200 cursor-pointer hover:translate-x-1
                                                    transition-all duration-300 border-l-8
                                                    justify-between flex items-center ${bot.is_active ? 'border-success/40' : 'border-transparent'}`}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold">{bot.name} </h2>
                                <span className="text-xs text-base-content/50">(ID: {bot.id})</span>
                                <div className="text-xs">
                                    <StatusBar isActive={bot.is_active || false} />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-base-content/50">Создан: {new Date(bot.created_at || '').toLocaleDateString()}</p>
                                <p className="text-xs text-base-content/50">Обновлен: {new Date(bot.updated_at || '').toLocaleDateString()}</p>
                                <p className="text-sm text-base-content/70 break-all">Токен: ......{bot.token.substring(bot.token.length - 5)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {user && user.level >= 2 && (
                                <TrashIcon className="h-6 w-6 text-red-400 mr-4 hover:text-base-content transition-colors"
                                    onClick={() => handleDeleteBot(bot.name)} />
                            )}
                            <ArrowRightIcon className="h-6 w-6 text-base-content/50 hover:text-base-content transition-colors" onClick={() => handleSelectBot(bot)} />
                        </div>
                    </div>
                )) : <p className="text-base-content/70">У вас еще нет ботов. Пожалуйста, добавьте бота в настройках.</p>;
    }

    return (
        <div className="min-h-screen flex justify-center items-center flex-col gap-4 relative">
            {is_NewBot ? (
                <div className="bg-base-200 rounded p-8 flex flex-col gap-4 md:min-w-md max-w-lg shadow-md">
                    <div className="flex items-center justify-between gap-2 ">
                        <div>
                            <h2 className="text-lg font-semibold">Создание нового бота</h2>
                            <p className="text-sm text-base-content/50">Пожалуйста, заполните все необходимые поля для создания нового бота.</p>
                        </div>
                        <div>
                            <XMarkIcon className="h-10 w-6 text-base-content/50 transition-transform hover:scale-110 cursor-pointer duration-300"
                            onClick={() => { setIsNewBot(false); setNewBotData(null); setError(''); }} />
                        </div>
                    </div>
                    <label className="floating-label">
                        <span>Введите имя бота:</span>
                        <input type="text" className="input input-bordered w-full mb-2" placeholder="Введите имя бота" value={newBotData?.name || ''} 
                        onChange={(e) => setNewBotData((prev) => ({ ...(prev || {}), name: e.target.value || '' }))} />
                    </label>

                    <label className="floating-label flex">
                        <span>Введите токен бота:</span>
                        <input type="text" className="input input-bordered w-full mb-2" placeholder="Введите токен бота" value={newBotData?.token || ''} 
                            onChange={(e) => setNewBotData((prev) => ({ ...(prev || {}), token: e.target.value || '' }))} />
                        <button className="btn btn-accent btn-soft ml-2" onClick={checkToken} disabled={!newBotData?.token}>Проверить</button>
                    </label>

                    <label className="floating-label">
                        <span>Введите пароль для бота:</span>
                        <input type="password" className="input input-bordered w-full mb-2" placeholder="Введите пароль для бота" value={newBotData?.password || ''} 
                            onChange={(e) => setNewBotData((prev) => ({ ...(prev || {}), password: e.target.value || '' }))} />
                    </label>

                    <button className="btn btn-success w-full" onClick={fetchCreateBot} disabled={!is_Done || !newBotData?.token}>Создать бота </button>

                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                </div>

            ) : selectedBot ? (
                <div className="bg-base-200 rounded p-8 flex flex-col gap-4 md:min-w-md max-w-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-lg">Пароль от бота</span>
                            <span className="text-sm text-base-content/50 ml-2">({selectedBot.name})</span>
                            <span className="text-sm text-base-content/50 ml-2">ID: {selectedBot.id}</span>
                        </div>
                        <div>
                            <XMarkIcon className="h-10 w-6 text-base-content/50 transition-transform hover:scale-110 cursor-pointer duration-300"
                            onClick={() => setSelectedBot(null)} />
                         </div>
                    </div>
                    <p className="text-sm text-base-content/70 mb-2">Для безопасности, пожалуйста, введите пароль от бота, чтобы подтвердить, что вы являетесь владельцем этого бота.</p>
                    <input type="password" className="input input-bordered w-full mb-2" placeholder="Введите пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="btn btn-primary w-full btn-soft" onClick={() => fetchCheckBot(password)}>Подтвердить</button>
                    {error && <p className="text-sm text-red-400 mt-2 text-center">{error}</p>}
                </div>
            ) : (
                <div className="flex flex-col gap-4 items-center">
                    <div className="bg-base-200 shadow-md rounded p-6 flex flex-col items-center gap-4 md:min-w-md max-w-lg">
                        <div className="w-full flex justify-between items-center">
                            <span className="text-sm text-base-content/50 mr-6"></span>
                            <h1 className="text-2xl font-bold text-center">Выбор бота</h1>
                            <span className="text-sm text-base-content/50">{botList.length }/{maxBots}</span>
                        </div>
                        <p className="text-center text-base-content/70">Выберите бота, которого вы хотите управлять</p>
                        <div className="max-h-[50dvh] overflow-y-auto w-full overflow-x-hidden scroll-bar-none  flex flex-col gap-4 mt-4">
                            {renderItems()}
                        </div>
                    </div>
                    <div onClick={() => {
                        if (botList.length >= maxBots) return;
                        setIsNewBot(true);
                    }} className={`flex flex-col items-center border border-dashed border-gray-600 min-w-screen md:min-w-md
                                    rounded-lg p-4 transition duration-500 ${botList.length >= maxBots ? 'opacity-50': 'hover:bg-base-200 hover:scale-105 cursor-pointer'}`}>
                        Добавить бота
                        <PlusIcon className="h-6 w-6" />
                    </div>
                </div>
            )}
            
            <div className="text-xs text-base-content/50 absolute bottom-4">
                <p>AisCore {versionApp}</p>
            </div>
        </div>
    )
}


const SkeletonTableBot = () => {
    return (
        <div className="bg-base-100 rounded-lg p-4 w-full h-25 animate-pulse">
            <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-2 w-full">
                    <span className="h-6 rounded w-32 skeleton"></span>
                    <span className="h-10 rounded w-48 skeleton"></span>
                </div>
                <span className="h-8 rounded w-10 skeleton"></span>
            </div>
        </div>
    )
}