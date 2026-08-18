"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface TrendPoint {
  date: string;
  count: number;
}

export function EnquiryTrendChart({ data }: { data: TrendPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No enquiries in the last 30 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="enquiryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#717568" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#717568" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#dcdcc0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#565a4e" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#565a4e" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1d2534",
            border: "1px solid #2f3a4d",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f6f6df",
          }}
          labelStyle={{ color: "#f6f6df" }}
          itemStyle={{ color: "#f6f6df" }}
          label="Enquiries"
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#717568"
          strokeWidth={2}
          fill="url(#enquiryGradient)"
          name="Enquiries"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DistPoint {
  name: string;
  value: number;
  color: string;
}

export function DistributionPieChart({ data }: { data: DistPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1d2534",
            border: "1px solid #2f3a4d",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f6f6df",
          }}
          itemStyle={{ color: "#f6f6df" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface GrowthPoint {
  name: string;
  value: number;
}

export function GrowthBarChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dcdcc0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#565a4e" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#565a4e" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1d2534",
            border: "1px solid #2f3a4d",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f6f6df",
          }}
          itemStyle={{ color: "#f6f6df" }}
          cursor={{ fill: "#71756820" }}
        />
        <Bar dataKey="value" fill="#717568" radius={[4, 4, 0, 0]} name="Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
