import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../../script/helpers";
import SkeletonTable from "../skeletonTable";
import type { CommandType } from "../../interface/types";
import StatusBar from "../statusBar";

interface CommandRenderProps {
    commands: CommandType[];
    loading: boolean;
    toggleEnabled: (id: number) => void;
    openEdit: (row: any) => void;
    deleteCommand: (id: number) => void;
    isDeleting: boolean
}

export default function renderCommands({ commands, loading, toggleEnabled, openEdit, deleteCommand, isDeleting }: CommandRenderProps) {
    if (loading) return Array.from({ length: 3 }).map((_, i) => <SkeletonTable key={i} />);
    return commands.map((row: CommandType) => (
        <tr key={row.id} className={`hover:bg-base-100 ${row.enabled ? "" : "opacity-60"}`} >
            <td>/{row.name}</td>
            <td>
                <div className="flex items-center gap-2">
                    <div className={row.enabled ? "text-base-content" : "text-base-content/60"}>
                        {row.description}
                    </div>
                </div>
            </td>
            <td>{formatDate((row as any).created_at || row.created_at)}</td>
            <td className="w-1/6">
                <div className="flex items-center gap-2 justify-between">
                    <StatusBar isActive={row.enabled} />
                    <input type="checkbox" className="toggle toggle-sm" checked={!!row.enabled} onChange={() => toggleEnabled(row.id)} />
                </div>
            </td>
            <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <button className="btn btn-info btn-soft btn-sm flex items-center gap-1" onClick={() => openEdit(row)}>
                        <PencilSquareIcon className="h-4 w-4" />
                        <span>Редактировать</span>
                    </button>
                    <button className="btn btn-soft btn-error btn-sm flex items-center gap-1" onClick={() => deleteCommand(row.id)} disabled={isDeleting}>
                        <TrashIcon className="h-4 w-4" />
                        <span>Удалить</span>
                    </button>
                </div>
            </td>
        </tr>
    ));
}