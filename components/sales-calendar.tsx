"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Download, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DayData {
  date: string
  totalSales: number
  totalProfit: number
  transactionCount: number
}

interface SalesCalendarProps {
  warehouseId: string
  onDateClick: (date: string) => void
  apiEndpoint: string // '/api/sale/daily-analytics' for offline, '/api/sale/daily-analytics-online' for online
  className?: string
}

export function SalesCalendar({ warehouseId, onDateClick, apiEndpoint, className }: SalesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize state to the beginning of the current month in UTC. This is correct.
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  });
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // --- UTC Correction ---
  // Helper to reliably format a Date object into a "YYYY-MM-DD" string using its UTC values.
  const toYMDString = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- UTC Correction ---
  // Perform all date calculations in UTC to avoid timezone-related shifts.
  const monthStart = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1));
  const startDate = new Date(monthStart);
  // Adjust the start date to the beginning of the week (Sunday) using UTC methods.
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const monthStr = currentMonth.toISOString().slice(0, 7) // This is fine, it produces YYYY-MM
      const response = await fetch(`${apiEndpoint}?warehouseId=${warehouseId}&month=${monthStr}`)
      const data = await response.json()
      setMonthlyData(data)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (warehouseId) {
      fetchMonthlyData()
    }
  }, [currentMonth, warehouseId, apiEndpoint])

  const getDayData = (date: Date): DayData | null => {
    // --- UTC Correction ---
    // Use the UTC-based helper function to match the date format from your API.
    const dateStr = toYMDString(date);
    return monthlyData?.dailyStats?.find((day: any) => day.date === dateStr) || null
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      // --- UTC Correction ---
      // Modify the month using UTC methods.
      if (direction === 'prev') {
        newDate.setUTCMonth(newDate.getUTCMonth() - 1)
      } else {
        newDate.setUTCMonth(newDate.getUTCMonth() + 1)
      }
      return newDate
    })
  }

  const getDayClass = (date: Date, dayData: DayData | null) => {
    // --- UTC Correction ---
    // Compare the calendar date (which is in UTC) with today's date.
    const localToday = new Date();
    const isToday = date.getUTCFullYear() === localToday.getFullYear() &&
                    date.getUTCMonth() === localToday.getMonth() &&
                    date.getUTCDate() === localToday.getDate();

    const isCurrentMonth = date.getUTCMonth() === currentMonth.getUTCMonth();
    const hasSales = dayData && dayData.totalSales > 0

    return cn(
      "min-h-[80px] p-1 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50",
      {
        "bg-blue-50 border-blue-200": isToday,
        "text-gray-400": !isCurrentMonth,
        "bg-green-50 hover:bg-green-100": hasSales && isCurrentMonth,
        "hover:bg-blue-100": isToday
      }
    )
  }

  const renderCalendarDays = () => {
    const days = []
    const loopStartDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(loopStartDate)
      // --- UTC Correction ---
      // Increment the date using UTC to build the calendar grid.
      currentDate.setUTCDate(loopStartDate.getUTCDate() + i);

      const dayData = getDayData(currentDate);
      const isCurrentMonth = currentDate.getUTCMonth() === currentMonth.getUTCMonth();
      
      days.push(
        <div
          key={currentDate.toISOString()}
          className={getDayClass(currentDate, dayData)}
          // --- UTC Correction ---
          // Pass the correct YYYY-MM-DD string to the click handler.
          onClick={() => isCurrentMonth && onDateClick(toYMDString(currentDate))}
        >
          <div className="font-medium text-sm mb-1">
            {/* --- UTC Correction --- Display the UTC day of the month. */}
            {currentDate.getUTCDate()}
          </div>
          {dayData && isCurrentMonth && (
            <div className="space-y-1">
              <div className="text-xs text-green-600 font-medium">
                {formatCurrency(dayData.totalSales)}
              </div>
              <div className="text-xs text-blue-600">
                P: {formatCurrency(dayData.totalProfit)}
              </div>
              <div className="text-xs text-gray-500">
                {dayData.transactionCount} sales
              </div>
            </div>
          )}
        </div>
      )
    }

    return days
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Sales Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {/* --- UTC Correction --- 
                  Ensure the month name is displayed based on UTC, not the local timezone. */}
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {monthlyData && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Total Sales
              </div>
              <div className="font-bold text-lg text-green-600">
                {formatCurrency(monthlyData.monthlyTotal.totalSales)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Total Profit
              </div>
              <div className="font-bold text-lg text-blue-600">
                {formatCurrency(monthlyData.monthlyTotal.totalProfit)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <ShoppingCart className="h-4 w-4" />
                Transactions
              </div>
              <div className="font-bold text-lg text-purple-600">
                {monthlyData.monthlyTotal.totalTransactions}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0 border">
          {loading ? (
            <div className="col-span-7 text-center py-8 text-gray-500">
              Loading calendar data...
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>• Click on any date to view detailed sales information</div>
          <div>• Green background indicates days with sales</div>
          <div>• Values shown: Total Sales, Profit (P:), Transaction count</div>
        </div>
      </CardContent>
    </Card>
  )
}
