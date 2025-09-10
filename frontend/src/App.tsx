import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/home";
import LeftBar from "./components/leftBar";
import Login from "./pages/login";
import { useAppContext } from "./layout/AppLayout";
import Commands from "./pages/commands";
import Users from "./pages/users";
import Plagins from "./pages/plagins";
import Sender from "./pages/broadcast";
import Settings from "./pages/settings";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect } from "react";
import NotFound from "./pages/not-fount";
import TabBar from "./components/TabBar";
import About from "./pages/about";



function ProgressBar() {
  const location = useLocation();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false
    })
    NProgress.start();
    NProgress.done();
  }, [location]);

  return null;
}


function App() {
  const context = useAppContext();
  const {authLoading, user} = context;

  
  if (authLoading) {
    return <div className="w-screen h-screen flex justify-center items-center">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <LeftBar />
      <TabBar />
      <ProgressBar />
      <div className="bg-base-200 text-base-content overflow-hidden md:px-20 lg:px-60 px-5 min-h-screen pb-30"> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/users" element={<Users />} />
          <Route path="/plagins" element={<Plagins />} />
          <Route path="/send" element={<Sender />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
