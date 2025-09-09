import HeaderPageTitle from "../components/headerPage";
import { useAppContext } from "../layout/AppLayout";
import { formatDate } from "../script/helpers";
import useTitle from "../script/useTitle";

export default function Home() {
    const context = useAppContext();
    const { data } = context;
    useTitle("Главная");

    return (
        <div className="text-base-content w-full z-10">
            <div className="container mx-auto py-8"> 
                <HeaderPageTitle title="Главная" />
 
                <div className="mb-8 ">
                    <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
                    <p className="text-base-content/70">Обзор производительности бота и активности пользователей.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="rgb-border rounded-xl p-[2px]">
                        <div className="stats shadow rounded-lg bg-base-100 w-full">
                        <div className="stat ">
                            <div className="stat-title">Пользователей</div>
                            <div className="stat-value">{data?.total_count.users || 0}</div>
                        </div>
                        </div>
                    </div>

                    <div className="rgb-border rounded-xl p-[2px]">
                        <div className="stats shadow rounded-lg bg-base-100 w-full">
                        <div className="stat">
                            <div className="stat-title">Активных команд</div>
                            <div className="stat-value">{data?.total_count.commands || 0}</div>
                        </div>
                        </div>
                    </div>

                    <div className="rgb-border rounded-xl p-[2px]">
                        <div className="stats shadow rounded-lg bg-base-100 w-full">
                        <div className="stat">
                            <div className="stat-title">Плагинов включено</div>
                            <div className="stat-value">{data?.total_count.plugins || 0}</div>
                        </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Активность команд</h3>
                    <div className="overflow-x-auto ">
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
                                    <tr key={row.id} className={row.enabled ? "" : "opacity-50"}>
                                        <td>{row.name}</td>
                                        <td className={row.enabled ? "badge badge-success" : "badge badge-error"}>{row.enabled ? "Включена" : "Отключена"}</td>
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
                            <tbody >
                                {data?.bot.plugins.map((row) => (
                                    <tr key={row.plugin_id} className={row.enabled ? "" : "opacity-50"}>
                                        <td>{row.plugin.name}</td>
                                        <td>
                                            <span className={`
                                                badge w-1/2
                                                ${row.enabled
                                                    ? "badge-success"
                                                    : "badge-error"}
                                            `}>
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