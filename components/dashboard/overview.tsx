'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

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
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Month
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {payload[0].payload.name}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Places
                      </span>
                      <span className="font-bold">
                        {payload[0].payload.total}
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