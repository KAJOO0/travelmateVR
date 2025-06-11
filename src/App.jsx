import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/mainLayout";
import Home from "./pages/home";
import About from "./pages/about";
import Contact from "./pages/contact";
import Tours from "./pages/tours";
import Login from "./pages/login";
import Blog from "./pages/blog";
import Services from "./pages/services";
import Cultural from "./pages/cultural";
import Landscape from "./pages/landscape";
import Wildlife from "./pages/wildlife";
import FAQS from "./pages/faqs";

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
          <Route path="faqs" element={<FAQS />} />
          <Route path="cultural-heritage" element={<Cultural />} />
          <Route path="landscape" element={<Landscape />} />
          <Route path="wild-animals" element={<Wildlife />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
