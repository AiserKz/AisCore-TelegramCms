import { PowerIcon, Cog6ToothIcon, StopIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../layout/AppLayout";
import api from "../script/apiFetch";
import SkeletonTable from "../components/skeletonTable";
import { SaveBtn } from "../components/saveBtn";
import { useState } from "react";
import PlagineStore from "../components/plagins/plaginShop";
import type { BotPlugin, PluginType } from "../interface/types";

export default function Plagins() {
	const context = useAppContext();
	const { callToast, data, setData, loading, botSetting } = context;

	const [optionsOpenFor, setOptionsOpenFor] = useState<string | null>(null);
	const [optionsLoading, setOptionsLoading] = useState(false);
	const [pluginConfig, setPluginConfig] = useState<any>(null);
	const [pluginFields, setPluginFields] = useState<any[] | null>(null);
	const [optionsSaving, setOptionsSaving] = useState(false);
	const [installing, setInstalling] = useState<string | null>(null);

	const [showShop, setshowShop] = useState<boolean>(false);

    
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

	const installedPlugins = getInstalledPlugins();

	const handleToggle = async (plugin_id: number) => {
		// работаем с записью из data.bot.plugins по plugin_id
		const bp = data?.bot?.plugins.find((p: any) => Number(p.plugin_id) === Number(plugin_id));
		if (!bp) return;
		const updated = { ...bp, enabled: !bp.enabled };

		// оптимистично обновляем только bot.plugins
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

	// Универсальный renderFieldControl — ...existing code...
	const renderFieldControl = (field: any) => {
		const key = field.name;
		const label = field.title || field.label || field.name;
		const type = field.type;
		const value = pluginConfig ? (pluginConfig[key] ?? field.default) : field.default;

		const updateValue = (val: any) => {
			setPluginConfig((prev: any) => ({ ...(prev ?? {}), [key]: val }));
		};

	
		if (type === "int" || type === "number") {
			return (
				<div>
					<input
						type="number"
						className="input input-bordered w-full"
						value={value ?? 0}
						onChange={(e) => updateValue(Number(e.target.value))}
					/>
				</div>
			);
		}

		if (type === "string" || type === "text") {
			return (
				<input
					type="text"
					className="input input-bordered w-full"
					value={value ?? ""}
					onChange={(e) => updateValue(e.target.value)}
				/>
			);
		}

		if (type === "bool" || type === "boolean") {
			return (
				<label className="flex items-center gap-3">
					<input
						type="checkbox"
						className="toggle"
						checked={!!value}
						onChange={(e) => updateValue(e.target.checked)}
					/>
					<span className="text-sm text-base-content/70">{field.description || ""}</span>
				</label>
			);
		}

		if (type === "list") {
			if (field.item_type === "object") {
				const list: any[] = Array.isArray(value) ? value : [];
				const defaultItem = Array.isArray(field.default) && field.default[0] ? field.default[0] : {};
				const itemKeys = Object.keys(defaultItem);

				const updateItem = (index: number, k: string, val: any) => {
					const copy = [...list];
					copy[index] = { ...(copy[index] ?? {}), [k]: val };
					updateValue(copy);
				};

				const addItem = () => {
					const newItem = JSON.parse(JSON.stringify(defaultItem || {}));
					updateValue([...list, newItem]);
				};

				const removeItem = (index: number) => {
					const copy = [...list];
					copy.splice(index, 1);
					updateValue(copy);
				};
				return (
					<div>
						{list.length === 0 && <div className="text-sm text-base-content/60">Список пуст</div>}
						<div className="flex flex-col gap-3">
							{list.map((it, idx) => (
								<div key={idx} className="p-3 border rounded bg-base-200">
									<div className="flex justify-between items-center mb-2">
										<div className="font-medium">{label} #{idx + 1}</div>
										{/* <button className="btn btn-xs btn-ghost text-error" onClick={() => removeItem(idx)}>Удалить</button> */}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {itemKeys.map(k => (
                                        <div key={k}>
                                            <label className="label-text text-xs">{k}: </label><br />

                                            {k === "name" ? (
                                            // name всегда редактируемый
                                            <input
                                                className="input input-bordered w-full"
                                                value={it[k] ?? ""}
                                                onChange={(e) => updateItem(idx, k, e.target.value)}
                                            />
                                            ) : k === "response" ? (
                                            it.action === "text" ? (
                                                // response редактируемый только для action === text
                                                <input
                                                className="input input-bordered w-full"
                                                value={it[k] ?? ""}
                                                onChange={(e) => updateItem(idx, k, e.target.value)}
                                                />
                                            ) : (
                                                // response для void → только описание
                                                <span>{it[k]}</span>
                                            )
                                            ) : k === "method" ? (
                                            // method можно тоже редактировать 
                                            <input
                                                className="input input-bordered w-full"
                                                value={it[k] ?? ""}
                                                onChange={(e) => updateItem(idx, k, e.target.value)}
                                            />
                                            ) : (
                                            // все остальные просто отображаем
                                            <span>{it[k]}</span>
                                            )}
                                        </div>
                                        ))}

									</div>
								</div>
							))}
						</div>
						<div className="mt-2">
							{/* <button className="btn btn-sm" onClick={addItem}>Добавить элемент</button> */}
						</div>
					</div>
				);
			}

			return (
				<textarea
					className="textarea textarea-bordered w-full"
					value={Array.isArray(value) ? JSON.stringify(value, null, 2) : (value ?? "")}
					onChange={(e) => {
						try {
							updateValue(JSON.parse(e.target.value));
						} catch {
							updateValue(e.target.value.split(",").map((s: string) => s.trim()));
						}
					}}
				/>
			);
		}

		return (
			<textarea
				className="textarea textarea-bordered w-full"
				value={JSON.stringify(value ?? field.default ?? "", null, 2)}
				onChange={(e) => {
					try {
						updateValue(JSON.parse(e.target.value));
					} catch {
						updateValue(e.target.value);
					}
				}}
			/>
		);
	};

	const saveOptions = async () => {
		if (!optionsOpenFor) return;
		const bp = data?.bot?.plugins.find((p: any) => p.plugin?.name === optionsOpenFor || p.plugin_name === optionsOpenFor);
		if (!bp) {
			callToast("error", "Плагин не найден для сохранения", 3000);
			return;
		}
		setOptionsSaving(true);
		try {
			const res = await api.put(`/api/plugins/${botSetting?.name}/${bp.plugin_id}/options`, { config: pluginConfig });
			if (res.status === 200 || res.status === 204) {
				callToast("success", "Настройки сохранены", 3000);
				// обновляем только bot.plugins.config
				setData(prev => {
					if (!prev) return prev;
					const botPlugins = prev.bot.plugins.map((p: any) => p.plugin_id === bp.plugin_id ? ({ ...p, config: pluginConfig }) : p);
					return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
				});
				setOptionsOpenFor(null);
				setPluginConfig(null);
				setPluginFields(null);
			} else {
				callToast("error", "Ошибка при сохранении", 3000);
			}
		} catch (e) {
			callToast("error", "Не удалось сохранить настройки (связь с сервером)", 3000);
		} finally {
			setOptionsSaving(false);
		}
	};

	// Магазин: defs = data.plugins; фильтруем по plugin.id
	const defs = data?.plugins || [];
	const installedIds = (data?.bot?.plugins || []).map((bp: any) => Number(bp.plugin_id));
	// const storeList = defs.filter((d: any) => !installedIds.includes(Number(d.id))) || [];
    const storeList = defs;

	const installPlugin = async (pkg: any) => {
        if (!botSetting?.name) {
            callToast("error", "Bot name not configured", 3000);
            return;
        }
        if (!pkg || !pkg.id) return;
        setInstalling(pkg.id);

        try {
            // POST add возвращает запись bot.plugins (с plugin_id и config)
            const res = await api.post(`/api/plugins/${botSetting.name}/add`, { name: pkg.name, plugin_id: pkg.id });
            if (res.status === 200 || res.status === 201) {
                setData(prev => {
                    if (!prev) return prev;
                    const installed: BotPlugin = {
                        plugin_id: pkg.id,
                        bot_id: prev.bot.id, 
                        enabled: false,
                        config: {},
                        plugin: pkg,
                    };
                    const botPlugins = [...(prev.bot.plugins || []), installed];
                    return { ...prev, bot: { ...prev.bot, plugins: botPlugins } };
                });
                callToast("success", `Плагин ${pkg.name} установлен`, 3000);
            } else {
                callToast("error", "Ошибка установки плагина", 3000);
            }
        } catch (e) {
            callToast("error", "Не удалось установить плагин (связь с сервером)", 3000);
        } finally {
            setInstalling(null);
        }
    };

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

	const removePlugin = async (plugin: PluginType) => {
		if (!plugin) return;

		try {
			const res = await api.delete(`/api/plugins/${plugin.name}`);
			if (res.status === 200 || res.status === 204) {
				callToast("success", "Плагин удален", 3000);
				setData(prev => {
					if (!prev) return prev;
					const plugins = prev.plugins.filter((p: any) => p.name !== plugin.name);
					return { ...prev, plugins };
				})
			}

		} catch (e) {
			callToast("error", "Не удалось удалить плагин (связь с сервером)", 3000);
		}
	}

	// Рендер установленных: используем getInstalledPlugins() (в котором bp.plugin используется)

	const renderInstalled = () => {
		if (loading) return Array.from({ length: 3 }).map((_, i) => <SkeletonTable key={i} count={6}/>);
		return getInstalledPlugins().map((plugin: any) => (
			<tr key={plugin.plugin_id} className={plugin.enabled ? "" : "opacity-60"}>
				<td><img src={plugin?.poster || "https://content.timeweb.com/assets/65c70e62-4ae9-48bc-92ff-7886de5f50fa.jpg?width=3080&height=1600"} className="w-15 h-15 object-cover rounded-xl" /></td>
				<td className="font-medium">{plugin.name}</td>
				<td>{plugin.description}</td>
				<td>
					<span className={plugin.enabled ? "badge badge-success" : "badge badge-error"}>
						{plugin.enabled ? "Активен" : "Неактивен"}
					</span>
				</td>
				<td>
					{plugin.enabled ? (
						<button className="btn btn-sm btn-ghost text-error" onClick={() => handleToggle(plugin.plugin_id)}>
							<StopIcon className="w-5 h-5" />
							Деактивировать
						</button>
					) : (
						<button className="btn btn-sm btn-ghost text-success" onClick={() => handleToggle(plugin.plugin_id)}>
							<PowerIcon className="w-5 h-5" />
							Активировать
						</button>
					)}
					<button className="btn btn-sm btn-ghost" onClick={() => handleOption(plugin.name)} >
						<Cog6ToothIcon className="w-5 h-5" />
						Настроить
					</button>
                    <button className="btn btn-sm btn-ghost text-error" onClick={() => handleRemove(plugin)}>
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
			<div className="navbar bg-base-100 rounded-box mb-8 shadow">
				<div className="flex-1">
					<span className="text-xl font-bold">Плагины</span>
				</div>
			</div>
			<div className="mb-8 relative">
				<h2 className="text-2xl font-bold mb-2">Список плагинов</h2>
				<p className="text-base-content/70">
					Управление и настройка доступных плагинов для вашего бота.
				</p>
                <SaveBtn />
		
			</div>

			<div className="overflow-x-auto rounded-lg shadow mb-8">
				<table className="table table-zebra w-full">
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
            <div className="mb-8">
				<div className="flex items-center justify-between w-full">
					<h3 className="text-xl font-bold mb-4">Библотека плагинов</h3>
					<div className="flex items-center gap-2">
						<span>Магазин плагинов</span>
						<button className="btn btn-sm btn-primary btn-soft" onClick={() => setshowShop(true)}>
							<PlusIcon className="w-5 h-5" />
						</button>
					</div>

				</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {storeList.map((pkg: any) => (
                        <div key={pkg.id} className="card bg-base-200 p-4 shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">{pkg.name}</div>
                                    <div className="text-sm text-base-content/60">{pkg.description}</div>
                                    <div className="text-xs text-base-content/60 mt-2">Версия: {pkg.version} • Автор: {pkg.author}</div>
                                </div>
								<div className="flex flex-col items-end gap-2">
									<div className="text-sm">{pkg.price ? `${pkg.price} ₽` : "Бесплатно"}</div>
									{data?.bot?.plugins?.find((p: any) => p.plugin_id === pkg.id) ? (
										<span className="badge badge-success">Установлен</span>
									) : (
										<button
											className="btn btn-sm btn-primary"
											onClick={() => installPlugin(pkg)}
											disabled={!!installing}
										>
											{installing === pkg.id ? "Установка..." : "Установить"}
										</button>
									)}
									{!data?.bot?.plugins?.find((p: any) => p.plugin_id === pkg.id) && (
										<button
											className="btn btn-sm btn-ghost text-error"
											onClick={() => removePlugin(pkg)}
										>
											<TrashIcon className="w-5 h-5 mr-1" />
											Удалить
										</button>
									)}
								</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Модалка настроек плагина */}
            {optionsOpenFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-base-100 w-full max-w-3xl p-6 rounded shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Настройки плагина: {optionsOpenFor}</h3>
                                <div className="text-sm text-base-content/60">Редактирование конфигурации плагина</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost btn-sm" onClick={() => { setOptionsOpenFor(null); setPluginFields(null); setPluginConfig(null); }}>Закрыть</button>
                            </div>
                        </div>

                        {optionsLoading ? (
                            <div className="p-8 text-center">
                                <div className="mb-2">Загрузка настроек...</div>
                                <div className="loading loading-spinner"></div>
                            </div>
                        ) : pluginFields && pluginConfig !== null ? (
                            <>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {pluginFields.map((field) => (
                                        <div key={field.name || field.key} className="p-3 border rounded bg-base-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-medium">{field.title || field.name}</div>
                                                <div className="text-sm text-base-content/60">{field.type}{field.item_type ? ` / ${field.item_type}` : ""}</div>
                                            </div>
                                            <div className="text-sm text-base-content/70 mb-2">{field.description}</div>
                                            {renderFieldControl(field)}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <button className="btn" onClick={() => { setOptionsOpenFor(null); setPluginFields(null); setPluginConfig(null); }}>Отмена</button>
                                    <button className="btn btn-primary" onClick={saveOptions} disabled={optionsSaving}>
                                        {optionsSaving ? "Сохранение..." : "Сохранить"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 text-sm text-base-content/60">Нет доступных настроек</div>
                        )}
                    </div>
                </div>
            )}

			{showShop && (
				<PlagineStore showShop={showShop} setshowShop={setshowShop} installedPlugins={defs.map((p: any) => p.name)}  />
			)}

		</div>
	);
}