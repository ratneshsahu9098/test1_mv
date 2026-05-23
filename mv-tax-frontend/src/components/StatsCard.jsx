import { memo } from "react";

const StatsCard = memo(function StatsCard({
  title,
  value,
  color
}) {
  return (
    <div className={`p-6 rounded-2xl text-white shadow-lg ${color}`}>
      <h2 className="text-sm font-medium text-white/70">{title}</h2>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
});

export default StatsCard;