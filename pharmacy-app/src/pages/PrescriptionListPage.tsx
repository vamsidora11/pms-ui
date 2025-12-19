import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import  Sidebar  from "../components/layouts/Sidebar";
import { Topbar } from "../components/common/TopNavBar";
import { fetchPrescriptions, setFilter, setSearchType, setQuery } from "../store/prescriptionSlice";
import type { RootState, AppDispatch } from "../store";

export function PrescriptionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, filter, searchType, query, status, error } = useSelector(
    (s: RootState) => s.prescriptions
  );

  // Load prescriptions on mount
  useEffect(() => {
    dispatch(fetchPrescriptions());
  }, [dispatch]);

  // Filter by search + status
  const filtered = list.filter((p) => {
    const matchesSearch =
      !query ||
      (searchType === "prescriptionId" && p.id.toLowerCase().includes(query.toLowerCase())) ||
      (searchType === "patientId" && p.patientName.toLowerCase().includes(query.toLowerCase())) ||
      (searchType === "phone" && p.patientName.toLowerCase().includes(query.toLowerCase())); // placeholder until phone field exists

    const matchesStatus = filter === "all" || p.status === filter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ id: "u1", name: "Demo User", role: "Pharmacist" }} />
      <div className="flex-1 flex flex-col">
        <Topbar user={{ name: "Demo User", role: "Pharmacist" }} />

        <main className="flex-1 p-6 bg-gray-50 space-y-6">
          <h1 className="text-xl font-semibold">Prescription List</h1>

          {/* Search Tabs */}
          <div className="border-b">
            <nav className="flex space-x-4">
              <button
                onClick={() => dispatch(setSearchType("patientId"))}
                className={`px-3 py-2 ${searchType === "patientId" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500"}`}
              >
                Patient ID
              </button>
              <button
                onClick={() => dispatch(setSearchType("phone"))}
                className={`px-3 py-2 ${searchType === "phone" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500"}`}
              >
                Phone No
              </button>
              <button
                onClick={() => dispatch(setSearchType("prescriptionId"))}
                className={`px-3 py-2 ${searchType === "prescriptionId" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500"}`}
              >
                Prescription ID
              </button>
            </nav>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder={`Search by ${searchType}`}
            value={query}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-500"
          />

          {/* Status Filter Tabs */}
          <div className="flex gap-2">
            {["all", "new", "inprogress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => dispatch(setFilter(status as any))}
                className={`px-3 py-1 rounded ${
                  filter === status ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                {status === "inprogress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Prescription Table */}
          <div className="overflow-x-auto bg-white shadow rounded">
            {status === "loading" && <p className="p-4">Loading prescriptions...</p>}
            {status === "failed" && <p className="p-4 text-red-500">{error}</p>}
            {status === "succeeded" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Prescription ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Patient Name</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Doctor</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{p.id}</td>
                      <td className="px-4 py-2">{p.patientName}</td>
                      <td className="px-4 py-2">{p.doctor}</td>
                      <td className="px-4 py-2">{p.date}</td>
                      <td className="px-4 py-2">{p.item}</td>
                      <td className="px-4 py-2 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
