import DocSidebar, { docSections } from "@/components/DocSidebar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-16">
      <div className="flex flex-1 max-w-[1400px] w-full mx-auto relative">
        <DocSidebar />
        
        <main className="flex-1 px-8 py-12 lg:px-16 max-w-4xl scroll-smooth">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">QA Review App Documentation</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Welcome to the official documentation for the QA Review framework. Everything you need to know about navigating the system, managing roles, and conducting reviews.
            </p>
          </div>

          <div className="space-y-24">
            {/* INTRODUCTION */}
            <section id="introduction" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                At our organization, maintaining software quality is paramount. The QA Review App is a robust platform designed to facilitate cross-functional reviews of software architecture, development practices, and testing procedures.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                It empowers teams to thoroughly plan, conduct, and report on quality reviews, ensuring software resilience and alignment with core architectural principles before deployment.
              </p>
            </section>

            {/* SYSTEM OVERVIEW */}
            <section id="system-overview" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">System Overview</h2>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">A Centralized Ecosystem</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Through which multiple stakeholders (Admins, QA Managers, PMs, Leads) can manage reviews, comment on findings, and aggregate testing performance metrics on a single connected platform.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-green-600 dark:text-green-400">Dynamic Workflows</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Reviews are scoped into cycles linked to diverse projects. Real-time commenting allows developers and architects to remediate issues promptly before QA sign-off.
                </p>
              </div>
            </section>

            {/* ROLES & PERMISSIONS */}
            <section id="roles-permissions" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Roles & Permissions</h2>
              <p className="text-gray-700 dark:text-gray-300">
                The platform is governed by a strict Role-Based Access Control (RBAC) system. The following roles define user capabilities:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-purple-700 dark:text-purple-400">Admin / QA Head</h4>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Full system access, managing users, projects, custom forms, and overseeing all reviews.</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-indigo-700 dark:text-indigo-400">QA Manager / Architect</h4>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Creates reviews, assigns reviewers, and finalizes findings without direct user management.</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-cyan-700 dark:text-cyan-400">Review Lead / Reviewer</h4>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Executes the actual review, fills out forms, flags issues, and marks status (Pass/Fail).</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-orange-700 dark:text-orange-400">Stakeholders (PM/Director)</h4>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">View access to relevant projects and analytics dashboards to track progress and blockers.</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg relative">
                <img src="/docs/admin_dashboard.png" alt="Admin Role Dashboard" className="w-full h-auto" />
              </div>
            </section>

            {/* ADDING USERS */}
            <section id="adding-users" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Adding Users & Roles</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold">Navigate to the Users Table</h4>
                    <p className="text-gray-600 dark:text-gray-400">As an Admin, click on "Users" from the top navigation bar.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold">Create or Bulk Invite</h4>
                    <p className="text-gray-600 dark:text-gray-400">Click "Add User" to input details manually, or select "Bulk Invite" to parse a CSV of emails.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold">Assign Roles</h4>
                    <p className="text-gray-600 dark:text-gray-400">Provide the appropriate roles. Once saved, the user receives an invitation or immediate access.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg relative">
                <img src="/docs/admin_users.png" alt="Admin Users Management" className="w-full h-auto" />
              </div>
            </section>

             {/* PROJECTS */}
             <section id="projects" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Projects</h2>
              <p className="text-gray-700 dark:text-gray-300">
                A project represents an ongoing client engagement or internal product. It hosts multiple review cycles.
                Navigate to "Projects" via the navbar to manage details like Type, Status, Contact Persons, and assigned Reviewers.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> A project must have at least one user assigned to it as a Contact Person for them to view associated reviews.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg relative">
                <img src="/docs/qa_manager_projects.png" alt="QA Manager Projects View" className="w-full h-auto" />
              </div>
            </section>

            {/* FORMS */}
            <section id="forms" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Forms & Templates</h2>
              <p className="text-gray-700 dark:text-gray-300">
                To conduct a review, a standardized form template must exist. Admins and QA Managers can create dynamic Question/Answer forms using the drag-and-drop form builder feature.
              </p>

              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg relative">
                <img src="/docs/admin_forms.png" alt="Admin Forms Builder" className="w-full h-auto" />
              </div>
            </section>

            {/* REVIEW CYCLES */}
            <section id="review-cycles" className="space-y-4 scroll-mt-24">
              <h2 className="text-3xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Review Cycles</h2>
              <p className="text-gray-700 dark:text-gray-300">
                A review cycle represents an active evaluation of a specific Project using a designated Form. The lifecycle incorporates various statuses such as NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, IN_REMEDIATION, and APPROVED.
              </p>
              
              <h3 className="font-bold mt-6 mb-2">Conducting a Review</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Reviewers navigate to their active assigned reviews and click "Conduct".</li>
                <li>They assess each form field point, leaving comments if any violations are found.</li>
                <li>The cycle status updates automatically once the reviewer marks their findings, transitioning to remediation if issues exist.</li>
              </ul>

              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg relative">
                <img src="/docs/conduct_review_flow.png" alt="Conduct Review Flow" className="w-full h-auto" />
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
