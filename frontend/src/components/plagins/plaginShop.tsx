import React, { useEffect, useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useAppContext } from "../../layout/AppLayout"
import api from "../../script/apiFetch"
import type { PluginType } from "../../interface/types"
import pluginsTestData from "../../data/pluginTestData"

interface PlagineStoreProps {
    showShop: boolean
    setshowShop: React.Dispatch<React.SetStateAction<boolean>>
    installedPlugins: string[]
}

export default function PlagineStore( { showShop, setshowShop, installedPlugins }: PlagineStoreProps ) {
    const { callToast, setData } = useAppContext()
    const [items, setItems] = useState<PluginType[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [installing, setInstalling] = useState<string | number | null>(null)

    useEffect(() => {
        if ( !showShop ) return
        setLoading(true)
        // фейковый запрос к бд
        const t = setTimeout(() => {
            setItems(pluginsTestData)
            setLoading(false)
        }, 700)
        return () => clearTimeout(t)
    }, [showShop])

    const filtered = items.filter((it) =>
        (it.name + " " + it.description + " " + (it.author ?? "")).toLowerCase().includes(search.trim().toLowerCase())
    )

    const install = async (pkg: PluginType) => {
        setInstalling(pkg.id)

        await api.post(`/api/plugins/install`, pkg)
        setData(prev => {
            if (!prev) return prev;
            return { ...prev, plugins: [...prev.plugins, pkg] }
        })
        // симуляция установки
        setTimeout(() => {
            setInstalling(null)
            callToast("success", `Плагин ${pkg.name} установлен`, 3000)
            // не закрываем автоматически, но можно: setshowShop(false)
        }, 900)
    }

    if ( !showShop ) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="bg-base-200 rounded-lg shadow-lg overflow-hidden w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 bg-base-100 border-b">
                    <div>
                        <h2 className="text-lg font-bold">Магазин плагинов</h2>
                        <div className="text-sm text-base-content/70">Каталог доступных плагинов — установите дополнения для вашего бота.</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск по названию или описанию..."
                            className="input input-bordered input-sm w-64"
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => setshowShop(false)} title="Закрыть">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-auto flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="card bg-base-100 p-3 h-70 animate-pulse skeleton" >
                                        <div className="w-full h-2/3 bg-base-content/10 rounded" />
                                        <div className="w-full h-1/4 mt-3">
                                            <div className="flex gap-2">
                                                <p className="w-2/5 h-5 bg-base-content/10 rounded"></p>
                                                <p className="w-2/12 h-5 bg-base-content/10 rounded"></p>
                                                <p className="w-2/12 h-5 bg-base-content/10 rounded ml-auto"></p>
                                            </div>
                                            <p className="w-2/3 h-5 bg-base-content/10 mt-2 rounded"></p>
                                            <p className="w-3/12 h-5 bg-base-content/10 mt-2 rounded"></p>
                                        </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {filtered.length === 0 ? (
                                <div className="col-span-full text-center text-base-content/60 p-6">Ничего не найдено</div>
                            ) : (
                                
                                filtered.map((pkg) => (
                                    <StoreCard key={pkg.id} pkg={pkg} installing={installing} isInstalled={installedPlugins.includes(pkg.name)} onInstall={install} />
                                ))
                            )}

                        </div>
                    )}
                </div>

                <div className="p-3 border-t bg-base-100 text-sm text-base-content/60 flex justify-between">
                    <div>Показано: {filtered.length} из {items.length}</div>
                    <div className="opacity-80">Общий магазин плагинов</div>
                </div>
            </div>
        </div>
    )
}

// вынесенная карточка плагина
function StoreCard({ pkg, installing, isInstalled, onInstall }: { pkg: PluginType, installing: string | number | null, isInstalled: boolean, onInstall: (p: PluginType) => void }) {
    return (
        <div className={`card bg-base-100 shadow p-0 overflow-hidden ${isInstalled ? "border border-success/50" : ""}`}>
            <div className="h-44 bg-gray-100">
                <img src={pkg.poster} alt={pkg.name} className="w-full h-44 object-cover" />
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="font-medium">{pkg.name} <span className="text-xs text-base-content/60 ml-2">v{pkg.version}</span></div>
                        <div className="text-sm text-base-content/70 mt-1 line-clamp-3">{pkg.description}</div>
                        <div className="text-xs text-base-content/60 mt-2">Автор: {pkg.author}</div>
                    </div>
                    <div className="text-right">
                        {isInstalled ? <div className="badge badge-success">Установлен</div> : (
                            <>
                            <div className="text-base font-semibold">{pkg.price === 0 ? "Бесплатно" : `${pkg.price} ₽`}</div>
                            <button
                                className="btn btn-sm btn-primary btn-soft mt-3"
                                onClick={() => onInstall(pkg)}
                                disabled={installing === pkg.id}
                            >
                                {installing === pkg.id ? "Установка..." : "Установить"}
                            </button>
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}