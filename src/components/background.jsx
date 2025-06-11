const BackgroundCircles = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0f2c3f] overflow-hidden">
      <div className="absolute w-96 h-96 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-10 left-10" />
      <div className="absolute w-52 h-52 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-20 right-20" />
      <div className="absolute w-80 h-80 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-1/2 left-[45%] transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute w-64 h-64 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-[60%] left-24" />
      <div className="absolute w-52 h-52 bg-[#56B2E8] opacity-40 rounded-full blur-2xl bottom-32 right-16" />
      <div className="absolute w-96 h-96 bg-[#317193] opacity-40 rounded-full blur-2xl bottom-10 left-10" />
    </div>
  );
};

export default BackgroundCircles;
