import React, { useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import main from "../assets/img/mainImage.png";
import fishing from "../assets/videos/fishing.mp4";
import { BiArrowFromBottom } from "react-icons/bi";
import { FaFacebook, FaPlay } from "react-icons/fa6";
import { AiOutlineEye, AiOutlineFullscreen } from "react-icons/ai";
import { items, sections, services, tour } from "../utils/constants";
import { FcGoogle } from "react-icons/fc";

const Home = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    } else if (videoRef.current.msRequestFullscreen) {
      videoRef.current.msRequestFullscreen();
    }
  };

  return (
    <div className="space-y-20">
      <Motion.section
        className="w-full min-h-screen flex items-center justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Motion.div
          className="relative w-full aspect-video overflow-visible"
          whileHover={{ scale: 1.01 }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={fishing}
            poster={main}
          />

          <button
            onClick={handleFullScreen}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
          >
            <AiOutlineFullscreen className="w-5 h-5" />
          </button>

          {!isPlaying && (
            <button
              onClick={handlePlayPause}
              aria-label="Play Video"
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30"
            >
              <FaPlay className="w-12 h-12 text-white" />
            </button>
          )}

          <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2">
            <button className="flex px-6 py-4 bg-primary rounded-lg shadow-md hover:bg-primary/85">
              Upload Your Video here <BiArrowFromBottom className="size-5" />
            </button>
          </div>
        </Motion.div>
      </Motion.section>

      <section className="space-y-5">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Take a journey through World Breathtaking Landscape, <br /> Cultural
          heritage and Wildlife safari.
        </h2>
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          Vr Tours
        </h2>
        {sections?.length > 0 &&
          sections.map((section, index) => {
            const isEven = index % 2 === 0;
            return (
              <Motion.div
                key={index}
                className="flex flex-col md:flex-row w-full max-w-5xl mx-auto items-center gap-10 pb-10"
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Motion.div
                  className={`w-full md:w-1/2 ${
                    isEven ? "md:order-1" : "md:order-2"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={section.img}
                    alt={section.title}
                    className="rounded-3xl w-full h-auto object-cover"
                  />
                </Motion.div>
                <Motion.div
                  className={`w-full md:w-1/2 px-4 ${
                    isEven ? "md:order-2" : "md:order-1"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-4">
                    {section.title}
                  </h3>
                  <p className="mb-6">{section.text}</p>
                  <Motion.button
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/45 transition"
                  >
                    Watch More
                  </Motion.button>
                </Motion.div>
              </Motion.div>
            );
          })}
      </section>
      <section className="space-y-5 ">
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          Top experience
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item, index) => (
            <Motion.div
              key={index}
              className="relative group h-80 rounded-4xl overflow-hidden shadow-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

              <div className="absolute top-4 left-4 z-20 flex gap-2">
                {item.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="bg-white/80 text-sm text-gray-800 px-2 py-1 rounded-3xl font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="absolute bottom-4 left-4 z-20 text-white max-w-[80%]">
                <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                <p className="text-sm mb-3">{item.text}</p>
                <button className="bg-primary hover:bg-primary/45 transition px-4 py-2 rounded-3xl text-sm font-medium">
                  Learn More
                </button>
              </div>
            </Motion.div>
          ))}
        </div>
      </section>

      <section className="w-full flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          Top tour operators
        </h2>
        {tour.map((feature, index) => (
          <div
            key={index}
            className="flex w-full max-w-3xl h-48 bg-background shadow-lg rounded-3xl overflow-hidden"
          >
            <img
              src={feature.image}
              alt={feature.text || "Tour Operator"}
              className="rounded-3xl w-full h-auto object-cover"
            />

            <div className="p-6 flex items-center border-r-primary">
              <p className="text-lg">{feature.text}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="w-full flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          Our Services
        </h2>
        {services?.length > 0 &&
          services.map((section, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center gap-10 pb-10"
              >
                <div
                  className={`w-full md:w-1/2 mb-6 md:mb-0 ${
                    isEven ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <img
                    src={section.img}
                    alt={section.title}
                    className="rounded-3xl w-full h-auto object-cover"
                  />
                </div>

                <div
                  className={`w-full md:w-1/2 text-center md:text-left px-4 ${
                    isEven ? "md:order-2" : "md:order-1"
                  }`}
                >
                  <h3 className="inline-block text-2xl font-semibold mb-4 py-2 border-b-4 border-primary">
                    {section.title}
                  </h3>
                  <p className="mb-6">{section.text}</p>
                </div>
              </div>
            );
          })}
      </section>
      <section className="w-full flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          About Us
        </h2>
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background border border-primary rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
                Our Mission
              </h2>
              <p className="text-base leading-relaxed text-center">
                Empowering today's travelers on a journey to discover global
                tourism attractions, cultures and sustainable practices, as we
                pave the way for responsible and enriching adventures.
              </p>
            </div>
            <div className="bg-background border border-primary rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
                Our Vision
              </h2>
              <p className="text-base leading-relaxed text-center">
                Envisioning a global community of informed travelers, striving
                to revolutionize travel, tourism and education by fostering
                cultural exchange, environmental stewardship and lifelong
                learning.
                <br />
                <br />
                We shape future explorations that are ethical, enlightening and
                empowering for all.
              </p>
            </div>
          </div>
          <div className="bg-background border border-primary rounded-2xl p-6 shadow-md text-center max-w-4xl mx-auto">
            <p className="text-base leading-relaxed">
              TravelMateVR transforms you with immersive VR and web3 technology,
              making global adventures seamless, engaging, and accessible from
              anywhere. Explore, connect, and experience the world—no limits, no
              boundaries.
            </p>
          </div>
        </div>
      </section>
      <section className="w-full flex flex-col items-center justify-center gap-6 mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-titlecolor text-center mb-12">
          Sign up to Upload <br /> Your Content
        </h2>
        <div className="w-full flex items-center justify-center bg-background border border-primary rounded-3xl py-10 px-4">
          <div className="bg-white rounded-3xl p-8 space-y-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
            <div>
              <p className="text-sm text-gray-500">Welcome back</p>
              <h2 className="text-2xl font-bold text-gray-800">
                Create an account
              </h2>
            </div>
            <div className="flex space-x-4">
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition text-primary">
                <FcGoogle size={20} />
                <span className="text-sm font-medium">Google</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition text-primary">
                <FaFacebook size={20} />
                Facebook
              </button>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="flex-grow border-t" />
              <span>Or</span>
              <div className="flex-grow border-t" />
            </div>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full border border-mutedText rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue=""
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex justify-between items-center">
                  Password
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot ?
                  </a>
                </label>
                <div className="relative mt-1">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full border border-mutedText rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <AiOutlineEye className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 cursor-pointer" />
                </div>
              </div>
              <Motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ backgroundColor: "#0D1F2Az" }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-full bg-primary py-2 rounded-md hover:bg-primary/85 transition"
              >
                Create account
              </Motion.button>
            </form>
            <p className="text-xs text-center text-gray-600">
              Already Have An Account?{" "}
              <a href="#" className="text-primary hover:underline">
                Log In
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
