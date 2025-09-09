import type React from "react";

interface UserSelectBroadcastProps {
    audience: string;
    setAudience: React.Dispatch<React.SetStateAction<"all" | "user">>;
    setIsModalOpen: (value: boolean) => void;
    setSearchQuery: (value: string) => void;
    selectedIds: number[]
}

export default function UserSelectBroadcast({ audience, setAudience, setIsModalOpen, setSearchQuery, selectedIds }: UserSelectBroadcastProps) {
    return (
        <div>
            <h3 className="mb-4 text-lg font-bold">Целевая аудитория</h3>
            <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-4 rounded-md border border-dashed p-4">
                <input
                name="audience"
                type="radio"
                checked={audience === "all"}
                onChange={() => {
                    setAudience("all");
                    setIsModalOpen(false);
                    setSearchQuery("");
                }}
                className="radio"
                />
                <span className="text-sm font-medium">Все пользователи</span>
            </label>

            <label className="flex cursor-pointer items-center gap-4 rounded-md border border-dashed p-4">
                <input
                name="audience"
                type="radio"
                checked={audience === "user"}
                onChange={() => {
                    setAudience("user");
                    setIsModalOpen(true);
                }}
                className="radio"
                />
                <span className="text-sm font-medium">Пользователю</span>
            </label>
            <div className="text-sm text-base-content/60">
                {audience === "user" && selectedIds.length > 0 && (
                <div>Выбрано: {selectedIds.length} пользователь(я)</div>
                )}
            </div>
            </div>
        </div>
    )
}