// pages/Problems.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

function Problems() {
  const [problems, setProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    problem_name: "",
    problem_fee: ""
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const res = await api.get("/problems");
      setProblems(res.data);
    } catch (error) {
      console.error("Error loading problems:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.problem_name.trim()) {
      newErrors.problem_name = "Problem name is required";
    }
    if (!formData.problem_fee || isNaN(formData.problem_fee) || parseFloat(formData.problem_fee) < 0) {
      newErrors.problem_fee = "Valid fee is required (non-negative number)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      await api.post("/problems", formData);
      resetForm();
      alert("✅ Problem added successfully!");
    } catch (error) {
      console.error("Error adding problem:", error);
      alert("❌ Failed to add problem");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await api.put(`/problems/${currentId}`, formData);
      resetForm();
      alert("✅ Problem updated successfully!");
    } catch (error) {
      console.error("Error updating problem:", error);
      alert("❌ Failed to update problem");
    }
  };

  const handleEdit = (problem) => {
    setFormData({
      problem_name: problem.problem_name,
      problem_fee: problem.problem_fee
    });
    setCurrentId(problem.problem_id);
    setIsEdit(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this problem?")) {
      try {
        await api.delete(`/problems/${id}`);
        loadProblems();
        alert("✅ Problem deleted successfully!");
      } catch (error) {
        console.error("Error deleting problem:", error);
        alert("❌ Failed to delete problem");
      }
    }
  };

  const resetForm = () => {
    setFormData({ problem_name: "", problem_fee: "" });
    setShowForm(false);
    setIsEdit(false);
    setCurrentId(null);
    setErrors({});
    loadProblems();
  };

  const openAddForm = () => {
    setFormData({ problem_name: "", problem_fee: "" });
    setIsEdit(false);
    setShowForm(true);
    setErrors({});
  };

  return (
    <div className="problems-page">
      <div className="header">
        <h2>Problems</h2>
        <div className="header-right">
          <button className="back-btn" onClick={() => navigate("/services")}>
            Back to Services
          </button>
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="add-btn" onClick={openAddForm}>
            + New Problem
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="form-box">
            <h3>{isEdit ? "Edit Problem" : "Add New Problem"}</h3>
            <div className="form-group">
              <input
                type="text"
                name="problem_name"
                placeholder="Problem Name"
                value={formData.problem_name}
                onChange={handleChange}
                className={errors.problem_name ? "error-input" : ""}
              />
              {errors.problem_name && <span className="error-message">{errors.problem_name}</span>}
            </div>
            <div className="form-group">
              <input
                type="number"
                step="0.01"
                name="problem_fee"
                placeholder="Problem Fee"
                value={formData.problem_fee}
                onChange={handleChange}
                className={errors.problem_fee ? "error-input" : ""}
              />
              {errors.problem_fee && <span className="error-message">{errors.problem_fee}</span>}
            </div>
            <div className="form-actions">
              {isEdit ? (
                <button className="save-btn" onClick={handleUpdate}>Update Problem</button>
              ) : (
                <button className="save-btn" onClick={handleAdd}>Save Problem</button>
              )}
              <button className="cancel-btn" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Problem Name</th>
                <th>Fee</th>
                <th className="actions-header">Actions</th> {/* Centered header */}
              </tr>
            </thead>
            <tbody>
              {problems.length > 0 ? (
                problems.map((problem) => (
                  <tr key={problem.problem_id}>
                    <td>{problem.problem_id}</td>
                    <td>{problem.problem_name}</td>
                    <td>${parseFloat(problem.problem_fee).toFixed(2)}</td>
                    <td className="actions-cell"> {/* Centered actions */}
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(problem)}
                        title="Edit problem"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(problem.problem_id)}
                        title="Delete problem"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No problems found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Problems;