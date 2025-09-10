import { useEffect, useState } from "react";
import { checkPage, navItems } from "../data/navBarItemsData"
import { Link, useLocation } from "react-router-dom";


export default function TabBar() {
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState<number>(checkPage());
    useEffect(() => {
        setCurrentPage(checkPage());
    }, [location]);

    return (
        <div className="fixed bottom-0 left-0 right-0 dock dock-sm bg-base-100 rounded z-10 flex md:hidden">
            {navItems.map((item, index) => (
                <Link to={item.href} key={index} className={`transition-all duration-300 ${index === currentPage ? "dock-active -translate-y-2" : ""}`}>
                    <item.icon className="h-6 w-6" />
                </Link>
            ))}
        </div>
    )
}