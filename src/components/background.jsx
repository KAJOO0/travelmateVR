const BackgroundCircles = () => {
  return (
    <div className="w-full h-full bg-[#0f2c3f] overflow-hidden">
      <div className="absolute size-32 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-10 left-10" />
      <div className="absolute size-48 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-32 right-20" />
      <div className="absolute size-24 bg-[#56B2E8] opacity-40 rounded-full blur-2xl top-80 left-40" />
      <div className="absolute size-36 bg-[#56B2E8] opacity-40 rounded-full blur-2xl bottom-32 right-16" />
      <div className="absolute size-56 bg-[#317193] opacity-40 rounded-full blur-2xl bottom-10 left-10" />
    </div>
  );
};

export default BackgroundCircles;
