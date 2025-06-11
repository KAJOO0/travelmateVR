import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/mainLayout";
import Home from "./pages/home";
import About from "./pages/about";
import Contact from "./pages/contact";
import Tours from "./pages/tours";
import Login from "./pages/login";
import Blog from "./pages/blog";
import Services from "./pages/services";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="vr-tours" element={<Tours />} />
          <Route path="contact" element={<Contact />} />
          <Route path="book-safari" element={<Tours />} />
          <Route path="services" element={<Services />} />
          <Route path="termsandconditions" element={<Tours />} />
          <Route path="privacypolicy" element={<Tours />} />
          <Route path="signIn" element={<Login />} />
          <Route path="blog" element={<Blog />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
