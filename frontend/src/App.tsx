import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import LeftBar from "./components/leftBar";
import Login from "./pages/login";
import { useAppContext } from "./layout/AppLayout";
import Commands from "./pages/commands";
import Users from "./pages/users";
import Plagins from "./pages/plagins";
import Sender from "./pages/broadcast";
import Settings from "./pages/settings";



function App() {
  const context = useAppContext();
  const { user } = context;

  // if (!user) {
  //   return <Login />;
  // }

  return (
    <Router>
      <LeftBar />
      <div className="bg-base-200 text-base-content overflow-hidden px-60 min-h-screen"> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/users" element={<Users />} />
          <Route path="/plagins" element={<Plagins />} />
          <Route path="/send" element={<Sender />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
