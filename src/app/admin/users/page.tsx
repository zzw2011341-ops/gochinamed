"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  User as UserIcon,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { User } from "@/storage/database/shared/schema";

export default function AdminUsersPage() {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: "block" | "unblock" | null;
  }>({
    open: false,
    userId: "",
    userName: "",
    action: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users?limit=100");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load users");
      }

      setUsers(result.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (user) =>
          (statusFilter === "blocked" && user.isBlocked) ||
          (statusFilter === "active" && !user.isBlocked)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = (userId: string, userName: string) => {
    setActionDialog({
      open: true,
      userId,
      userName,
      action: "block",
    });
  };

  const handleUnblockUser = (userId: string, userName: string) => {
    setActionDialog({
      open: true,
      userId,
      userName,
      action: "unblock",
    });
  };

  const confirmAction = async () => {
    if (!actionDialog.action) return;

    try {
      setIsProcessing(true);
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: actionDialog.userId,
          isBlocked: actionDialog.action === "block",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update user status");
      }

      await loadUsers();
      setActionDialog({ open: false, userId: "", userName: "", action: null });
    } catch (error) {
      console.error("Failed to update user status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: "default",
      staff: "secondary",
      patient: "outline",
    };

    return (
      <Badge variant={variants[role] || "outline"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all registered users ({filteredUsers.length})
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-gray-600">{user.phone}</TableCell>
                  <TableCell className="text-gray-600 uppercase">
                    {user.preferredLanguage}
                  </TableCell>
                  <TableCell className="text-gray-600">{user.points}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">
                        <Lock className="h-3 w-3 mr-1" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <Unlock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <a
                            href={`/profile/${user.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            View Profile
                          </a>
                        </DropdownMenuItem>
                        {user.role !== "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            {user.isBlocked ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUnblockUser(user.id, user.name)
                                }
                                className="text-green-600"
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Unblock User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleBlockUser(user.id, user.name)}
                                className="text-red-600"
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({ ...actionDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === "block" ? "Block User" : "Unblock User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {actionDialog.action === "block" ? "block" : "unblock"}{" "}
              <strong>{actionDialog.userName}</strong>?
              {actionDialog.action === "block" && (
                <>
                  <br />
                  <br />
                  This will prevent the user from accessing their account.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing}
              className={
                actionDialog.action === "block" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isProcessing ? (
                "Processing..."
              ) : actionDialog.action === "block" ? (
                "Block User"
              ) : (
                "Unblock User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
