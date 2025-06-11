import { Link } from "react-router-dom";
import {
  FaArrowUp,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import { ImFacebook } from "react-icons/im";
import WhiteLogo from "../assets/img/TmVr_white_logo.png";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative bg-transparent text-white">
      <button
        onClick={scrollToTop}
        className="fixed bottom-10 right-6 z-50 bg-sky-500 hover:bg-primary p-3 rounded-md shadow-md transition"
        aria-label="Scroll to Top"
      >
        <FaArrowUp className="text-white" />
      </button>

      <div className="w-full flex justify-center px-4 mb-4 z-10 relative">
        <div className="bg-sky-500 text-white px-6 py-4 rounded-md max-w-xl w-full flex justify-between items-center shadow-lg">
          <p className="text-sm sm:text-base font-medium">
            Do you need customized trip?
          </p>
          <button className="bg-transparent border border-white text-white text-sm px-4 py-1 rounded hover:bg-white hover:text-sky-500 transition">
            Click here
          </button>
        </div>
      </div>

      <footer className="w-full pt-20 px-6 pb-10 bg-footerbackground">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-start justify-center-safe space-y-2">
              <img src={WhiteLogo} alt="TravelMateVr" className="w-32 h-auto" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Company</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/wild-animals">Wild animals</Link>
                </li>
                <li>
                  <Link to="/cultural-heritage">Cultural Heritage</Link>
                </li>
                <li>
                  <Link to="/landscape">Landscape</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Home</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/vr-tours">VR Tours</Link>
                </li>
                <li>
                  <Link to="/book-safari">Book safari</Link>
                </li>
                <li>
                  <Link to="/services">Our Services</Link>
                </li>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Support</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/termsandconditions">Terms and condition</Link>
                </li>
                <li>
                  <Link to="/privacypolicy">Privacy and Policy</Link>
                </li>
                <li>
                  <Link to="/contact">Contact us</Link>
                </li>
                <li>
                  <Link to="/faqs">FAQs</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div className="flex justify-center space-x-4 text-white">
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" aria-label="Facebook">
              <ImFacebook />
            </a>
            <a href="#" aria-label="X">
              <FaXTwitter />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
