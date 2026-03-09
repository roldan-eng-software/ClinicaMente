"use client"

import { useTheme } from "@/hooks/useTheme"
import { Moon, Sun, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Escuro" },
    { value: "system", icon: Monitor, label: "Sistema" },
  ] as const

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]

  return (
    <div className="relative group">
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Alternar tema"
      >
        <currentTheme.icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      </button>

      <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-1">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                theme === t.value
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
