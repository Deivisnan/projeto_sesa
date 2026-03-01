"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function DashboardShell({ user, children }: { user: any; children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40 shadow-md">
                <div className="flex items-center space-x-3">
                    <Menu
                        className="w-6 h-6 cursor-pointer text-slate-300 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    />
                    <h1 className="text-xl font-bold tracking-tight">SysFarma</h1>
                </div>
            </div>

            {/* Sidebar handles its own showing/hiding classes based on isOpen */}
            <Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-x-hidden md:pl-0 pt-16 md:pt-0 min-h-screen">
                {children}
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
