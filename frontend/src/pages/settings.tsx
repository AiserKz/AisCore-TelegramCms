import { useEffect, useMemo, useState } from "react";
import api from "../script/apiFetch";
import type { SettingsState, BotSetting } from "../interface/types";
import { useAppContext } from "../layout/AppLayout";
import ModalUsers from "../components/setting/modalUsers";



const DEFAULTS: SettingsState = {
  webhookUrl: "",
  timezone: "UTC",
  language: "ru",
  commandPrefix: "/",
  enableWebhooks: true,
  enableNotifications: true,
  maxMessageLength: 4096,
};

const DEFAULT_SETTINGS: BotSetting = {
  name: "",
  token: "",
  config: DEFAULTS,
};

// Небольшой список таймзон — при необходимости дополнять
const TIMEZONES = [
  "UTC",
  "Europe/Moscow",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
];

export default function Settings() {
  const context = useAppContext();
  const { data } = context;
  const [settings, setSettings] = useState<BotSetting>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [searchTz, setSearchTz] = useState("");
  const [dev] = useState(true);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifySelectedIds, setNotifySelectedIds] = useState<number[]>([]);
  const filteredTimezones = useMemo(
    () =>
      TIMEZONES.filter((t) =>
        t.toLowerCase().includes(searchTz.trim().toLowerCase())
      ),
    [searchTz]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bot_settings_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        // поддержка старой структуры (если сохранён просто SettingsState)
        if (parsed && typeof parsed === "object") {
          if (parsed.config && parsed.name !== undefined) {
            setSettings(parsed as BotSetting);
          } else {
            setSettings({ ...DEFAULT_SETTINGS, config: { ...(DEFAULTS), ...(parsed as Partial<SettingsState>) }});
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Обновление верхнего уровня (name, token)
  const updateTop = <K extends keyof Omit<BotSetting, "config">>(key: K, value: BotSetting[K]) => {
    setSettings(prev => ({ ...prev, [key]: value } as BotSetting));
  };

  // Обновление вложенного config
  const updateConfig = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, config: { ...prev.config, [key]: value } }));
  };

  // Открыть модалку получателей — предзаполняем selectedIds по chat_id из settings.config.notifyChatIds
  const openNotifyModal = () => {
    const saved = settings.config.notifyChatIds ?? [];
    // сопоставляем chat_id -> user.id
    const ids = (data?.users || []).filter(u => saved.includes(u.chat_id)).map(u => u.id);
    setNotifySelectedIds(ids);
    setNotifyModalOpen(true);
  };

  const saveSettings = async () => {
    try {
      // собираем chat_id из выбранных user.id
      const chatIds = (data?.users || []).filter(u => notifySelectedIds.includes(u.id)).map(u => u.chat_id);
      const settingsToStore = { ...settings, config: { ...settings.config, notifyChatIds: chatIds } };
      localStorage.setItem("bot_settings_v1", JSON.stringify(settingsToStore));
      setStatus("Настройки сохранены");
      // отправляем на бэкенд
      const res = await api.post("/api/bot/config", settingsToStore);
      console.log(res);
      // обновляем локально state (чтобы UI отобразил notifyChatIds)
      setSettings(settingsToStore);
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus("Ошибка сохранения");
      setTimeout(() => setStatus(null), 2500);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setStatus("Сброшено к значениям по умолчанию");
    setTimeout(() => setStatus(null), 2500);
  };

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
      setStatus("Токен выглядит корректным (для реального теста вызовите API)");
    }
    setTesting(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="text-base-content w-full">
      <div className="container mx-auto py-8">
        <div className="navbar bg-base-100 rounded-box mb-6 shadow">
          <div className="flex-1">
            <span className="text-xl font-bold">Настройки бота</span>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
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

          <div className="card bg-base-200 p-4 shadow">
            <h3 className="text-lg font-bold mb-2">Локализация и время</h3>
            <div className="grid grid-cols-1 gap-3">
              <label>
                <span className="label-text">Язык по умолчанию</span>
                <select
                  className="select select-bordered w-full"
                  disabled={dev}
                  value={settings.config.language}
                  onChange={(e) => updateConfig("language", e.target.value)}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uk">Українська</option>
                  <option value="tr">Türkçe</option>
                </select>
              </label>

              <label>
                <span className="label-text">Часовой пояс</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                   
                    className="input input-bordered w-1/3"
                    placeholder="Поиск..."
                    value={searchTz}
                    onChange={(e) => setSearchTz(e.target.value)}
                  />
                  <select
           
                    className="select select-bordered flex-1"
                    value={settings.config.timezone}
                    onChange={(e) => updateConfig("timezone", e.target.value)}
                  >
                    {filteredTimezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-xs text-base-content/60">
                  Влияет на отображение времени в логах и расписаниях.
                </span>
              </label>
            </div>
          </div>

          <div className="card bg-base-200 p-4 shadow">
            <h3 className="text-lg font-bold mb-2">Дополнительно</h3>
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="label-text">Включить Webhooks</div>
                  <div className="text-xs text-base-content/60">
                    Если включено — бот будет ожидать входящие webhook'и.
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={dev}
                  className="toggle"
                  checked={settings.config.enableWebhooks}
                  onChange={(e) => updateConfig("enableWebhooks", e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="label-text">Уведомления об ошибках</div>
                  <div className="text-xs text-base-content/60">
                    Отправлять админ-уведомления о критических ошибках.
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Выбранных: {notifySelectedIds.length}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={settings.config.enableNotifications}
                    onChange={(e) => updateConfig("enableNotifications", e.target.checked)}
                  />
                  <button className="btn btn-ghost btn-sm mt-1" onClick={openNotifyModal}>Настроить получателей</button>
                </div>
              </label>

              <div>
                <span className="label-text">Интеграции / Proxy</span>
                <input
                  type="text"
                  disabled={dev}
                  className="input input-bordered w-full"
                  placeholder="socks5://user:pass@host:port (опционально)"
                />
                <span className="text-xs text-base-content/60">
                  Поле для дополнительных интеграций или прокси (при необходимости).
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-base-content/60">{status}</div>
            <div className="flex gap-2">
              <button className="btn" onClick={resetToDefaults}>
                Сбросить
              </button>
              <button className="btn btn-primary" onClick={saveSettings}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка выбора пользователей для уведомлений */}
      <ModalUsers
        selectedIds={notifySelectedIds}
        setSelectedIds={setNotifySelectedIds}
        searchQuery={searchTz/* reuse or provide separate state? */} // если хотите отдельный поиск, можно вынести new state
        setSearchQuery={setSearchTz}
        isModalOpen={notifyModalOpen}
        setIsModalOpen={setNotifyModalOpen}
        data={data}
      />
    </div>
  );
}