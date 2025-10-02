"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Sales", value: 45231, color: "#0088FE" },
  { name: "Purchases", value: 32150, color: "#00C49F" },
]

const COLORS = ["#0088FE", "#00C49F"]

export function SalesVsPurchasesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
