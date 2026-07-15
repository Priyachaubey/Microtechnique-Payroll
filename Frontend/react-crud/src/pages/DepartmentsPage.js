import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_ORIGIN as SERVER_URL } from "../config";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout";

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${SERVER_URL}/api/Department`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to fetch departments.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Department name is required.");
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(
        `${SERVER_URL}/api/Department`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "Department created.");
      setName("");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to create department.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? Users in this department will have their department unassigned.")) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.delete(`${SERVER_URL}/api/Department/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data?.message || "Department deleted.");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete department.");
    }
  };

  return (
    <AppLayout role="admin">
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Department Management</h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Department</h2>
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="text"
              placeholder="e.g. Human Resources"
              className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              {loading ? "Adding..." : "Add Department"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.departmentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(dept.departmentId)}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No departments found. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default DepartmentsPage;
