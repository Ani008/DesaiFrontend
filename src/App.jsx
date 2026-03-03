import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './Pages/LoginPage';
import Dashboard from './Pages/HospitalDashboard';
import MainLayout from './Components/MainLayout';
import MyProject from './Pages/MyProjects';
import Surgeries from './Pages/Surgeries';
import UploadExcel from './Pages/UploadExcel';
import ProtectedRoute from './Components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Route: No Sidebar */}
        <Route path="/" element={<LoginPage />} />

        {/* 2. Protected Routes: Shared Sidebar Layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>}/>
          <Route path="/projects" element={<MyProject />}  />
          <Route path="/surgeries" element={<Surgeries/>} />
          <Route path="/uploadexcel" element={<UploadExcel/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;