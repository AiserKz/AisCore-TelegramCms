import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { TelegramUserType } from "../../interface/types";
import { formatDate } from "../../script/helpers";
import SkeletonTable from "../skeletonTable";



type ModalProps = {
    loading: boolean;
    data?: { users: TelegramUserType[] };
    handleSelectUser: (user: TelegramUserType) => void;
    handleDelete: (id: number) => void;
};


const renderUsers = ({loading, data, handleSelectUser, handleDelete}: ModalProps) => {
    if (loading) return Array.from({ length: 6 }).map((_, i) => <SkeletonTable key={i} count={11} />);
    return data?.users.map((user: TelegramUserType) => (
        <tr key={user.id} className="hover:bg-base-100">
            
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
            <td className="text-right items-center flex">
                <button
                    className="btn btn-sm btn-soft btn-info mr-2"
                    title="Редактировать"
                    onClick={() => handleSelectUser(user)}
                >
                <PencilIcon className="w-5 h-5" />
                </button>
                <button
                    className="btn btn-sm btn-soft btn-error"
                    title="Удалить"
                    onClick={() => handleDelete(user.id)}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </td>
        </tr>
        ))
}

export default renderUsers