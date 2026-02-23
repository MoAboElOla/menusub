import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Assets from './pages/Assets';
import Menu from './pages/Menu';
import Review from './pages/Review';
import Success from './pages/Success';
import Admin from './pages/Admin';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-[#0f1117]">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/submit/assets" element={<Assets />} />
                    <Route path="/submit/menu" element={<Menu />} />
                    <Route path="/submit/review" element={<Review />} />
                    <Route path="/submit/success" element={<Success />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
