import { useEffect, useMemo, useState } from "react";
import api from "../script/apiFetch";
import type { SettingsState, BotSetting } from "../interface/types";
import { useAppContext } from "../layout/AppLayout";
import ModalUsers from "../components/setting/modalUsers";
import HeaderPageTitle from "../components/headerPage";
import MainDataSetting from "../components/setting/mainDataSetting";
import useTitle from "../script/useTitle";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";



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

// Небольшой список таймзон при необходимости дополнять
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
  useTitle("Настройки");
  const context = useAppContext();
  const { data, versionApp, logout, botSetting } = context;
  const [settings, setSettings] = useState<BotSetting>(botSetting || DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string | null>(null);

  const [searchTz, setSearchTz] = useState<string>("");
  const [dev] = useState<boolean>(true);
  const [notifyModalOpen, setNotifyModalOpen] = useState<boolean>(false);
  const [notifySelectedIds, setNotifySelectedIds] = useState<number[]>([]);
  const filteredTimezones = useMemo<string[]>(
    () =>
      TIMEZONES.filter((t) =>
        t.toLowerCase().includes(searchTz.trim().toLowerCase())
      ),
    [searchTz]
  );


  useEffect(() => {
    const saved = settings.config?.notifyChatIds ?? [];
    const ids = (data?.users || []).filter(u => saved.includes(u.chat_id)).map(u => u.id);
    setNotifySelectedIds(ids);
  }, [data, settings]);

  // Обновление верхнего уровня (name, token)
  const updateTop = <K extends keyof Omit<BotSetting, "config">>(key: K, value: BotSetting[K]) => {
    setSettings(prev => ({ ...prev, [key]: value } as BotSetting));
  };

  // Обновление вложенного config
  const updateConfig = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, config: { ...prev.config, [key]: value } }));
  };


  const openNotifyModal = () => {
    const saved = settings.config.notifyChatIds ?? [];
    const ids = (data?.users || []).filter(u => saved.includes(u.chat_id)).map(u => u.id);
    setNotifySelectedIds(ids);
    setNotifyModalOpen(true);
  };

  const saveSettings = async () => {
    try {
      if (!settings.name || !settings.token) {
        setStatus("Название и токен не могут быть пустыми");
        setTimeout(() => setStatus(null), 2500);
        return;
      }
      const chatIds = (data?.users || []).filter(u => notifySelectedIds.includes(u.id)).map(u => u.chat_id);
      const settingsToStore = { ...settings, config: { ...settings.config, notifyChatIds: chatIds } };
      localStorage.setItem("bot_settings_v1", JSON.stringify(settingsToStore));
      setStatus("Настройки сохранены");

      await api.post("/api/bot/config", settingsToStore);

      setSettings(settingsToStore);
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus("Ошибка сохранения");
      setTimeout(() => setStatus(null), 2500);
    } finally {
      if (!settings.name || !settings.token) window.location.href = "/";
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setStatus("Сброшено к значениям по умолчанию");
    setTimeout(() => setStatus(null), 2500);
  };



  return (
    <div className="text-base-content w-full">
      <div className="container mx-auto py-8">
        <HeaderPageTitle title="Настройки" />

        <div className="mx-auto max-w-3xl space-y-6">

          <MainDataSetting settings={settings} updateTop={updateTop} updateConfig={updateConfig} dev={dev} setStatus={setStatus} />

          <div className="card bg-base-200 p-4 shadow">
            <h3 className="text-lg font-bold mb-2">Локализация и время</h3>
            <div className="grid grid-cols-1 gap-3">
              <label>
                <span className="label-text">Язык по умолчанию</span>
                <select
                  className="select select-bordered w-full"
                  disabled={dev}
                  value={settings?.config?.language}
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
                    value={settings.config?.timezone || ""}
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
                  checked={settings.config?.enableWebhooks}
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
                    checked={settings.config?.enableNotifications}
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
            <div className="text-lg font-bold">Версия: {versionApp}</div>
            <div className="text-sm text-base-content/60">{status}</div>
            <div className="flex gap-2">
              <button className="btn btn-soft btn-error" onClick={logout}>
                <ArrowLeftEndOnRectangleIcon className="h-6 w-6" />
              </button>
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
        searchQuery={searchTz} 
        setSearchQuery={setSearchTz}
        isModalOpen={notifyModalOpen}
        setIsModalOpen={setNotifyModalOpen}
        data={data}
      />
    </div>
  );
}