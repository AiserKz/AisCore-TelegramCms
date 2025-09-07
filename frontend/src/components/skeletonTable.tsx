export default function SkeletonTable({count = 5}: {count?: number}) {
    return (
        <tr className="skeleton animate-pulse bg-base-100" >
            {Array(count).fill(0).map((_, i) => (
                <td key={i}>
                    <p className="w-full h-8 bg-base-200 rounded-md"></p>
                </td>
            ))}
        </tr>
    )
}