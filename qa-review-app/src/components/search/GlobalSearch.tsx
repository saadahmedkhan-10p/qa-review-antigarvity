"use client";

import { useState, useEffect } from "react";
import { Search, X, FileText, FolderKanban, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";

interface SearchResult {
    type: 'project' | 'review' | 'user' | 'form';
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [allData, setAllData] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Keyboard shortcut: Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Load all searchable data
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const response = await fetch('/api/search/data');
                if (response.ok) {
                    const data = await response.json();
                    setAllData(data);
                }
            } catch (error) {
                console.error("Error loading search data:", error);
            } finally {
                setLoading(false);
            }
        }
        if (isOpen && allData.length === 0) {
            loadData();
        }
    }, [isOpen, allData.length]);

    // Fuzzy search
    useEffect(() => {
        if (query.trim() === "") {
            setResults(allData.slice(0, 8));
            setSelectedIndex(0);
            return;
        }

        const fuse = new Fuse(allData, {
            keys: ['title', 'subtitle'],
            threshold: 0.3,
            includeScore: true
        });

        const searchResults = fuse.search(query).map(result => result.item);
        setResults(searchResults.slice(0, 8));
        setSelectedIndex(0);
    }, [query, allData]);

    const handleSelect = (result: SearchResult) => {
        router.push(result.url);
        setIsOpen(false);
        setQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setQuery("");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'project': return FolderKanban;
            case 'review': return FileText;
            case 'user': return User;
            case 'form': return FileText;
            default: return Search;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'project': return 'text-indigo-600 dark:text-indigo-400';
            case 'review': return 'text-blue-600 dark:text-blue-400';
            case 'user': return 'text-purple-600 dark:text-purple-400';
            case 'form': return 'text-cyan-600 dark:text-cyan-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Search...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                    <span>⌘</span>K
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Search Modal */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
                <div className="w-full max-w-2xl mx-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                            <Search className="h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search projects, reviews, users..."
                                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
                                autoFocus
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {query ? "No results found" : "Start typing to search"}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {results.map((result, index) => {
                                        const Icon = getIcon(result.type);
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                                    }`}
                                            >
                                                <div className={`flex-shrink-0 ${getTypeColor(result.type)}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {result.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {result.subtitle}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                                                        {result.type}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↓</kbd>
                                        <span>to navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                                        <span>to select</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">esc</kbd>
                                        <span>to close</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
