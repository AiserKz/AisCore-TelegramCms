import React, { useState } from "react";
import type { BotSetting, SettingsState } from "../../interface/types";

interface MainDataSettingProps {
    settings: {
        name: string;
        token: string;
        config: SettingsState;
    };
    updateTop: <K extends keyof Omit<BotSetting, "config">>(key: K, value: BotSetting[K]) => void;
    updateConfig: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
    dev: boolean;
    setStatus: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function MainDataSetting({ settings, updateTop, updateConfig, dev, setStatus }: MainDataSettingProps) {
    const [testing, setTesting] = useState<boolean>(false);

    const testToken = async () => {
        setTesting(true);
        setStatus(null);
        // Простейшая валидация формата токена Telegram: digits:chars
        const token = settings.token.trim();
        const ok = /^(\d+):([A-Za-z0-9_\-]+)$/.test(token);
        // Заглушка сетевого теста
        await new Promise((r) => setTimeout(r, 600));
        if (!token) {
          setStatus("Токен пустой");
        } else if (!ok) {
          setStatus("Токен имеет неверный формат");
        } else {
          setStatus("Токен выглядит корректным");
        }
        setTesting(false);
        setTimeout(() => setStatus(null), 3000);
    };

    return (
        <div className="card bg-base-200 p-4 shadow">
            <h3 className="text-lg font-bold mb-2">Основные</h3>
            <div className="grid grid-cols-1 gap-3">
                <label className="block">
                <span className="label-text">Имя бота (для интерфейса)</span>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Имя бота"
                    value={settings.name}
                    onChange={(e) => updateTop("name", e.target.value)}
                />
                </label>

                <label className="block">
                <span className="label-text">API токен (Bot Token)</span>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="123456:ABC-DEF..."
                    value={settings.token}
                    onChange={(e) => updateTop("token", e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                    <button
                    className="btn btn-sm btn-primary"
                    onClick={testToken}
                    disabled={testing || !settings.token.trim()}
                    >
                    {testing ? "Тест..." : "Проверить токен"}
                    </button>
                    <button
                    className="btn btn-sm"
                    onClick={() => updateTop("token", "")}
                    >
                    Очистить
                    </button>
                </div>
                </label>

                <label className="block">
                <span className="label-text">Webhook URL</span>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="https://example.com/telegram/webhook"
                    value={settings.config.webhookUrl}
                    disabled={dev}
                    onChange={(e) => updateConfig("webhookUrl", e.target.value)}
                />
                <span className="text-xs text-base-content/60">
                    URL для приёма обновлений (оставьте пустым, если используете
                    getUpdates).
                </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label>
                    <span className="label-text">Префикс команд</span>
                    <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.config.commandPrefix}
                    disabled={dev}
                    onChange={(e) => updateConfig("commandPrefix", e.target.value)}
                    />
                </label>

                <label>
                    <span className="label-text">Макс. длина сообщения</span>
                    <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.config.maxMessageLength}
                    min={1}
                    onChange={(e) =>
                        updateConfig("maxMessageLength", Number(e.target.value))
                    }
                    />
                </label>
                </div>
            </div>
        </div>
    )
}