import { PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import api from "../script/apiFetch";

export default function StartBotBtn({ isOpen }: { isOpen?: boolean }) {
    const [BotName] = useState(localStorage.getItem("bot_settings_v1") ? JSON.parse(localStorage.getItem("bot_settings_v1") as string) : {});
    const [isRunning, setIsRunning] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        api.post(`/bot/init-bot`).catch(() => setIsRunning(false))
    }, [BotName]);

    const handleStartBot = async () => {
        if (BotName && !isLoading) {
            setIsLoading(true);
            if (isRunning) {
                api.post(`/api/stopbot/${BotName.name}`).then(res => {
                    if (res.status === 200) setIsRunning(false);
                }).finally(() => setIsLoading(false));
            } else {
                api.post(`/api/startbot/${BotName.name}`).then(res => {
                    if (res.status === 200) setIsRunning(true);
                }).finally(() => setIsLoading(false));
            }
        }
    }

    return (
        <button className={`flex items-center rounded-md px-2 py-2 btn btn-soft ${isRunning ? "btn-error" : "btn-success"}`} onClick={handleStartBot} disabled={isLoading}>
            {isRunning ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            <span className={`${isOpen ? "" : "hidden"}`}>{isRunning ? "Остановить" : "Запустить"}</span>
        </button>
    )
}