import { PowerIcon, Cog6ToothIcon, StopIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../layout/AppLayout";
import api from "../script/apiFetch";
import SkeletonTable from "../components/skeletonTable";
import { SaveBtn } from "../components/saveBtn";
import { useState } from "react";
import PlagineStore from "../components/plagins/plaginShop";
import HeaderPageTitle from "../components/headerPage";
import RenderStoreList from "../components/plagins/renderStoreList";
import PluginSettingModal from "../components/plagins/pluginModal";
import useTitle from "../script/useTitle";
import StatusBar from "../components/statusBar";

export default function Plagins() {
	useTitle("Плагины");
	const context = useAppContext();
	const { callToast, data, setData, loading, botSetting } = context;

	const [optionsOpenFor, setOptionsOpenFor] = useState<string | null>(null);
	const [optionsLoading, setOptionsLoading] = useState<boolean>(false);

	const [pluginConfig, setPluginConfig] = useState<any>(null);
	const [pluginFields, setPluginFields] = useState<any[] | null>(null);

	const [showShop, setshowShop] = useState<boolean>(false);
	const [isFetching, setIsFetching] = useState<boolean>(false);

    const getInstalledPlugins = () => {
		if (!data) return [];
		const botPlugins = data.bot?.plugins || [];
		return botPlugins.map((bp: any) => ({
	
			plugin_id: bp.plugin_id,
			bot_id: bp.bot_id,
			enabled: bp.enabled,
			config: bp.config ?? {},

			name: bp.plugin?.name ?? bp.plugin_name ?? `plugin-${bp.plugin_id}`,
			description: bp.plugin?.description ?? "",
			version: bp.plugin?.version ?? "",
			author: bp.plugin?.author ?? "",
			id: bp.plugin?.id ?? bp.plugin_id,
			poster: bp.plugin?.poster ?? "",
		}));
	};

	// const installedPlugins = getInstalledPlugins();

	const handleToggle = async (plugin_id: number) => {
		if (isFetching || !botSetting) return;
		const bp = data?.bot?.plugins.find((p: any) => Number(p.plugin_id) === Number(plugin_id));
		if (!bp) return;

		setIsFetching(true);
		const updated = { ...bp, enabled: !bp.enabled };

		setData(prev => {
			if (!prev) return prev;
			const botPlugins = prev.bot.plugins.map((p: any) => p.plugin_id === bp.plugin_id ? updated : p);
			return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
		});

		try {
			await api.put(`/api/plugins/${botSetting.name}/${bp.plugin_id}/toggle`, { enabled: updated.enabled });
			callToast("success", `Плагин ${updated.enabled ? "включён" : "отключен"}`, 2000);
		} catch {
			// откат при ошибке
			setData(prev => {
				if (!prev) return prev;
				const botPlugins = prev.bot.plugins.map((p: any) => p.plugin_id === bp.plugin_id ? bp : p);
				return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
			});
			callToast("error", "Не удалось изменить статус на сервере", 3000);
		} finally {
			setTimeout(() => setIsFetching(false), 500);
		}
	};

	const handleOption = async (name: string) => {
		// найти запись bot.plugins по имени в nested plugin
		const bp = data?.bot?.plugins.find((p: any) => p.plugin?.name === name || p.plugin_name === name);
		if (!bp) {
			callToast("error", "Плагин не найден в установленных", 3000);
			return;
		}
		const pluginId = bp.plugin_id;
		setOptionsOpenFor(name);
		setOptionsLoading(true);
		setPluginConfig(null);
		setPluginFields(null);
		try {
			const res = await api.get(`/api/plugins/${botSetting?.name}/${pluginId}/options`, {});
			const body = res.data ?? {};
            console.log(body);
			// если нет полей в ответе — возьмём текущий config bp.config
			setPluginConfig(body.config ?? body.configuration ?? bp.config ?? {});
			setPluginFields(body.fields ?? body.schema ?? []);
		} catch (e) {
			callToast("error", "Не удалось загрузить настройки плагина", 3000);
			setOptionsOpenFor(null);
		} finally {
			setOptionsLoading(false);
		}
	};

	// Магазин: defs = data.plugins; фильтруем по plugin.id
	const defs = data?.plugins || [];
	// const installedIds = (data?.bot?.plugins || []).map((bp: any) => Number(bp.plugin_id));
	// const storeList = defs.filter((d: any) => !installedIds.includes(Number(d.id))) || [];
    const storeList = defs;

    const handleRemove = async (plugin: any) => {
		if (!botSetting?.name) {
			callToast("error", "Не указан bot name", 3000);
			return;
		}

		try {
			const res = await api.delete(`/api/plugins/${botSetting.name}/${plugin.name}`);
			if (res.status === 200 || res.status === 204) {
				setData(prev => {
					if (!prev) return prev;
					const botPlugins = prev.bot.plugins.filter((p: any) => p.plugin_id !== plugin.plugin_id);
					return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
				})
				callToast("success", "Плагин удален", 3000);
			}

		} catch (e) {
			callToast("error", "Не удалось удалить плагин (связь с сервером)", 3000);
		}
    }

	const renderInstalled = () => {
		if (loading) return Array.from({ length: 3 }).map((_, i) => <SkeletonTable key={i} count={6}/>);
		return getInstalledPlugins().map((plugin: any) => (
			<tr key={plugin.plugin_id} className={`hover:bg-base-100 transition-all duration-300 ease-in-out ${plugin.enabled ? "translate-x-1" : "opacity-60"}`}>
				<td><img src={plugin?.poster || "https://content.timeweb.com/assets/65c70e62-4ae9-48bc-92ff-7886de5f50fa.jpg?width=3080&height=1600"} className="w-15 h-15 object-cover rounded-xl" /></td>
				<td className="font-medium">{plugin.name}</td>
				<td>{plugin.description}</td>
				<td className="min-w-35">
					<StatusBar isActive={plugin.enabled} />
				</td>
				<td className="w-110">
					{plugin.enabled ? (
						<button className="btn btn-sm btn-secondary btn-soft flex-1 mr-2" onClick={() => handleToggle(plugin.plugin_id)}>
							<StopIcon className="w-5 h-5" />
							Деактивировать
						</button>
					) : (
						<button className="btn btn-sm btn-success btn-soft flex-1 mr-2" onClick={() => handleToggle(plugin.plugin_id)}>
							<PowerIcon className="w-5 h-5" />
							Активировать
						</button>
					)}
					<button className="btn btn-sm btn-info btn-soft mr-2" onClick={() => handleOption(plugin.name)} >
						<Cog6ToothIcon className="w-5 h-5" />
						Настроить
					</button>
                    <button className="btn btn-sm btn-error btn-soft mr-2" onClick={() => handleRemove(plugin)}>
                        <TrashIcon className="w-5 h-5" />
                        Удалить
                    </button>
				</td>
				<td>{plugin.version}</td>
				<td>{plugin.author}</td>
			</tr>
		));
	};

	return (
		<div className="container mx-auto py-8">
			<HeaderPageTitle title="Плагины" />
			<div className="mb-8 relative shadow-md p-4 rounded bg-base-100">
				<h2 className="text-2xl font-bold mb-2">Список плагинов</h2>
				<p className="text-base-content/70">
					Управление и настройка доступных плагинов для вашего бота.
				</p>
                <SaveBtn />
		
			</div>

			<div className="overflow-x-auto md:overflow-x-hidden rounded shadow-md mb-8 bg-base-100">
				<table className="table w-full">
					<thead>
						<tr>
							<th>Обложка</th>
							<th>Название</th>
							<th>Описание</th>
							<th>Статус</th>
							<th>Действия</th>
                            <th>Версия</th>
                            <th>Автор</th>
						</tr>
					</thead>
					<tbody>
                        {renderInstalled()}
					</tbody>
				</table>
			</div>

            {/* Магазин плагинов */}
            <div className="mb-8 shadow-md p-4 rounded bg-base-100">
				<div className="flex items-center justify-between w-full">
					<h3 className="text-xl font-bold mb-4">Библотека плагинов</h3>
					<div className="flex items-center gap-2">
						<span>Магазин плагинов</span>
						<button className="btn btn-sm btn-primary btn-soft" onClick={() => setshowShop(true)}>
							<PlusIcon className="w-5 h-5" />
						</button>
					</div>

				</div>
                <RenderStoreList
					storeList={storeList}
					data={data}
					setData={setData}
					callToast={callToast}
					botSetting={botSetting}
				/>
            </div>

            {/* Модалка настроек плагина */}
            {optionsOpenFor && (
				<PluginSettingModal 
					data={data}
					optionsOpenFor={optionsOpenFor}
					setData={setData}
					botSetting={botSetting}
					callToast={callToast}
					optionsLoading={optionsLoading}
					pluginConfig={pluginConfig}
					setPluginConfig={setPluginConfig}
					setOptionsOpenFor={setOptionsOpenFor}
					pluginFields={pluginFields}
					setPluginFields={setPluginFields}
				/>
            )}

			{showShop && (
				<PlagineStore showShop={showShop} setshowShop={setshowShop} installedPlugins={defs.map((p: any) => p.name)}  />
			)}

		</div>
	);
}