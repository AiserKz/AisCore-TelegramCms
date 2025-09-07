import { useMemo } from "react";
import type { MainDataType } from "../../interface/types";

interface ModalUserProps {
    selectedIds: number[];
    setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    data: MainDataType | undefined;
}

export default function ModalUsers({
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    data
}: ModalUserProps) {
    // Новый: отфильтрованный список по запросу поиска
    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return data?.users || [];
        return (data?.users || []).filter(
            (u) =>
                u.first_name?.toLowerCase().includes(q) ||
                (u.username || "").toLowerCase().includes(q)
        );
    }, [searchQuery, data?.users]);

    const selectAllVisible = () => {
        const ids = filteredUsers.map((u) => u.id);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    };
    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    if (!isModalOpen) return null;

    return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-base-100 w-full max-w-2xl p-4 md:p-6 rounded shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">Выберите пользователей</h3>
                  <p className="text-sm text-base-content/70">
                    Отметьте пользователей, которым будет отправлено сообщение.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedIds([]);
                      setSearchQuery("");
                    }}
                  >
                    Сбросить
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                  >
                    Закрыть
                  </button>
                </div>
              </div>

              {/* Поиск */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени или username..."
                  className="input input-bordered w-full"
                />
                <button
                  className="btn btn-sm"
                  onClick={selectAllVisible}
                  title="Выбрать всех видимых"
                >
                  Выбрать всё
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded border border-base-200 p-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-base-content/60">
                    Нет результатов
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-2 hover:bg-base-200 rounded"
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {u?.first_name || u.username}{" "}
                          <span className="text-sm text-base-content/60 ml-2">
                            {u.username}
                          </span>
                        </div>
                        <div className="text-xs">
                          {u.subscribed ? "Активен" : "Неактивен"}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-base-content/60">
                  Показано: {filteredUsers.length} / {data?.users.length}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={selectedIds.length === 0}
                  >
                    Готово ({selectedIds.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
    )
}