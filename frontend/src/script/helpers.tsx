
const formatDate = (d: string | Date | undefined) => {
    if (!d) return "-";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleString();
};

export { formatDate };