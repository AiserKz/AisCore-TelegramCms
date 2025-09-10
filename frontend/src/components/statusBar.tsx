

export default function StatusBar({ isActive }: { isActive: boolean }) {
    return (
        <div className="flex items-center gap-2 ">
            <div className="inline-grid *:[grid-area:1/1]">
                <div className={`status ${isActive ? "status-success animate-ping" : "status-error"}`} />
                <div className={`status ${isActive ? "status-success" : "status-error"}`} />
            </div>
            <span>{isActive ? "Активна" : "Не активна"}</span>
        </div>
    )
}