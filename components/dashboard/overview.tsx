'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const data = [
  { name: 'Jan', total: 12 },
  { name: 'Feb', total: 15 },
  { name: 'Mar', total: 18 },
  { name: 'Apr', total: 22 },
  { name: 'May', total: 25 },
  { name: 'Jun', total: 30 },
  { name: 'Jul', total: 35 },
  { name: 'Aug', total: 32 },
  { name: 'Sep', total: 28 },
  { name: 'Oct', total: 24 },
  { name: 'Nov', total: 20 },
  { name: 'Dec', total: 16 },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-muted-foreground/20"
        />
        <XAxis
          dataKey="name"
          className="fill-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          className="fill-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Month
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Places
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: 'hsl(var(--primary))' }}
                      >
                        {payload[0].value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
