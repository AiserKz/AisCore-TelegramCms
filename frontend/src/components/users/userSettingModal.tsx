import { useState } from "react";
import { useAppContext } from "../../layout/AppLayout";
import type { TelegramUserType } from "../../interface/types";
import api from "../../script/apiFetch";

interface UserSettingModalProps {
    user: TelegramUserType;
    onClose: () => void;
    handleDelete: (id: number) => void
}

export default function UserSettingModal({ user, onClose, handleDelete }: UserSettingModalProps) {
    const { callToast, setData } = useAppContext();
    const [form, setForm] = useState<TelegramUserType>({ ...user });
    const [saving, setSaving] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);

    const update = <K extends keyof TelegramUserType>(key: K, value: TelegramUserType[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        setSaving(true);
        try {
      
            await api.put(`/api/users`, form);
  
            setData(prev => {
                if (!prev) return prev;
                return { ...prev, users: prev.users.map(u => u.id === form.id ? { ...u, ...form } : u) } as any;
            });
            callToast("success", "Пользователь сохранён", 2500);
            onClose();
        } catch (e) {
            callToast("error", "Ошибка при сохранении", 3000);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!confirm("Удалить пользователя?")) return;
        setDeleting(true);
        try {
            handleDelete(form.id);
            callToast("success", "Пользователь удалён", 2500);
            onClose();
        } catch (e) {
            callToast("error", "Ошибка при удалении", 3000);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (d: any) => {
        if (!d) return "-";
        try {
            const dt = typeof d === "string" ? new Date(d) : d;
            return dt instanceof Date && !isNaN(dt.getTime()) ? dt.toLocaleString() : String(d);
        } catch {
            return String(d);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="bg-base-200 rounded-lg shadow-lg overflow-hidden w-full max-w-2xl">
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Редактировать пользователя</h3>
                        <div className="text-sm text-base-content/60">ID: {user.id} • ChatID: {user.chat_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>Закрыть</button>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <label>
                        <span className="label-text">Имя</span>
                        <input className="input input-bordered w-full" value={form.first_name ?? ""} onChange={(e) => update("first_name", e.target.value as any)} />
                    </label>

                    <label>
                        <span className="label-text">Фамилия</span>
                        <input className="input input-bordered w-full" value={form.last_name ?? ""} onChange={(e) => update("last_name", e.target.value as any)} />
                    </label>

                    <label>
                        <span className="label-text">Username</span>
                        <input className="input input-bordered w-full" value={form.username ?? ""} onChange={(e) => update("username", e.target.value as any)} />
                    </label>

                    <label>
                        <span className="label-text">Язык</span>
                        <input className="input input-bordered w-full" value={form.language_code ?? ""} onChange={(e) => update("language_code", e.target.value as any)} />
                    </label>

                    <label className="flex items-center justify-between">
                        <div>
                            <div className="label-text">Подписка</div>
                            <div className="text-xs text-base-content/60">Статус подписки пользователя</div>
                        </div>
                        <input type="checkbox" className="toggle" checked={!!form.subscribed} onChange={(e) => update("subscribed", e.target.checked as any)} />
                    </label>
                </div>

                <div className="p-4 border-t flex justify-between items-center">
                    <div className="text-sm text-base-content/60">Последнее обновление: {formatDate(user.updated_at)}</div>
                    <div className="flex gap-2">
                        <button className="btn btn-error btn-outline" onClick={remove} disabled={deleting}>{deleting ? "Удаление..." : "Удалить"}</button>
                        <button className="btn" onClick={onClose}>Отмена</button>
                        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}