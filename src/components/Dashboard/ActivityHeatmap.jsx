import React from 'react'
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns'

const ActivityHeatmap = ({ data = {} }) => {
  const today = startOfToday()
  const daysToShow = 140 // ~20 weeks
  const startDate = subDays(today, daysToShow)
  
  const allDays = eachDayOfInterval({
    start: startDate,
    end: today
  })

  // Group days into weeks for the grid
  const weeks = []
  let currentWeek = []
  
  allDays.forEach((day, i) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || i === allDays.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const getColorLevel = (count) => {
    if (!count || count === 0) return 'bg-gray-100'
    if (count <= 1) return 'bg-indigo-200'
    if (count <= 3) return 'bg-indigo-400'
    if (count <= 5) return 'bg-indigo-600'
    return 'bg-indigo-900'
  }

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="inline-flex flex-col items-start min-w-max">
        <div className="flex gap-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const count = data[dateKey] || 0
                return (
                  <div
                    key={dateKey}
                    title={`${count} tasks completed on ${format(day, 'MMM d, yyyy')}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 hover:ring-2 hover:ring-indigo-300 cursor-pointer ${getColorLevel(count)}`}
                  />
                )
              })}
              {/* Pad last week if needed */}
              {weekIndex === weeks.length - 1 && week.length < 7 && (
                Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-3.5 h-3.5" />
                ))
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between w-full mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <div className="flex gap-4">
            <span>{format(startDate, 'MMM')}</span>
            <span>{format(subDays(today, 70), 'MMM')}</span>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-100" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-200" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-900" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityHeatmap
