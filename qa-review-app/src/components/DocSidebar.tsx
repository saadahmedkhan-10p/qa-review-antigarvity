"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, BookOpen, Users, LayoutDashboard, FileText, Settings, Key, Shield, HelpCircle } from "lucide-react";

export const docSections = [
  {
    title: "Getting Started",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "system-overview", label: "System Overview" },
    ],
  },
  {
    title: "Access & Security",
    icon: <Shield className="w-5 h-5" />,
    items: [
      { id: "roles-permissions", label: "Roles & Permissions" },
      { id: "adding-users", label: "Adding Users & Roles" },
    ],
  },
  {
    title: "Core Entities",
    icon: <LayoutDashboard className="w-5 h-5" />,
    items: [
      { id: "projects", label: "Projects" },
      { id: "forms", label: "Forms & Templates" },
      { id: "review-cycles", label: "Review Cycles" },
      { id: "comments", label: "Comments & Feedback" },
    ],
  },
  {
    title: "Reporting",
    icon: <FileText className="w-5 h-5" />,
    items: [
      { id: "dashboards", label: "Role Dashboards" },
      { id: "exporting-data", label: "Exporting Data" },
    ],
  },
  {
    title: "Support",
    icon: <HelpCircle className="w-5 h-5" />,
    items: [
      { id: "faqs", label: "FAQs" },
    ],
  },
];

export default function DocSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-16 hidden md:block">
      <div className="p-6">
        <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Documentation
        </h2>
        <nav className="space-y-8">
          {docSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                <span className="text-blue-600 dark:text-blue-400">{section.icon}</span>
                {section.title}
              </h3>
              <ul className="space-y-1.5 border-l border-gray-200 dark:border-gray-800 ml-2 pl-4">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/documentation#${item.id}`}
                      className="group flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 mr-1 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-blue-600 dark:text-blue-400" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
