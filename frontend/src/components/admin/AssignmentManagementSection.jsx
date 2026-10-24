import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../lib/api.js';

export default function AssignmentManagementSection({ token, user }) {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Assignment Modal / Form
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    course_id: '',
    module_name: 'Module 1: Topography & Site Grading',
    deadline: 'Self-Paced / Recommended 2 Weeks',
    points: 100,
    description: ''
  });

  // Submissions Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubId, setGradingSubId] = useState(null);
  const [gradeInput, setGradeInput] = useState({ score: 95, feedback: '' });

  const authToken = token || localStorage.getItem('lm_auth_token') || localStorage.getItem('admin_token') || '';

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/assignments/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/courses/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        if (data.courses && data.courses.length > 0 && !newAssignment.course_id) {
          setNewAssignment(prev => ({ ...prev, course_id: data.courses[0].id }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, [authToken]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim() || !newAssignment.description.trim()) {
      showToast('Please provide an assignment title and description.', 'error');
      return;
    }
    setCreating(true);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/assignments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newAssignment)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Assignment successfully published to student studio!');
        setModalOpen(false);
        setNewAssignment({
          title: '',
          course_id: courses[0]?.id || '',
          module_name: 'Module 1: Topography & Site Grading',
          deadline: 'Self-Paced / Recommended 2 Weeks',
          points: 100,
          description: ''
        });
        fetchAssignments();
      } else {
        showToast(data.error || 'Failed to create assignment.', 'error');
      }
    } catch (e) {
      showToast('Network error creating assignment.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (id, title) => {
    if (!window.confirm(`Permanently remove assignment: "${title}"?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/assignments/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        showToast('Assignment deleted.');
        fetchAssignments();
      } else {
        showToast('Failed to delete assignment.', 'error');
      }
    } catch (e) {
      showToast('Network error deleting assignment.', 'error');
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setReviewModalOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/assignments/${assignment.id}/submissions/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) {
      console.error('Failed to fetch submissions:', e);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleStartGrading = (sub) => {
    setGradingSubId(sub.id);
    setGradeInput({
      score: sub.score !== null ? sub.score : 95,
      feedback: sub.feedback || 'Excellent execution of contour and grading specifications.'
    });
  };

  const handleSubmitGrade = async (subId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/assignments/submissions/${subId}/grade/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          score: parseInt(gradeInput.score, 10),
          feedback: gradeInput.feedback.trim()
        })
      });
      if (res.ok) {
        showToast('Grade & evaluation feedback submitted to student!');
        setGradingSubId(null);
        // Refresh submissions
        if (selectedAssignment) {
          handleOpenSubmissions(selectedAssignment);
          fetchAssignments();
        }
      } else {
        showToast('Failed to submit evaluation.', 'error');
      }
    } catch (e) {
      showToast('Network error grading submission.', 'error');
    }
  };

  const pendingSubmissionsTotal = assignments.reduce((acc, a) => acc + (a.pending_submissions || 0), 0);
  const totalSubmissionsTotal = assignments.reduce((acc, a) => acc + (a.total_submissions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-800 text-2xl">assignment</span>
            <h1 className="text-xl font-bold text-stone-900">Course Assignments Studio</h1>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Faculty Studio
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Author practical architectural challenges, review student CAD/contour submissions, and provide certified grading feedback.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_task</span>
          <span>+ Create New Assignment</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Assignments</span>
            <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">folder_open</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{assignments.length}</div>
          <p className="text-[11px] text-stone-500 mt-1">Published studio briefs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pending Grading</span>
            <span className="material-symbols-outlined text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">pending_actions</span>
          </div>
          <div className="text-2xl font-bold text-amber-800">{pendingSubmissionsTotal}</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">Submissions awaiting instructor evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Submissions</span>
            <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">checklist</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalSubmissionsTotal}</div>
          <p className="text-[11px] text-stone-500 mt-1">Student practice submissions logged</p>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Published Studio Assignments</h2>
            <p className="text-xs text-stone-500">Live in the Student Practice portal under "Design & Engineering Studio".</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400 text-xs">Loading assignments data...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">assignment_add</span>
            </div>
            <p className="text-xs font-semibold text-stone-600">No assignments authored yet.</p>
            <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
              Create practical drawing, grading, and plant specification challenges for students to complete.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              + Create First Assignment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => (
              <div key={asg.id} className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {asg.module_name || 'Architectural Studio'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-stone-600">
                      {asg.points} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 leading-snug">{asg.title}</h3>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{asg.description}</p>
                </div>

                <div className="pt-2 border-t border-stone-200/70 space-y-3">
                  <div className="flex justify-between items-center text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {asg.deadline}
                    </span>
                    <span className="font-medium text-stone-700">
                      By: {asg.created_by_email?.split('@')[0] || 'Instructor'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleOpenSubmissions(asg)}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">rate_review</span>
                      <span>Review Submissions</span>
                      {asg.pending_submissions > 0 && (
                        <span className="bg-amber-400 text-stone-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                          {asg.pending_submissions}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteAssignment(asg.id, asg.title)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete assignment"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">add_task</span>
                <h3 className="font-bold text-base text-stone-900">Create New Course Assignment</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g. Executive Cut-and-Fill Contour Calculation Sheet"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Course Target
                  </label>
                  <select
                    value={newAssignment.course_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, course_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                    {courses.length === 0 && <option value="">General Architecture Curriculum</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Module / Studio Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.module_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, module_name: e.target.value })}
                    placeholder="Module 1: Topography & Site Grading"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Deadline / Recommended Window
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    placeholder="Self-Paced / Recommended 2 Weeks"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Total Maximum Points
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={newAssignment.points}
                    onChange={(e) => setNewAssignment({ ...newAssignment, points: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assignment Description &amp; Technical Requirements
                </label>
                <textarea
                  rows="4"
                  required
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Detail the project parameters, drawing scales (e.g. 1:20), required deliverables (DWG/PDF), and grading criteria..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS REVIEW & GRADING MODAL */}
      {reviewModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start pb-4 border-b border-stone-100 flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {selectedAssignment.module_name}
                </span>
                <h3 className="font-bold text-base text-stone-900 mt-1">{selectedAssignment.title}</h3>
                <p className="text-xs text-stone-500">Maximum Points: {selectedAssignment.points} pts</p>
              </div>
              <button 
                onClick={() => setReviewModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingSubmissions ? (
                <div className="text-center py-12 text-stone-400 text-xs">Loading student submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No student submissions received for this assignment yet.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-xs text-stone-900">{sub.student_name || sub.student_email}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{sub.student_email} • Submitted: {sub.submitted_at || 'Recently'}</div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        sub.status === 'Graded' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {sub.status === 'Graded' ? `✓ Graded: ${sub.score}/${selectedAssignment.points}` : 'Pending Review'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {sub.submission_text || 'No text notes provided with submission.'}
                    </div>

                    {sub.file_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-emerald-800 text-sm">attachment</span>
                        <a 
                          href={sub.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-800 font-semibold hover:underline"
                        >
                          View Uploaded CAD/PDF Deliverable
                        </a>
                      </div>
                    )}

                    {sub.feedback && (
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                        <span className="font-bold block text-[11px] text-emerald-800 mb-0.5">
                          Faculty Evaluation (By {sub.graded_by || 'Instructor'}):
                        </span>
                        {sub.feedback}
                      </div>
                    )}

                    {/* Grading Form Drawer */}
                    {gradingSubId === sub.id ? (
                      <div className="pt-2 border-t border-stone-200 space-y-3 bg-white p-4 rounded-xl border">
                        <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-emerald-800">rate_review</span>
                          Evaluate Student Submission
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                              Awarded Score (Max {selectedAssignment.points})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={selectedAssignment.points}
                              value={gradeInput.score}
                              onChange={(e) => setGradeInput({ ...gradeInput, score: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-bold focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                            Instructor Feedback &amp; Architectural Critique
                          </label>
                          <textarea
                            rows="3"
                            value={gradeInput.feedback}
                            onChange={(e) => setGradeInput({ ...gradeInput, feedback: e.target.value })}
                            placeholder="Provide constructive review of slope calculations, drain details, or material specifications..."
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setGradingSubId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitGrade(sub.id)}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-1.5 rounded-xl shadow-xs cursor-pointer"
                          >
                            Save &amp; Return Grade
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleStartGrading(sub)}
                          className="text-xs text-emerald-800 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">edit_note</span>
                          {sub.status === 'Graded' ? 'Edit Grade / Feedback' : 'Grade Submission'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
