export default function HeaderPageTitle({ title, description }: { title: string, description?: string }) {
    return (
        <div className="navbar bg-base-100 rounded-box mb-8">
            <div className="flex-1 flex-col flex gap-2">
                <span className="text-xl font-bold">{title}</span>
                {description && <span className="text-sm text-base-content/60">{description}</span>}
            </div>
        </div>
)
}