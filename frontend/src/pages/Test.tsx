export default function Test() {
    return (
        <div className="w-full flex flex-1 items-center justify-center pt-10 flex-col gap-6">
            <div className="w-1/4 bg-base-200 p-4 rounded">
                <p>Sidebar</p>
            </div>
            <div className="w-full bg-base-100 items-center flex justify-center p-5">
                <button className="btn rgb-border w-1/4 overflow-hidden" aria-label="Gradient Button">
                    <span>Button</span>
                </button>
            </div>
        </div>
    )
}