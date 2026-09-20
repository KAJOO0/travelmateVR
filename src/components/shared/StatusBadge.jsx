const STYLES = {
  confirmed: "bg-emerald-500/20 text-emerald-300",
  active: "bg-emerald-500/20 text-emerald-300",
  published: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  draft: "bg-amber-500/20 text-amber-300",
  cancelled: "bg-red-500/20 text-red-300",
};

const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STYLES[status] ?? "bg-white/10 text-mutedText"}`}>
    {status}
  </span>
);

export default StatusBadge;
