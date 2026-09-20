export const Table = ({ children }) => (
  <div className="overflow-x-auto rounded-2xl border border-primary/30">
    <table className="w-full min-w-max text-left text-sm">{children}</table>
  </div>
);

export const Thead = ({ children }) => (
  <thead className="bg-footerbackground/60 text-mutedText/70">
    <tr>{children}</tr>
  </thead>
);

export const Th = ({ children }) => <th className="px-4 py-3 font-medium">{children}</th>;

export const Tr = ({ children }) => (
  <tr className="border-t border-primary/10 text-titlecolor hover:bg-footerbackground/30">{children}</tr>
);

export const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);
