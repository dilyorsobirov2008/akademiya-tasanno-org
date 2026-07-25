"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCheck, UserX, Trash2, Edit3, Check, X, Search, ShieldCheck, Clock, Ban } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  fullName: string;
  phone: string;
  role: "admin" | "employee";
  status: "pending" | "approved" | "rejected";
  branchId: string | null;
  branch: { name: string } | null;
  positionId: string | null;
  position: { name: string } | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editBranchId, setEditBranchId] = useState<string>("");
  const [editPositionId, setEditPositionId] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/admin/users${qs}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches ?? []));
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => setPositions(d.positions ?? []));
  }, [load]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setActingId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActingId(null);
    load();
  }

  async function deleteUser(id: string) {
    if (!confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) return;
    setActingId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setActingId(null);
    load();
  }

  function startEdit(u: UserRow) {
    setEditingUser(u);
    setEditBranchId(u.branchId ?? "");
    setEditPositionId(u.positionId ?? "");
  }

  async function saveEdit() {
    if (!editingUser) return;
    setActingId(editingUser.id);
    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId: editBranchId || null,
        positionId: editPositionId || null,
      }),
    });
    setEditingUser(null);
    setActingId(null);
    load();
  }

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.phone.toLowerCase().includes(term) ||
      (u.branch?.name && u.branch.name.toLowerCase().includes(term)) ||
      (u.position?.name && u.position.name.toLowerCase().includes(term))
    );
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">👥 Xodimlarni Moderatsiya Qilish</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ro'yxatdan o'tgan yangi xodimlarni tasdiqlash, rad etish hamda filial/lavozimlarini biriktirish.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tab Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Clock className="h-4 w-4" /> Kutilmoqda
              {pendingCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white text-amber-600 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter("approved")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === "approved"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Tasdiqlanganlar
            </button>

            <button
              onClick={() => setStatusFilter("rejected")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === "rejected"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Ban className="h-4 w-4" /> Rad Etilganlar
            </button>

            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === "" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Barchasi
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Qidirish (Ism, Telefon)..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0 border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-5 py-3.5">F.I.Sh</th>
                <th className="px-5 py-3.5">Telefon</th>
                <th className="px-5 py-3.5">Filial</th>
                <th className="px-5 py-3.5">Lavozim</th>
                <th className="px-5 py-3.5">Holat</th>
                <th className="px-5 py-3.5 text-right">Amallar / Boshqaruv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Bu bo'limda foydalanuvchilar topilmadi
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const isEditing = editingUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{u.fullName}</td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{u.phone}</td>

                    {/* Filial */}
                    <td className="px-5 py-4 text-slate-700">
                      {isEditing ? (
                        <select
                          value={editBranchId}
                          onChange={(e) => setEditBranchId(e.target.value)}
                          className="h-8 rounded-lg border border-slate-300 bg-white text-xs px-2 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Filialni tanlang</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          🏢 {u.branch?.name ?? "Tanlanmagan"}
                        </span>
                      )}
                    </td>

                    {/* Lavozim */}
                    <td className="px-5 py-4 text-slate-700">
                      {isEditing ? (
                        <select
                          value={editPositionId}
                          onChange={(e) => setEditPositionId(e.target.value)}
                          className="h-8 rounded-lg border border-slate-300 bg-white text-xs px-2 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Lavozimni tanlang</option>
                          {positions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          💼 {u.position?.name ?? "Tanlanmagan"}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge status={u.status}>
                        {u.status === "pending"
                          ? "⏳ Kutilmoqda"
                          : u.status === "approved"
                          ? "🟢 Tasdiqlangan"
                          : "🔴 Rad etilgan"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs" onClick={saveEdit}>
                            <Check className="h-4 w-4 mr-1" /> Saqlash
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingUser(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          {u.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold px-3 gap-1 rounded-lg shadow-sm"
                                disabled={actingId === u.id}
                                onClick={() => updateStatus(u.id, "approved")}
                              >
                                <UserCheck className="h-4 w-4" /> Tasdiqlash
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs font-semibold px-3 gap-1 rounded-lg shadow-sm"
                                disabled={actingId === u.id}
                                onClick={() => updateStatus(u.id, "rejected")}
                              >
                                <UserX className="h-4 w-4" /> Rad etish
                              </Button>
                            </>
                          )}

                          {u.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              disabled={actingId === u.id}
                              onClick={() => updateStatus(u.id, "rejected")}
                            >
                              Bloklash
                            </Button>
                          )}

                          {u.status === "rejected" && (
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={actingId === u.id}
                              onClick={() => updateStatus(u.id, "approved")}
                            >
                              Qayta tasdiqlash
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-slate-600 hover:bg-slate-100"
                            onClick={() => startEdit(u)}
                            title="Filial yoki Lavozimni tahrirlash"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                            onClick={() => deleteUser(u.id)}
                            title="O'chirish"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
