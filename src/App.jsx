import Tasks from "./pages/Tasks";
import Files from "./pages/Files";
import Dashboard from "./pages/Dashboard";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import ScrollToTop from "./ScrollToTop";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Contracts from "./pages/Contracts";
import Letters from "./pages/Letters";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<Projects title="Loyihalar" />} />
          <Route
            path="/projects/single"
            element={
              <Projects title="Yakka tartibdagi loyihalar" category="single" />
            }
          />
          <Route
            path="/projects/interior"
            element={<Projects title="Interyer" category="interior" />}
          />
          <Route
            path="/projects/tex-obs"
            element={<Projects title="Tex-obs" category="tex-obs" />}
          />
          <Route
            path="/projects/laboratory"
            element={<Projects title="Laboratoriya" category="laboratory" />}
          />
          <Route
            path="/projects/control"
            element={<Projects title="Tashqi nazorat" category="control" />}
          />
          <Route
            path="/projects/render"
            element={<Projects title="Rendr" category="render" />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/files" element={<Files />} />
          <Route
            path="/projects/:id/folders/:folderId"
            element={<ProjectDetail />}
          />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/letters" element={<Letters />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
