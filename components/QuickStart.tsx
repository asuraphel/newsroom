// components/QuickStart.tsx
import { Newspaper, History, ArrowRight } from "lucide-react";

interface QuickStartProps {
  onSuggest: (prompt: string) => void;
}

export function QuickStart({ onSuggest }: QuickStartProps) {
  const categories = [
    {
      title: "Global News",
      icon: <Newspaper className="w-4 h-4 text-blue-500" />,
      items: [
        { label: "AI Developments", prompt: "What's new in AI?" },
        { label: "Premier League", prompt: "What's new in Premier League" },
      ],
    },
    {
      title: "Technical Changelogs",
      icon: <History className="w-4 h-4 text-purple-500" />,
      items: [
        { label: "Django Updates", prompt: "What's new in Django" },
        { label: "React Features", prompt: "What's new in react" },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-[15%] max-w-2xl mx-auto w-full animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          {/* <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 shadow-sm border border-blue-100">
            <Newspaper className="w-6 h-6 text-blue-600" />
          </div> */}
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
            Newsroom
          </h1>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          What do you want catch up on today?
        </h1>
        <p className="text-slate-500 mt-2 text-sm hidden md:block">
          Select a topic below to explore the latest news and technical updates.
        </p>
      </div>

      {/* Suggestion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              {cat.icon}
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {cat.title}
              </h2>
            </div>

            <div className="space-y-2">
              {cat.items.map((item) => (
                <button
                  key={item.prompt}
                  onClick={() => onSuggest(item.prompt)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 transition-all group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                    {item.prompt}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
