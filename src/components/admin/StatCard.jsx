const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-footerbackground/40 p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-mutedText/70">{label}</p>
      <p className="text-2xl font-semibold text-titlecolor">{value}</p>
    </div>
  </div>
);

export default StatCard;
