import { useEffect } from "react";

function useTitle(title: string) {
    useEffect(() => {
        document.title = "AisCore | " + title;
    }, [title]);
}

export default useTitle