"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Download, ExternalLink, Video } from "lucide-react";
import { generateICS, getOutlookWebCalendarUrl, getTeamsMeetingUrl } from "@/lib/calendar";

interface CalendarLinksDropdownProps {
    reviewId: string;
    projectName: string;
    scheduledDate: string | Date;
    reviewerName?: string;
    qaContactName?: string;
    leadName?: string;
    attendees?: { name: string; email: string }[];
}

export function CalendarLinksDropdown({
    reviewId,
    projectName,
    scheduledDate,
    reviewerName,
    qaContactName,
    leadName,
    attendees = []
}: CalendarLinksDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const dateObj = typeof scheduledDate === "string" ? new Date(scheduledDate) : scheduledDate;

    const eventDetails = {
        reviewId,
        projectName,
        startDate: dateObj,
        reviewerName,
        qaContactName,
        leadName,
        attendees
    };

    const outlookUrl = getOutlookWebCalendarUrl(eventDetails);
    const teamsUrl = getTeamsMeetingUrl(eventDetails);

    const handleDownloadICS = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const icsContent = generateICS(eventDetails);
        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `qa-review-${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                title="Add to Calendar / Teams"
            >
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Calendar</span>
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50 py-1 divide-y divide-gray-100 dark:divide-gray-700 animate-in fade-in-50 zoom-in-95 duration-100">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Meeting & Calendar</p>
                    </div>
                    <div className="py-1">
                        <a
                            href={outlookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                        >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>Add to Outlook Web</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                        </a>
                        <a
                            href={teamsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                        >
                            <Video className="h-4 w-4 text-indigo-500" />
                            <span>Schedule in Teams</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                        </a>
                    </div>
                    <div className="py-1">
                        <button
                            type="button"
                            onClick={handleDownloadICS}
                            className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>Download .ics File</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
