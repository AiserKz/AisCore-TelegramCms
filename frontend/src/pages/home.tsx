import { useAppContext } from "../layout/AppLayout";
import { formatDate } from "../script/helpers";


export default function Home() {
    const context = useAppContext();
    const { data } = context;

    
    return (
        <div className="text-base-content w-full">
            <div className="container mx-auto py-8"> 
                <div className="navbar bg-base-100 rounded-box mb-8 shadow">
                    <div className="flex-1">
                        <span className="text-xl font-bold">Главная</span>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
                    <p className="text-base-content/70">Обзор производительности бота и активности пользователей.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stats shadow bg-b">
                        <div className="stat">
                            <div className="stat-title">Пользователей</div>
                            <div className="stat-value">{data?.total_count.users || 0}</div>
                        </div>
                    </div>
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Активных команд</div>
                            <div className="stat-value">{data?.total_count.commands || 0}</div>
                        </div>
                    </div>
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Плагинов включено</div>
                            <div className="stat-value">{data?.total_count.plugins || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Активность команд</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Команда</th>
                                    <th>Статус</th>
                                    <th>Время создания</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.commands.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.name}</td>
                                        <td className={row.enabled ? "text-green-500" : "text-red-500"}>{row.enabled ? "Включена" : "Отключена"}</td>
                                        <td>{formatDate(row.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4">Плагины</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Плагин</th>
                                    <th>Статус</th>
                                    <th>Версия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.bot.plugins.map((row) => (
                                    <tr key={row.plugin_id}>
                                        <td>{row.plugin.name}</td>
                                        <td>
                                            <span className={
                                                row.enabled
                                                    ? "badge badge-success"
                                                    : "badge badge-error"
                                            }>
                                                {row.enabled ? "Включён" : "Отключён"}
                                            </span>
                                        </td>
                                        <td>{row.plugin.version}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}