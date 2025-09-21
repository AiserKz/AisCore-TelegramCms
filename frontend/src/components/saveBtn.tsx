import { useState } from "react";
import { useAppContext } from "../layout/AppLayout";
import api from "../script/apiFetch"
import { BookmarkIcon } from "@heroicons/react/24/outline";

export function SaveBtn({ absolute = true, opened = true }: { absolute?: boolean, opened?: boolean }) {
    const context = useAppContext();
    const { callToast, setBotReboat, botRebut, botSetting } = context;
    const [loading, setLoading] = useState<boolean>(false);


    const handleSave = async () => {
        if (loading || !botSetting) return;
        setBotReboat(false);
        setLoading(true);
        const res = await api.post(`/api/reload/${botSetting.name}`);
        if (res.status === 200) callToast("success", "Сохранено", 2000);
        setTimeout(() => setLoading(false), 1000);
    }

    return (
        <button onClick={handleSave} className={`hidden md:flex top-4 right-4 btn btn-success btn-soft ${absolute ? "absolute" : ""}`} disabled={loading || !botRebut} type="button">
            <span className="flex-row flex gap-2">
                <BookmarkIcon className="h-5 w-5" /> 
                {opened && "Сохранить"}
            </span>
        </button>
    )
}