import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";
import Layout from "./Layout/Loyaout";
import Home from "./pages/Home/Home";
import Error from "./pages/Eror-404/Eror";

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
          <Route path="/loihalar" element={<Home />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
