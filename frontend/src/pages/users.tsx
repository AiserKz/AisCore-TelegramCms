import { useAppContext } from "../layout/AppLayout";
import HeaderPageTitle from "../components/headerPage";
import { useState } from "react";
import renderUsers from "../components/users/renderUsers";
import UserSettingModal from "../components/users/userSettingModal";
import type { TelegramUserType } from "../interface/types";
import useTitle from "../script/useTitle";
import api from "../script/apiFetch";


export default function Users() {
    useTitle("Пользователи");
    const context = useAppContext();
    const { data, loading } = context;

    const [selectedUser, setSelectedUser] = useState<TelegramUserType>();
    const handleSelectUser = (user: TelegramUserType) => {
        setSelectedUser(user);
    };

    const handleDelete = async (id: number) => {
        try {
            api.delete(`/api/users`, { data: { id } });
            context.setData(prev => {
                if (!prev) return prev;
                return { ...prev, users: prev.users.filter(u => u.id !== id) } as any;
            });
            context.callToast("success", "Пользователь удалён", 2500);
        } catch (e) {
            context.callToast("error", "Ошибка при удалении", 3000);
        }
    }

    return (
        <div className="contaner mx-auto py-8">
        <HeaderPageTitle title="Пользователи" />
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Список пользователей</h2>
            <p className="text-base-content/70">
            Обзор зарегистрированных пользователей и их статуса.
            </p>
        </div>
        <div className="overflow-x-auto rounded-lg shadow">
            <table className="table w-full gap-2">
            <thead>
                <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Username</th>
                <th>Chat_ID</th>
                <th>Статус</th>
                <th>Дата регистрации</th>
                <th>Подписка</th>
                <th>Дата подписки</th>
                <th>Дата последнего обновления</th>
                <th>Язык</th>
                <th className="text-right">Действия</th>
                </tr>
            </thead>
                <tbody>
                    {renderUsers({loading, data, handleSelectUser, handleDelete})}
                </tbody>
            </table>
        </div>
            {selectedUser && <UserSettingModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(undefined)}
                handleDelete={handleDelete}
            />}
        </div>
    );
}

