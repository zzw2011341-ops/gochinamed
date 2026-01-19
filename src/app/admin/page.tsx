"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  ShoppingBag,
  FileText,
  CreditCard,
  Percent,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Stats {
  users: {
    total: number;
    patients: number;
    admins: number;
    blocked: number;
  };
  doctors: number;
  hospitals: number;
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  posts: number;
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const t = translations[language];
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Users",
      value: stats?.users.total || 0,
      icon: Users,
      color: "bg-blue-500",
      detail: `${stats?.users.patients || 0} patients`,
    },
    {
      name: "Doctors",
      value: stats?.doctors || 0,
      icon: Stethoscope,
      color: "bg-green-500",
      detail: "Active doctors",
    },
    {
      name: "Hospitals",
      value: stats?.hospitals || 0,
      icon: Building2,
      color: "bg-purple-500",
      detail: "Registered hospitals",
    },
    {
      name: "Total Orders",
      value: stats?.orders.total || 0,
      icon: ShoppingBag,
      color: "bg-orange-500",
      detail: `${stats?.orders.pending || 0} pending`,
    },
    {
      name: "Revenue",
      value: `$${(stats?.orders.revenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-teal-500",
      detail: `${stats?.orders.completed || 0} completed`,
    },
    {
      name: "Community Posts",
      value: stats?.posts || 0,
      icon: FileText,
      color: "bg-pink-500",
      detail: "Published posts",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.nav.admin || "Dashboard"}
        </h1>
        <p className="text-gray-600 mt-1">Welcome to admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.detail}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Manage Users</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Orders</span>
          </Link>
          <Link
            href="/admin/payment-accounts"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Payment Accounts</span>
          </Link>
          <Link
            href="/admin/service-fees"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Percent className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Service Fees</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    </div>
  );
}
