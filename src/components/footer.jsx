import {
  FaArrowUp,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import { ImFacebook } from "react-icons/im";
import WhiteLogo from "../assets/img/TmVr_white_logo.png";

const Footer = () => {
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative bg-transparent text-white">
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-5 right-6 z-50 bg-sky-500 hover:bg-primary p-3 rounded-md shadow-md transition"
        aria-label="Scroll to Top"
      >
        <FaArrowUp className="text-white" />
      </button>

      {/* CTA Section */}
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

      {/* Actual Footer */}
      <footer className="w-full pt-20 px-6 pb-10 bg-footerbackground">
        <div className="max-w-6xl mx-auto">
          {/* Logo + Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo */}
            <div className="flex flex-col items-start justify-center-safe space-y-2">
              <img src={WhiteLogo} alt="TravelMateVr" className="w-32 h-auto" />
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-2">Company</h3>
              <ul className="space-y-1 text-sm">
                <li>Blog</li>
                <li>Wild animals</li>
                <li>Cultural Heritage</li>
                <li>Landscape</li>
              </ul>
            </div>

            {/* Home */}
            <div>
              <h3 className="font-semibold mb-2">Home</h3>
              <ul className="space-y-1 text-sm">
                <li href="/tours">VR Tours</li>
                <li>Book safari</li>
                <li>Our Services</li>
                <li>About Us</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-2">Support</h3>
              <ul className="space-y-1 text-sm">
                <li>Terms and condition</li>
                <li>Privacy and Policy</li>
                <li>Contact us</li>
                <li>FAQs</li>
              </ul>
            </div>
          </div>

          {/* Divider + Social Icons */}
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
