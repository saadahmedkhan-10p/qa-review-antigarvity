import { getContactPersonDashboardData } from "@/app/actions/contact-person";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Clock, CheckCircle } from "lucide-react";

export default async function ContactPersonDashboard() {
    const { projects, user } = await getContactPersonDashboardData();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Person Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome back, {user.name}</p>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 gap-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Assigned Projects</h2>
                    {projects.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500">
                            You are not assigned to any projects yet.
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${project.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div>
                                            <span className="font-medium">Lead: </span>
                                            {project.lead?.name || 'Unassigned'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Reviewer: </span>
                                            {project.reviewer?.name || 'Unassigned'}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Reviews for this Project */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Review History</h4>
                                    {project.reviews.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No reviews yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {project.reviews.map((review) => (
                                                <div key={review.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                            {review.status === 'SUBMITTED' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{review.form.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(review.updatedAt), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${review.healthStatus === 'On Track' ? 'bg-green-100 text-green-800' :
                                                            review.healthStatus === 'Slightly Challenged' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {review.healthStatus}
                                                        </span>
                                                        {review.status === 'SUBMITTED' && (
                                                            <Link
                                                                href={`/reviews/${review.id}/view`}
                                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                                            >
                                                                <FileText size={16} />
                                                                View Report
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
