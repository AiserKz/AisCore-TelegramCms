import { useEffect } from "react";

function useTitle(title: string) {
    useEffect(() => {
        document.title = "AС| " + title;
    }, [title]);
}

export default useTitle