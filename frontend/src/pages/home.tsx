import { CommandLineIcon, PuzzlePieceIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import HeaderPageTitle from "../components/headerPage";
import StatusBar from "../components/statusBar";
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
 
                <div className="mb-8 shadow-md p-4 rounded bg-base-100">
                    <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
                    <p className="text-base-content/70">Обзор производительности бота и активности пользователей.</p>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-8 shadow-md p-4 rounded bg-base-100">
                    <div className="rgb-btn-purple bg-base-200 rounded-xl p-2">
                        <div className="stat-title">Пользователей</div>
                        <div className="stat-value flex items-center gap-2">
                            {data?.total_count.users || 0}
                            <UserGroupIcon className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="rgb-btn-purple bg-base-200 rounded-xl p-2">
                        <div className="stat-title">Команд</div>
                        <div className="stat-value flex items-center gap-2">
                            {data?.total_count.commands || 0}
                            <CommandLineIcon className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="rgb-btn-purple bg-base-200 rounded-xl p-2">
                        <div className="stat-title">Плагинов</div>
                        <div className="stat-value flex items-center gap-2">
                            {data?.total_count.plugins || 0}
                            <PuzzlePieceIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="mb-8 shadow-md p-2 rounded bg-base-100">
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
                                    <tr key={row.id} className={`hover:bg-base-100 ${row.enabled ? "" : "opacity-50"}`}>
                                        <td>{row.name}</td>
                                        <td><StatusBar isActive={row.enabled} /></td>
                                        <td>{formatDate(row.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-8 shadow-md p-2 rounded bg-base-100">
                    <h3 className="text-xl font-bold mb-4 ">Плагины</h3>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Плагин</th>
                                    <th>Статус</th>
                                    <th>Версия</th>
                                </tr>
                            </thead>
                            <tbody >
                                {data?.bot?.plugins.map((row) => (
                                    <tr key={row.plugin_id} className={`hover:bg-base-100 ${row.enabled ? "" : "opacity-50"}`}>
                                        <td>{row.plugin.name}</td>
                                        <td>
                                            <StatusBar isActive={row.enabled} />
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