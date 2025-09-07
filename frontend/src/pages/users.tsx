import SkeletonTable from "../components/skeletonTable";
import { formatDate } from "../script/helpers";
import { useAppContext } from "../layout/AppLayout";


export default function Users() {
    const context = useAppContext();
    const { callToast, data, setData, loading } = context;
    const renderUsers = () => {
        if (loading) return Array.from({ length: 6 }).map((_, i) => <SkeletonTable key={i} count={12} />);
        return data?.users.map((user) => (
            <tr key={user.id}>
                <td>{user.user_id}</td>
                <td className="font-medium">{user.first_name}</td>
                <td>@{user.username}</td>
                <td>{user.chat_id}</td>
                <td>
                <span
                    className={
                    !user.is_bot
                        ? "badge badge-success"
                        : "badge badge-error"
                    }
                >
                    {!user.is_bot ? "Человек" : "Бот"}
                </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>{user.subscribed ? "Да" : "Нет"}</td>
                <td>{formatDate(user.last_seen)}</td>
                <td>{formatDate(user.updated_at)}</td>
                <td>{user.language_code?.toUpperCase()}</td>
                <td className="text-right">
                <button
                    className="btn btn-sm btn-ghost mr-2"
                    title="Редактировать"
                >
                    <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    </svg>
                </button>
                <button
                    className="btn btn-sm btn-ghost text-red-500"
                    title="Удалить"
                >
                    <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
                </td>
            </tr>
            ))
    }

    return (
        <div className="container mx-auto py-8">
        <div className="navbar bg-base-100 rounded-box mb-8 shadow">
            <div className="flex-1">
            <span className="text-xl font-bold">Пользователи</span>
            </div>
        </div>
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
                {renderUsers()}
            </tbody>
            </table>
        </div>
        </div>
    );
}