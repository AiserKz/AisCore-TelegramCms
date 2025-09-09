import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import type { BotPlugin, MainDataType, PluginType } from "../../interface/types";
import api from "../../script/apiFetch";

interface PlagineStoreProps {
    storeList: any[];
    data: any;
    setData: React.Dispatch<React.SetStateAction<MainDataType | undefined>>;
    callToast: any;
    botSetting: any;
}

export default function RenderStoreList({ storeList, data, setData, callToast, botSetting }: PlagineStoreProps) {
    const [installing, setInstalling] = useState<string | null>(null);
    
    const removePlugin = async (plugin: PluginType) => {
        if (!plugin) return;

        try {
            const res = await api.delete(`/api/plugins/${plugin.name}`);
            if (res.status === 200 || res.status === 204) {
                callToast("success", "Плагин удален", 3000);
                setData(prev => {
                    if (!prev) return prev;
                    const plugins = prev.plugins.filter((p: any) => p.name !== plugin.name);
                    return { ...prev, plugins };
                })
            }

        } catch (e) {
            callToast("error", "Не удалось удалить плагин (связь с сервером)", 3000);
        }
    }

    const installPlugin = async (pkg: any) => {
        if (!botSetting?.name) {
            callToast("error", "Bot name not configured", 3000);
            return;
        }
        if (!pkg || !pkg.id) return;
        setInstalling(pkg.id);

        try {
            // POST add возвращает запись bot.plugins (с plugin_id и config)
            const res = await api.post(`/api/plugins/${botSetting.name}/add`, { name: pkg.name, plugin_id: pkg.id });
            if (res.status === 200 || res.status === 201) {
                setData(prev => {
                    if (!prev) return prev;
                    const installed: BotPlugin = {
                        plugin_id: pkg.id,
                        bot_id: prev.bot.id, 
                        enabled: false,
                        config: {},
                        plugin: pkg,
                    };
                    const botPlugins = [...(prev.bot.plugins || []), installed];
                    return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
                });
                callToast("success", `Плагин ${pkg.name} установлен`, 3000);
            } else {
                callToast("error", "Ошибка установки плагина", 3000);
            }
        } catch (e) {
            callToast("error", "Не удалось установить плагин (связь с сервером)", 3000);
        } finally {
            setInstalling(null);
        }
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {storeList.map((pkg: any) => (
                <div key={pkg.id} className="card bg-base-200 p-4 rgb-btn-fire shadow-md shadow-base-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-medium">{pkg.name}</div>
                            <div className="text-sm text-base-content/60">{pkg.description}</div>
                            <div className="text-xs text-base-content/60 mt-2">Версия: {pkg.version} • Автор: {pkg.author}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-sm">{pkg.price ? `${pkg.price} ₽` : "Бесплатно"}</div>
                            {data?.bot?.plugins?.find((p: any) => p.plugin_id === pkg.id) ? (
                                <span className="badge badge-success">Установлен</span>
                            ) : (
                                <button
                                    className="btn btn-sm btn-primary btn-dash w-full"
                                    onClick={() => installPlugin(pkg)}
                                    disabled={!!installing}
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5 " />
                                    {installing === pkg.id ? "Установка..." : "Установить"}
                                </button>
                            )}
                            {!data?.bot?.plugins?.find((p: any) => p.plugin_id === pkg.id) && (
                                <button
                                    className="btn btn-sm btn-error btn-soft text-error w-full"
                                    onClick={() => removePlugin(pkg)}
                                >
                                    <TrashIcon className="w-5 h-5 mr-1" />
                                    Удалить
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}