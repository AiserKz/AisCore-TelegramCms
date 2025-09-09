import React, { useState } from "react";
import api from "../../script/apiFetch";
import type { MainDataType } from "../../interface/types";

interface PluginSettingModalProps {
    data: any;
    setData: React.Dispatch<React.SetStateAction<MainDataType | undefined>>;
    botSetting: any;
    callToast: any;
    pluginConfig: any;
    setPluginConfig: any;
    optionsOpenFor: string | null;
    setOptionsOpenFor: React.Dispatch<React.SetStateAction<string | null>>;
    optionsLoading: boolean;
    pluginFields: any[] | null;
    setPluginFields: React.Dispatch<React.SetStateAction<any[] | null>>;
}

export default function PluginSettingModal({ 
    data, 
    setData, 
    botSetting, 
    callToast,
    pluginConfig, 
    setPluginConfig, 
    optionsOpenFor, 
    setOptionsOpenFor, 
    optionsLoading, 
    setPluginFields,
    pluginFields
}: PluginSettingModalProps) {

    const [optionsSaving, setOptionsSaving] = useState<boolean>(false);

	// Универсальный renderFieldControl
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

				// const addItem = () => {
				// 	const newItem = JSON.parse(JSON.stringify(defaultItem || {}));
				// 	updateValue([...list, newItem]);
				// };

				// const removeItem = (index: number) => {
				// 	const copy = [...list];
				// 	copy.splice(index, 1);
				// 	updateValue(copy);
				// };
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
    
    return (
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
    )
}