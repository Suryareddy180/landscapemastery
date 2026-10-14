import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../../lib/api.js';
import CourseVideoPlayer from '../CourseVideoPlayer.jsx';

const VEED_TEST_FIXTURE_URL = 'https://www.veed.io/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a?watermark=1&color=&sharing=1&title=1';
const VEED_TEST_VIDEO_ID = '8317ab9c-7a4f-4088-bdcb-06cc3b04399a';

const PRESET_COVERS = [
  { label: 'Landscape Masterclass', url: '/course_thumb_landscape.jpg' },
  { label: 'Botanical Scenography', url: '/course_thumb_botanical.jpg' },
  { label: 'Hardscape Engineering', url: '/course_thumb_hardscape.jpg' },
  { label: 'Python & Software Tech', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Modern Minimalist', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80' },
];

const resolveCoverUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/media/')) return `${BASE_URL}${url}`;
  return url;
};

export default function CourseBuilderSection({ token }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('499.00');
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // Course Edit Modal (Pricing & Title)
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCoursePrice, setEditCoursePrice] = useState('499.00');
  const [editCourseDiscountPrice, setEditCourseDiscountPrice] = useState('499.00');
  const [editCourseSubmitting, setEditCourseSubmitting] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [newAsset, setNewAsset] = useState({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [mutationMessage, setMutationMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [coverUpdating, setCoverUpdating] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const coverFileInputRef = useRef(null);

  // Lesson Management & VEED Integration States
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({
    courseId: '',
    moduleId: '',
    title: '',
    description: '',
    video_provider: 'veed',
    video_url: '',
    duration: '45 mins',
    order: 1,
    is_free_preview: false,
    is_published: true
  });
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [lessonDeleteModalOpen, setLessonDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  // Video Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewVideoData, setPreviewVideoData] = useState(null);
  const [veedValidationState, setVeedValidationState] = useState({ checking: false, result: null, error: null });

  const getAuthToken = () => token || localStorage.getItem('lm_auth_token') || '';

  useEffect(() => {
    if (selectedCourse) {
      setCoverUrlInput(selectedCourse.thumbnail || '');
    }
  }, [selectedCourse?.id, selectedCourse?.thumbnail]);

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${BASE_URL}/api/admin/courses/`, { headers });
      if (res.ok) {
        const data = await res.json();
        const courseList = data.courses || [];
        setCourses(courseList);
        if (courseList.length > 0) {
          if (!selectedCourse) {
            loadCourseDetail(courseList[0].id);
          } else {
            // Check if selectedCourse still exists
            const exists = courseList.find(c => c.id === selectedCourse.id);
            if (exists) {
              loadCourseDetail(selectedCourse.id);
            } else {
              loadCourseDetail(courseList[0].id);
            }
          }
        } else {
          setSelectedCourse(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetail = async (courseId) => {
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${BASE_URL}/api/admin/courses/${courseId}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourse(data);
      }
    } catch (e) {
      console.error('Failed to load course details:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // COURSE ACTIVATION / DEACTIVATION & STATUS MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleUpdateCourseStatus = async (courseId, newStatus) => {
    setStatusUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/${courseId}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const statusLabel = newStatus === 'PUBLISHED' ? 'Activated & Published' : `Deactivated (${newStatus})`;
        setMutationMessage({
          type: 'success',
          text: `Course status successfully changed to "${statusLabel}"!`
        });
        await fetchCourses();
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to update course status.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while updating course status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleActive = (course) => {
    if (!course) return;
    const isCurrentlyPublished = course.status === 'PUBLISHED';
    const nextStatus = isCurrentlyPublished ? 'DRAFT' : 'PUBLISHED';
    handleUpdateCourseStatus(course.id, nextStatus);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${BASE_URL}/api/admin/courses/${courseId}/`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setMutationMessage({ type: 'success', text: 'Course successfully deleted.' });
        setSelectedCourse(null);
        await fetchCourses();
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to delete course.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while deleting course.' });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // COURSE PRICING & TITLE EDIT MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleOpenEditModal = (course) => {
    if (!course) return;
    setEditCourseTitle(course.title || '');
    setEditCoursePrice(String(course.price || '499.00'));
    setEditCourseDiscountPrice(String(course.discount_price || course.price || '499.00'));
    setEditCourseModalOpen(true);
  };

  const handleSaveCoursePrice = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCourse) return;

    const parsedPrice = parseFloat(editCoursePrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setMutationMessage({ type: 'error', text: 'Please enter a valid positive price (e.g. 499).' });
      return;
    }

    setEditCourseSubmitting(true);
    setMutationMessage(null);
    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };

      const payload = {
        price: parsedPrice,
        discount_price: parseFloat(editCourseDiscountPrice) || parsedPrice
      };
      if (editCourseTitle.trim()) {
        payload.title = editCourseTitle.trim();
      }

      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMutationMessage({
          type: 'success',
          text: `Course pricing for "${data.course?.title || selectedCourse.title}" updated to ₹${parsedPrice} successfully!`
        });
        setEditCourseModalOpen(false);
        await fetchCourses();
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to update course pricing.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while updating course pricing.' });
    } finally {
      setEditCourseSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // COURSE COVER PHOTO MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;

    if (!file.type.startsWith('image/')) {
      setMutationMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }

    setCoverUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/upload-cover/`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newThumb = data.thumbnail;
        setSelectedCourse(prev => prev ? { ...prev, thumbnail: newThumb } : null);
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, thumbnail: newThumb } : c));
        setCoverUrlInput(newThumb || '');
        setMutationMessage({ type: 'success', text: 'Course cover photo uploaded and updated successfully!' });
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to upload cover photo.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while uploading cover photo.' });
    } finally {
      setCoverUpdating(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  const handleSaveCoverUrl = async () => {
    if (!selectedCourse) return;
    const trimmed = coverUrlInput.trim();
    setCoverUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ thumbnail: trimmed })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedThumb = data.course?.thumbnail ?? trimmed;
        setSelectedCourse(prev => prev ? { ...prev, thumbnail: updatedThumb } : null);
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, thumbnail: updatedThumb } : c));
        setMutationMessage({ type: 'success', text: 'Course cover photo URL updated successfully!' });
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to update cover photo URL.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while updating cover photo.' });
    } finally {
      setCoverUpdating(false);
    }
  };

  const handleApplyPresetCover = async (url) => {
    if (!selectedCourse) return;
    setCoverUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ thumbnail: url })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedThumb = data.course?.thumbnail ?? url;
        setSelectedCourse(prev => prev ? { ...prev, thumbnail: updatedThumb } : null);
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, thumbnail: updatedThumb } : c));
        setCoverUrlInput(url);
        setMutationMessage({ type: 'success', text: 'Preset cover photo applied successfully!' });
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to apply preset cover.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while applying preset cover.' });
    } finally {
      setCoverUpdating(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!selectedCourse) return;
    setCoverUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ thumbnail: '' })
      });

      if (res.ok) {
        setSelectedCourse(prev => prev ? { ...prev, thumbnail: '' } : null);
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, thumbnail: '' } : c));
        setCoverUrlInput('');
        setMutationMessage({ type: 'success', text: 'Course cover photo removed.' });
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to remove cover photo.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while removing cover photo.' });
    } finally {
      setCoverUpdating(false);
    }
  };

  const handleCreateCourse = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCourseTitle.trim()) {
      setMutationMessage({ type: 'error', text: 'Please enter a course title.' });
      return;
    }

    setLoading(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newCourseTitle.trim(),
          price: parseFloat(newCoursePrice) || 499.00
        })
      });

      const data = await res.json();

      if (res.ok && data.id) {
        const createdTitle = newCourseTitle.trim();
        setNewCourseTitle('');
        setMutationMessage({ type: 'success', text: `Course "${createdTitle}" created successfully!` });
        await fetchCourses();
        loadCourseDetail(data.id);
      } else {
        setMutationMessage({ type: 'error', text: data.error || 'Failed to create course.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while creating course.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourse) return;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/courses/${selectedCourse.id}/modules/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newModuleTitle.trim() })
      });

      if (res.ok) {
        setNewModuleTitle('');
        setMutationMessage({ type: 'success', text: 'Module successfully added and persisted!' });
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to add module.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Failed to add module.' });
    }
  };

  // ---------------------------------------------------------------------------
  // LESSON MANAGEMENT & VEED INTEGRATION ACTIONS
  // ---------------------------------------------------------------------------
  const handleOpenAddLesson = (modId) => {
    setEditingLesson(null);
    setVeedValidationState({ checking: false, result: null, error: null });
    const targetMod = selectedCourse?.modules?.find(m => m.id === modId);
    const nextOrder = (targetMod?.lessons?.length || 0) + 1;
    setLessonFormData({
      courseId: selectedCourse?.id || '',
      moduleId: modId,
      title: '',
      description: '',
      video_provider: 'veed',
      video_url: '',
      duration: '45 mins',
      order: nextOrder,
      is_free_preview: false,
      is_published: true
    });
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (les, modId) => {
    setEditingLesson(les);
    setVeedValidationState({ checking: false, result: null, error: null });
    setLessonFormData({
      courseId: selectedCourse?.id || '',
      moduleId: modId,
      title: les.title || '',
      description: les.description || '',
      video_provider: les.video_provider || 'veed',
      video_url: les.video_url || les.video_id || '',
      duration: les.duration || '45 mins',
      order: les.order || 1,
      is_free_preview: !!les.is_free_preview,
      is_published: les.is_published !== undefined ? !!les.is_published : true
    });
    setLessonModalOpen(true);
  };

  const handleValidateVeedSource = async (source) => {
    if (!source || !source.trim()) {
      setVeedValidationState({ checking: false, result: null, error: 'Please enter a VEED URL or Video ID first.' });
      return;
    }
    setVeedValidationState({ checking: true, result: null, error: null });
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/admin/veed/validate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ video_source: source.trim() })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVeedValidationState({ checking: false, result: data, error: null });
        if (data.embed_url) {
          setLessonFormData(prev => ({ ...prev, video_url: data.embed_url }));
        }
      } else {
        setVeedValidationState({ checking: false, result: null, error: data.error || 'Invalid VEED URL format' });
      }
    } catch (e) {
      setVeedValidationState({ checking: false, result: null, error: 'Network error validating VEED source' });
    }
  };

  const handleSaveLesson = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!lessonFormData.title.trim()) {
      setMutationMessage({ type: 'error', text: 'Lesson title is required.' });
      return;
    }
    if (!lessonFormData.moduleId) {
      setMutationMessage({ type: 'error', text: 'Please select a module for this lesson.' });
      return;
    }

    setLessonSubmitting(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };

      const payload = {
        title: lessonFormData.title.trim(),
        description: lessonFormData.description.trim(),
        video_provider: lessonFormData.video_provider,
        video_url: lessonFormData.video_url.trim(),
        duration: lessonFormData.duration.trim(),
        order: parseInt(lessonFormData.order) || 1,
        is_free_preview: lessonFormData.is_free_preview,
        is_published: lessonFormData.is_published,
        module_id: lessonFormData.moduleId
      };

      let res;
      if (editingLesson) {
        res = await fetch(`${BASE_URL}/api/admin/lessons/${editingLesson.id}/`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${BASE_URL}/api/admin/modules/${lessonFormData.moduleId}/lessons/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setLessonModalOpen(false);
        setEditingLesson(null);
        setMutationMessage({
          type: 'success',
          text: editingLesson
            ? `Lesson "${lessonFormData.title}" updated successfully!`
            : `Lesson "${lessonFormData.title}" created and persisted!`
        });
        loadCourseDetail(selectedCourse.id);
      } else {
        setMutationMessage({ type: 'error', text: data.error || 'Failed to save lesson.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while saving lesson.' });
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleToggleLessonPublish = async (lesson) => {
    try {
      const authToken = getAuthToken();
      const nextStatus = !lesson.is_published;
      const res = await fetch(`${BASE_URL}/api/admin/lessons/${lesson.id}/publish/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ is_published: nextStatus })
      });
      if (res.ok) {
        setMutationMessage({
          type: 'success',
          text: `Lesson "${lesson.title}" is now ${nextStatus ? 'Published & Live' : 'Unpublished (Draft)'}!`
        });
        loadCourseDetail(selectedCourse.id);
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to change lesson status.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error updating lesson status.' });
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/admin/lessons/${lessonToDelete.id}/`, {
        method: 'DELETE',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        setLessonDeleteModalOpen(false);
        setMutationMessage({ type: 'success', text: `Lesson "${lessonToDelete.title}" deleted.` });
        setLessonToDelete(null);
        loadCourseDetail(selectedCourse.id);
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to delete lesson.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error deleting lesson.' });
    }
  };

  const handleOpenPreview = (les) => {
    const embedUrl = les.video_url || (les.video_id ? `https://www.veed.io/embed/${les.video_id}?watermark=1&color=&sharing=1&title=1` : '');
    setPreviewVideoData({
      lesson_id: les.id,
      title: les.title,
      video_provider: les.video_provider || 'veed',
      video_id: les.video_id,
      embed_url: embedUrl,
      is_free_preview: les.is_free_preview,
      duration: les.duration,
      watermark: `SUPER ADMIN PREVIEW • LESSON: ${les.title.toUpperCase()}`
    });
    setPreviewModalOpen(true);
  };

  const handleAddAsset = async (lesId, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newAsset.title.trim() || !selectedCourse) return;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${BASE_URL}/api/admin/lessons/${lesId}/assets/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newAsset)
      });

      if (res.ok) {
        setNewAsset({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
        setActiveLessonId(null);
        setMutationMessage({ type: 'success', text: 'Media asset successfully attached to lesson!' });
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to attach asset.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Failed to attach asset.' });
    }
  };

  const isSelectedPublished = selectedCourse?.status === 'PUBLISHED';

  return (
    <div className="space-y-6 font-body-md">
      {/* Top Banner & Fast Creation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-gradient-to-r from-white via-stone-50/80 to-emerald-50/30 p-6 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-900 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 border border-emerald-700/30 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 flex items-center gap-2">
              Course &amp; Curriculum Builder
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              Design curricula, modules, video lectures, and attach DRM-ready masterclasses and CAD blueprints.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateCourse} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="New Course Title..."
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none w-56 shadow-2xs transition-all"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">₹</span>
            <input
              type="number"
              min="1"
              placeholder="Price"
              value={newCoursePrice}
              onChange={(e) => setNewCoursePrice(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl pl-6 pr-3 py-2.5 text-xs font-bold text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none w-24 shadow-2xs transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-98"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>{loading ? 'Creating...' : 'Create Course'}</span>
          </button>
        </form>
      </div>

      {mutationMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
          mutationMessage.type === 'success' 
            ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950' 
            : 'bg-rose-50/90 border border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-base ${mutationMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {mutationMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{mutationMessage.text}</span>
          </div>
          <button onClick={() => setMutationMessage(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course List Left */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3.5">
          <div className="flex justify-between items-center pb-1 border-b border-stone-100">
            <h2 className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-stone-400">library_books</span>
              All Courses ({courses.length})
            </h2>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-semibold">Active Database</span>
          </div>

          <div className="space-y-2.5">
            {courses.length === 0 ? (
              <div className="p-8 text-center bg-stone-50/70 rounded-xl border border-dashed border-stone-300 space-y-2">
                <span className="material-symbols-outlined text-3xl text-stone-400">post_add</span>
                <p className="text-xs font-semibold text-stone-700">No courses created yet.</p>
                <p className="text-[11px] text-stone-400">Type a course title above and click <b>Create Course</b>.</p>
              </div>
            ) : (
              courses.map(c => {
                const isPub = c.status === 'PUBLISHED';
                const isSelected = selectedCourse?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadCourseDetail(c.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/20 border-emerald-600 shadow-sm ring-2 ring-emerald-600/15'
                        : 'bg-white hover:bg-stone-50 border-stone-200/80 hover:border-stone-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-14 h-9.5 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-stone-200 shadow-2xs">
                        <img
                          src={resolveCoverUrl(c.thumbnail) || '/course_thumb_landscape.jpg'}
                          alt=""
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-xs leading-snug text-stone-900 truncate block">{c.title}</span>
                          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-2 py-0.5 rounded-md flex-shrink-0 shadow-2xs">
                            ₹{c.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase border flex items-center gap-1.5 ${
                          isPub
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                            : c.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-900 border-amber-200/90'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                          {isPub ? 'Active' : `Inactive (${c.status})`}
                        </span>
                        <span className="text-stone-500 font-medium flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px] text-stone-400">layers</span>
                          {c.modulesCount || 0} Modules
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(c);
                        }}
                        disabled={statusUpdating}
                        title={isPub ? 'Click to Deactivate Course' : 'Click to Activate & Publish Course'}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isPub
                            ? 'bg-white hover:bg-amber-50/80 text-amber-800 border-amber-300 hover:border-amber-400 shadow-2xs'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        }`}
                      >
                        {isPub ? 'Deactivate' : 'Publish'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Course Structure Right */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
              {/* Course Header with Status & Activation Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-stone-200/80 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 truncate">{selectedCourse.title}</h2>
                    <button
                      onClick={() => handleOpenEditModal(selectedCourse)}
                      className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer flex-shrink-0"
                      title="Edit Course Title & Price"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>

                  {/* Clean Non-wrapping URL and Price Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/80 border border-stone-200 text-stone-700 text-xs font-mono">
                      <span className="material-symbols-outlined text-xs text-stone-400">link</span>
                      <span className="text-emerald-800 font-semibold truncate max-w-xs">/{selectedCourse.slug}</span>
                    </span>

                    <button
                      onClick={() => handleOpenEditModal(selectedCourse)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/90 transition-all cursor-pointer shadow-2xs group"
                      title="Click to edit course price"
                    >
                      <span className="material-symbols-outlined text-xs text-emerald-600">payments</span>
                      <span>₹{selectedCourse.price}</span>
                      <span className="material-symbols-outlined text-[13px] text-emerald-400 group-hover:text-emerald-700 transition-colors">edit</span>
                    </button>
                  </div>
                </div>

                {/* Status & Deactivate/Activate Actions Group */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {/* Edit Pricing & Title Button */}
                  <button
                    onClick={() => handleOpenEditModal(selectedCourse)}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 hover:text-emerald-900 border border-stone-200/90 hover:border-emerald-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Edit course price and title"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-700">currency_rupee</span>
                    <span>Edit Price</span>
                  </button>

                  {/* Status Dropdown */}
                  <div className="h-9 flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 shadow-2xs">
                    <span className="text-[11px] font-semibold text-stone-500">Status:</span>
                    <select
                      value={selectedCourse.status}
                      disabled={statusUpdating}
                      onChange={(e) => handleUpdateCourseStatus(selectedCourse.id, e.target.value)}
                      className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                    >
                      <option value="PUBLISHED">PUBLISHED (Active &amp; Live)</option>
                      <option value="DRAFT">DRAFT (Deactivated)</option>
                      <option value="ARCHIVED">ARCHIVED (Deactivated)</option>
                    </select>
                  </div>

                  {/* 1-Click Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(selectedCourse)}
                    disabled={statusUpdating}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      isSelectedPublished
                        ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-300/90'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-800 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelectedPublished ? 'pause_circle' : 'rocket_launch'}
                    </span>
                    <span>
                      {statusUpdating
                        ? 'Updating...'
                        : isSelectedPublished
                        ? 'Deactivate Course'
                        : 'Activate & Publish Course'}
                    </span>
                  </button>

                  {/* Delete Course Button */}
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 border border-stone-200/90 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Delete Course"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Deactivated Warning Alert Banner */}
              {!isSelectedPublished && (
                <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
                  <span className="material-symbols-outlined text-amber-700 text-lg flex-shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="flex-1 space-y-1">
                    <strong className="font-bold block">Course is currently Deactivated ({selectedCourse.status})</strong>
                    <p className="text-amber-800">
                      This course is hidden from the public website, enrollment checkout, and prospective students. Click <b>"Activate &amp; Publish Course"</b> above to make it live.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdateCourseStatus(selectedCourse.id, 'PUBLISHED')}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex-shrink-0"
                  >
                    Make Live Now
                  </button>
                </div>
              )}

              {/* Course Cover Photo Section */}
              <div className="bg-gradient-to-br from-stone-50/80 via-white to-emerald-50/20 rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shadow-2xs flex-shrink-0">
                      <span className="material-symbols-outlined text-lg">image</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-2">
                        <span>Course Cover Photo</span>
                        {selectedCourse.thumbnail && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                            Custom Cover Active
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Showcased across public catalog cards, student learning portal, and checkout
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="file"
                      ref={coverFileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleCoverFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={coverUpdating}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>{coverUpdating ? 'Uploading...' : 'Upload Image'}</span>
                    </button>

                    {selectedCourse.thumbnail && (
                      <button
                        type="button"
                        onClick={handleRemoveCoverPhoto}
                        disabled={coverUpdating}
                        className="px-3 py-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200/90 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                        title="Remove cover photo and reset to default"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* 16:9 Cover Thumbnail Preview Card */}
                  <div className="md:col-span-4 relative aspect-video rounded-xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-sm group">
                    <img
                      src={resolveCoverUrl(selectedCourse.thumbnail) || '/course_thumb_landscape.jpg'}
                      alt={selectedCourse.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 text-[10px] text-white/95 font-mono font-medium bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      16:9 Banner
                    </span>
                    {coverUpdating && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                        Updating...
                      </div>
                    )}
                  </div>

                  {/* URL Input & Quick Preset Options */}
                  <div className="md:col-span-8 space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Image URL / Web Link:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... or /course_thumb_custom.jpg"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          className="flex-1 bg-white border border-stone-200/90 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCoverUrl}
                          disabled={coverUpdating || !coverUrlInput.trim() || coverUrlInput.trim() === selectedCourse.thumbnail}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                        >
                          Save URL
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        Quick Preset Covers:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COVERS.map((preset, pIdx) => {
                          const isActive = selectedCourse.thumbnail === preset.url;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleApplyPresetCover(preset.url)}
                              disabled={coverUpdating}
                              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                isActive
                                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm font-bold'
                                  : 'bg-white hover:bg-emerald-50/70 hover:border-emerald-300 text-stone-700 hover:text-emerald-950 border-stone-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-600'}`} />
                              <span>{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Module Form */}
              <form onSubmit={handleAddModule} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Module Title (e.g. Module 1: Spatial Topography & Grading)..."
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="flex-1 bg-white border border-stone-200/90 rounded-xl px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none shadow-2xs"
                />
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-98"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Module</span>
                </button>
              </form>

              {/* Modules & Lessons Tree */}
              <div className="space-y-4">
                {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                  selectedCourse.modules.map(mod => (
                    <div key={mod.id} className="bg-stone-50 rounded-xl p-5 border border-stone-200/80 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-stone-900">{mod.title}</span>
                        <button
                          onClick={() => handleOpenAddLesson(mod.id)}
                          className="text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          <span>+ Add Lesson</span>
                        </button>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-3 pl-4 border-l-2 border-emerald-600/40">
                        {mod.lessons && mod.lessons.map(les => (
                          <div key={les.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3 hover:border-stone-300 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-mono text-[10px] flex items-center justify-center flex-shrink-0 font-bold">
                                  {les.order}
                                </span>
                                <span className="font-bold text-xs text-stone-900 truncate">{les.title}</span>
                                {les.duration && (
                                  <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                    {les.duration}
                                  </span>
                                )}
                              </div>

                              {/* Status Badges & Controls */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Free Preview Badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  les.is_free_preview
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-stone-50 text-stone-500 border-stone-200'
                                }`}>
                                  {les.is_free_preview ? 'Free Preview' : 'Paid Only'}
                                </span>

                                {/* Published Status Pill & 1-Click Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLessonPublish(les)}
                                  title={les.is_published ? "Click to unpublish lesson" : "Click to publish lesson"}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all ${
                                    les.is_published
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${les.is_published ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                                  <span>{les.is_published ? 'Live' : 'Draft'}</span>
                                </button>

                                {/* Preview Video Button */}
                                {(les.video_id || les.video_url) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(les)}
                                    className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                    title="Preview VEED Video Player"
                                  >
                                    <span className="material-symbols-outlined text-sm">play_circle</span>
                                    <span>Preview</span>
                                  </button>
                                )}

                                {/* Edit Lesson Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLesson(les, mod.id)}
                                  className="text-[11px] font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                  title="Edit Lesson Details & Video"
                                >
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                  <span>Edit</span>
                                </button>

                                {/* Delete Lesson Button */}
                                <button
                                  type="button"
                                  onClick={() => { setLessonToDelete(les); setLessonDeleteModalOpen(true); }}
                                  className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Lesson"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>

                                {/* Legacy Attach PDF/File */}
                                <button
                                  type="button"
                                  onClick={() => setActiveLessonId(activeLessonId === les.id ? null : les.id)}
                                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                                  title="Attach File or Local Asset"
                                >
                                  <span className="material-symbols-outlined text-sm">attach_file</span>
                                </button>
                              </div>
                            </div>

                            {/* Lesson VEED Reference Summary Info */}
                            {(les.video_id || les.video_url) && (
                              <div className="flex items-center gap-2 text-[11px] bg-stone-50/80 px-2.5 py-1.5 rounded-lg border border-stone-200/60 font-mono text-stone-600">
                                <span className="material-symbols-outlined text-sm text-emerald-700 flex-shrink-0">videocam</span>
                                <span className="text-emerald-800 font-bold uppercase text-[9px] bg-emerald-100 px-1 rounded">VEED</span>
                                <span className="truncate flex-1">
                                  {les.video_id ? `ID: ${les.video_id}` : les.video_url}
                                </span>
                              </div>
                            )}

                            {les.description && (
                              <p className="text-[11px] text-stone-500 line-clamp-2 italic">{les.description}</p>
                            )}

                            {/* Add Media Asset Form */}
                            {activeLessonId === les.id && (
                              <form onSubmit={(e) => handleAddAsset(les.id, e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
                                <input
                                  type="text"
                                  placeholder="Asset Title..."
                                  value={newAsset.title}
                                  onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <select
                                  value={newAsset.asset_type}
                                  onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                >
                                  <option value="long_video">Long Masterclass Video (2+ hrs)</option>
                                  <option value="short_video">Short Video (1-10 mins)</option>
                                  <option value="pdf">PDF Blueprint / Document</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Duration (e.g. 2h 30m)..."
                                  value={newAsset.duration}
                                  onChange={(e) => setNewAsset({ ...newAsset, duration: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <input
                                  type="text"
                                  placeholder="Video URL or Cloud Link..."
                                  value={newAsset.url}
                                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <button type="submit" className="sm:col-span-2 bg-emerald-800 text-white text-xs font-semibold p-2 rounded-lg shadow-sm cursor-pointer">
                                  Save &amp; Persist Asset
                                </button>
                              </form>
                            )}

                            {/* Attached Media Assets */}
                            <div className="space-y-1.5">
                              {les.assets && les.assets.map(asset => (
                                <div key={asset.id} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg text-xs border border-stone-200/60">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-emerald-700">
                                      {asset.asset_type === 'pdf' ? 'picture_as_pdf' : 'play_circle'}
                                    </span>
                                    <span className="font-medium text-stone-800">{asset.title}</span>
                                  </div>
                                  <span className="text-[10px] font-bold bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600">
                                    {asset.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-200">
                    No modules added to this course yet. Use the input above to add your first module.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200 shadow-sm">
              {loading ? 'Loading course details...' : 'Select a course on the left to edit modules and lessons, or create a new course above.'}
            </div>
          )}
        </div>
      </div>

      {/* Delete Course Confirmation Modal */}
      {deleteModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="font-bold text-base text-stone-900">Delete Course</h3>
            </div>
            <p className="text-xs text-stone-600">
              Are you sure you want to permanently delete <b>"{selectedCourse.title}"</b>? This will remove all associated modules, lessons, and assets.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LESSON CREATE / EDIT MODAL */}
      {lessonModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">
                  {editingLesson ? 'edit_document' : 'add_circle'}
                </span>
                <h3 className="font-bold text-base text-stone-900">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
              </div>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              {/* Course & Module Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target Course:</label>
                  <select
                    value={lessonFormData.courseId}
                    onChange={(e) => {
                      const cId = parseInt(e.target.value);
                      setLessonFormData(prev => ({
                        ...prev,
                        courseId: cId,
                        moduleId: courses.find(c => c.id === cId)?.modules?.[0]?.id || prev.moduleId
                      }));
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-semibold"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target Module:</label>
                  <select
                    value={lessonFormData.moduleId}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, moduleId: parseInt(e.target.value) }))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-semibold"
                  >
                    {(selectedCourse?.modules || []).map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lesson Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Lesson Title: *</label>
                <input
                  type="text"
                  placeholder="e.g. Masterclass 1: Spatial Topography & Grading Framework"
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:border-emerald-700 focus:outline-none"
                  required
                />
              </div>

              {/* Lesson Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Lesson Description:</label>
                <textarea
                  rows={2}
                  placeholder="Outline key learning outcomes, architectural takeaways, or resources discussed in this lesson..."
                  value={lessonFormData.description}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              {/* Video Provider & VEED Embed URL / Video ID */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-emerald-800">video_library</span>
                    <span className="text-xs font-bold text-stone-900">VEED Video Hosting Reference</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Provider: VEED.IO
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    VEED Embed URL, Iframe Code, or Video ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://www.veed.io/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a or Video UUID"
                      value={lessonFormData.video_url}
                      onChange={(e) => {
                        setLessonFormData({ ...lessonFormData, video_url: e.target.value });
                        setVeedValidationState({ checking: false, result: null, error: null });
                      }}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:border-emerald-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleValidateVeedSource(lessonFormData.video_url)}
                      disabled={veedValidationState.checking || !lessonFormData.video_url.trim()}
                      className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    >
                      {veedValidationState.checking ? 'Checking...' : 'Validate'}
                    </button>
                  </div>
                </div>

                {/* Quick Helper Button for Test Video */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <span className="text-stone-500">Supports embed URLs, iframe snippets, or raw video UUIDs</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonFormData(prev => ({ ...prev, video_url: VEED_TEST_FIXTURE_URL }));
                      handleValidateVeedSource(VEED_TEST_FIXTURE_URL);
                    }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                  >
                    Use VEED Test Fixture
                  </button>
                </div>

                {/* Validation Feedback Box */}
                {veedValidationState.result && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Format Verified: VEED ID {veedValidationState.result.video_id}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      {veedValidationState.result.notice}
                    </p>
                  </div>
                )}
                {veedValidationState.error && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-rose-600 flex-shrink-0">error</span>
                    <span>{veedValidationState.error}</span>
                  </div>
                )}
              </div>

              {/* Duration & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Duration (Display):</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins or 2h 15m"
                    value={lessonFormData.duration}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, duration: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Display Order #:</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonFormData.order}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Toggles: Free Preview & Published */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={lessonFormData.is_free_preview}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, is_free_preview: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Free Preview Lesson</span>
                    <span className="text-[10px] text-stone-500 block">Watchable without purchasing</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={lessonFormData.is_published}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, is_published: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Published Status</span>
                    <span className="text-[10px] text-stone-500 block">Visible to eligible students</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lessonSubmitting}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>{lessonSubmitting ? 'Saving Lesson...' : editingLesson ? 'Update Lesson' : 'Save Lesson'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN VIDEO PREVIEW MODAL */}
      {previewModalOpen && previewVideoData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">smart_display</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">{previewVideoData.title}</h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Provider: VEED.IO • ID: {previewVideoData.video_id || 'Embedded'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Explanation Alert Banner */}
            <div className="p-3 bg-stone-800/80 border border-stone-700 rounded-xl text-xs text-stone-300 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-400 text-base mt-0.5 flex-shrink-0">info</span>
              <div>
                <strong className="text-white block">Super Admin Playback Test Console</strong>
                <span>
                  This player renders the approved VEED embed iframe responsively. Notice: If VEED displays an error inside the frame, ensure that the video's sharing privacy in your VEED workspace is configured to allow public or embed access.
                </span>
              </div>
            </div>

            {/* Live Video Player Component */}
            <CourseVideoPlayer playbackData={previewVideoData} />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-stone-400 font-mono">
                Duration: {previewVideoData.duration || 'N/A'} • Preview: {previewVideoData.is_free_preview ? 'Yes' : 'No'}
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE LESSON CONFIRMATION MODAL */}
      {lessonDeleteModalOpen && lessonToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="font-bold text-base text-stone-900">Delete Lesson</h3>
            </div>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete lesson <b>"{lessonToDelete.title}"</b>? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLessonDeleteModalOpen(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLesson}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COURSE PRICE & TITLE MODAL */}
      {editCourseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">currency_rupee</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Edit Course Pricing &amp; Details</h3>
                  <p className="text-[11px] text-stone-500">Update course selling price and title</p>
                </div>
              </div>
              <button
                onClick={() => setEditCourseModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCoursePrice} className="space-y-4">
              {/* Course Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={editCourseTitle}
                  onChange={(e) => setEditCourseTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              {/* Course Price */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Selling Price (INR ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editCoursePrice}
                    onChange={(e) => {
                      setEditCoursePrice(e.target.value);
                      setEditCourseDiscountPrice(e.target.value);
                    }}
                    placeholder="499"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  This amount will be charged at Razorpay checkout and shown on public course cards.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Quick Price Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[299, 499, 799, 999, 1499, 1999, 2499, 4999].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditCoursePrice(String(preset));
                        setEditCourseDiscountPrice(String(preset));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        String(editCoursePrice) === String(preset)
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editCourseSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editCourseSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Update Price</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
