import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";
import Layout from "./Layout/Loyaout";
import Home from "./pages/Home/Home";
import Error from "./pages/Eror-404/Eror";
import Hatlar from "./pages/Hatlar/Hatlar";
import Foydalanuvchilar from "./pages/Foydalanuvchilar/Foydalanuvchilar";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/loihalar");
    }
  }, [navigate]);
  return (
    <>
      <Layout>
        <Analytics />
        <Routes>
          <Route path="/Loihalar" element={<Home />} />
          <Route path="/Yakka%20tartibdagi%20loyihalar" element={<Home />} />
          <Route path="/Interyer" element={<Error />} />
          <Route path="/Tex-obs" element={<Error />} />
          <Route path="/Laboratoriya" element={<Error />} />
          <Route path="/Tashqi%20nazorat" element={<Error />} />
          <Route path="/Rendr" element={<Error />} />
          <Route path="/Shartnomalar" element={<Error />} />
          <Route path="/Xatlar" element={<Hatlar />} />
          <Route path="/Buyruqlar" element={<Error />} />
          <Route path="/Foydalanuvchilar" element={<Foydalanuvchilar />} />
          <Route path="/Chat" element={<Error />} />
          <Route path="/Sozlamalar" element={<Home />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
