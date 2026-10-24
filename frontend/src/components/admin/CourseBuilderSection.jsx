import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BASE_URL } from '../../lib/api.js';
import CourseVideoPlayer from '../CourseVideoPlayer.jsx';

const VEED_TEST_FIXTURE_URL = 'https://www.veed.io/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a?watermark=1&color=&sharing=1&title=1';
const VEED_TEST_VIDEO_ID = '8317ab9c-7a4f-4088-bdcb-06cc3b04399a';

const PRESET_COVERS = [
  { label: 'Landscape Masterclass', url: '/course_thumb_landscape.jpg' },
  { label: 'Botanical Scenography', url: '/course_thumb_botanical.jpg' },
  { label: 'Hardscape Engineering', url: '/course_thumb_hardscape.jpg' },
  { label: 'Blueprint & Studio', url: '/landscape_blueprint_studio.jpg' },
  { label: 'Showcase Architecture', url: '/landscape_hero_showcase.jpg' },
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
  const [newCourseHasStrikePrice, setNewCourseHasStrikePrice] = useState(false);
  const [newCourseOriginalPrice, setNewCourseOriginalPrice] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // Course Edit Modal (Pricing & Title)
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCoursePrice, setEditCoursePrice] = useState('499.00');
  const [editCourseHasStrikePrice, setEditCourseHasStrikePrice] = useState(false);
  const [editCourseOriginalPrice, setEditCourseOriginalPrice] = useState('');
  const [editCourseIsLocked, setEditCourseIsLocked] = useState(false);
  const [editCourseLockReason, setEditCourseLockReason] = useState('Course video is currently under editing. The final video will be unlocked soon.');
  const [editCourseSubmitting, setEditCourseSubmitting] = useState(false);

  // Promotional & Social Launch Suite Modal
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteTab, setPromoteTab] = useState('overview'); // 'overview' | 'whatsapp' | 'instagram' | 'twitter'
  const [copiedPromoLink, setCopiedPromoLink] = useState(false);
  const [copiedWhatsappText, setCopiedWhatsappText] = useState(false);
  const [copiedInstaCaption, setCopiedInstaCaption] = useState(false);
  const [copiedQrHtml, setCopiedQrHtml] = useState(false);
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
    const sellingPrice = course.price != null ? String(course.price) : '299.00';
    setEditCoursePrice(sellingPrice);
    
    // Toggle state: true if is_strike_off_enabled is active
    const isEnabled = course.is_strike_off_enabled !== false;
    setEditCourseHasStrikePrice(Boolean(isEnabled));

    // Stored original price (raw_original_price or original_price)
    const storedOrig = course.raw_original_price || course.original_price || course.strike_price || null;
    if (storedOrig) {
      setEditCourseOriginalPrice(String(storedOrig));
    } else {
      const curr = parseFloat(sellingPrice) || 299;
      setEditCourseOriginalPrice(curr <= 299 ? '499' : curr <= 499 ? '999' : String(Math.round(curr * 1.5)));
    }
    setEditCourseIsLocked(Boolean(course.is_locked));
    setEditCourseLockReason(course.lock_reason || 'Course video is currently under editing. The final video will be unlocked soon.');
    setEditCourseModalOpen(true);
  };

  const handleSaveCoursePrice = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCourse) return;

    const parsedPrice = parseFloat(editCoursePrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setMutationMessage({ type: 'error', text: 'Please enter a valid positive selling price (e.g. 299).' });
      return;
    }

    let parsedOriginalPrice = null;
    if (editCourseHasStrikePrice) {
      const orig = parseFloat(editCourseOriginalPrice);
      if (isNaN(orig) || orig <= 0) {
        setMutationMessage({ type: 'error', text: 'Please enter a valid strike-off price (e.g. 999) or turn the toggle OFF.' });
        return;
      }
      if (orig <= parsedPrice) {
        setMutationMessage({ type: 'error', text: `Strike-off price (₹${orig}) must be higher than selling price (₹${parsedPrice}) to display discount.` });
        return;
      }
      parsedOriginalPrice = orig;
    } else {
      // If toggled OFF, preserve the typed number in original_price so it isn't lost when toggled back ON
      const orig = parseFloat(editCourseOriginalPrice);
      parsedOriginalPrice = !isNaN(orig) && orig > 0 ? orig : null;
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
        is_strike_off_enabled: editCourseHasStrikePrice,
        original_price: parsedOriginalPrice,
        discount_price: parsedPrice,
        is_locked: editCourseIsLocked,
        lock_reason: editCourseLockReason.trim() || 'Course video is currently under editing. The final video will be unlocked soon.'
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
          text: `Course settings for "${data.course?.title || selectedCourse.title}" updated (Price: ₹${parsedPrice}, Lock: ${editCourseIsLocked ? 'LOCKED for Editing' : 'UNLOCKED'}) successfully!`
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

  const handleToggleCourseLock = async (course) => {
    if (!course) return;
    setStatusUpdating(true);
    setMutationMessage(null);
    const nextLocked = !course.is_locked;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };

      const res = await fetch(`${BASE_URL}/api/admin/courses/${course.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_locked: nextLocked })
      });

      if (res.ok) {
        const msg = nextLocked
          ? `🔒 Course "${course.title}" is now LOCKED for video editing. Enrolled students are blocked from opening or streaming until unlocked.`
          : `🔓 Course "${course.title}" is now UNLOCKED! Enrolled students can now access and watch all video lessons.`;
        setMutationMessage({ type: 'success', text: msg });
        await fetchCourses();
        if (selectedCourse?.id === course.id) {
          setSelectedCourse(prev => prev ? { ...prev, is_locked: nextLocked } : null);
        }
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to update course lock status.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while updating course lock.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleStrikeOff = async (course) => {
    if (!course) return;
    setStatusUpdating(true);
    setMutationMessage(null);
    const newToggleState = !course.is_strike_off_enabled;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };

      const payload = {
        is_strike_off_enabled: newToggleState
      };
      if (newToggleState && !course.original_price && !course.raw_original_price) {
        const p = parseFloat(course.price) || 299;
        payload.original_price = p <= 299 ? 499 : p <= 499 ? 999 : Math.round(p * 1.5);
      }

      const res = await fetch(`${BASE_URL}/api/admin/courses/${course.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMutationMessage({
          type: 'success',
          text: `Discount strike-off for "${course.title}" turned ${newToggleState ? 'ON' : 'OFF'}!`
        });
        await fetchCourses();
        loadCourseDetail(course.id);
      } else {
        const err = await res.json();
        setMutationMessage({ type: 'error', text: err.error || 'Failed to toggle discount strike-off.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while toggling discount strike-off.' });
    } finally {
      setStatusUpdating(false);
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
      let parsedOriginalPrice = null;
      if (newCourseHasStrikePrice) {
        const orig = parseFloat(newCourseOriginalPrice);
        if (!isNaN(orig) && orig > (parseFloat(newCoursePrice) || 299)) {
          parsedOriginalPrice = orig;
        }
      }

      const res = await fetch(`${BASE_URL}/api/admin/courses/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newCourseTitle.trim(),
          price: parseFloat(newCoursePrice) || 299.00,
          original_price: parsedOriginalPrice
        })
      });

      const data = await res.json();

      if (res.ok && data.id) {
        const createdTitle = newCourseTitle.trim();
        const promoSlug = data.slug || 'course';
        setNewCourseTitle('');
        setMutationMessage({
          type: 'success',
          text: `Course "${createdTitle}" created successfully! Auto-generated promotional link: /landscapemastery/promo/${promoSlug}`
        });
        await fetchCourses();
        await loadCourseDetail(data.id);
        setPromoteModalOpen(true);
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
            className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none w-48 sm:w-56 shadow-2xs transition-all"
          />
          <div className="relative" title="Selling Price (charged at checkout)">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700 text-xs font-bold">₹</span>
            <input
              type="number"
              min="1"
              placeholder="Selling"
              value={newCoursePrice}
              onChange={(e) => setNewCoursePrice(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl pl-5 pr-2 py-2.5 text-xs font-bold text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none w-20 shadow-2xs transition-all"
            />
          </div>
          <div className="relative" title="Optional Strike-off MRP (e.g. ₹499)">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-normal line-through">₹</span>
            <input
              type="number"
              min="1"
              placeholder="MRP Strike-off"
              value={newCourseOriginalPrice}
              onChange={(e) => {
                setNewCourseOriginalPrice(e.target.value);
                setNewCourseHasStrikePrice(Boolean(e.target.value));
              }}
              className="bg-white border border-stone-300 rounded-xl pl-5 pr-2 py-2.5 text-xs text-stone-600 placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none w-28 shadow-2xs transition-all"
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
                              ₹{c.price}
                            </span>
                            {c.original_price && Number(c.original_price) > Number(c.price) && (
                              <span className="text-[10px] font-mono text-stone-400 line-through">
                                ₹{c.original_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                        {c.is_locked && (
                          <span className="px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-0.5" title="Course video is under editing. Locked from students.">
                            <span className="material-symbols-outlined text-[10px] text-amber-700">lock</span>
                            <span>Editing</span>
                          </span>
                        )}
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
              <div className="pb-5 border-b border-stone-200/80 space-y-3.5">
                {/* Row 1: Course Title & Action Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <h2
                      className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 truncate"
                      title={selectedCourse.title}
                    >
                      {selectedCourse.title}
                    </h2>
                    <button
                      onClick={() => handleOpenEditModal(selectedCourse)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/80 transition-all cursor-pointer flex-shrink-0"
                      title="Edit Course Title & Price"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    {/* Course Lock / Video Editing Toggle Button */}
                    <button
                      onClick={() => handleToggleCourseLock(selectedCourse)}
                      disabled={statusUpdating}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        selectedCourse.is_locked
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400/80 shadow-xs'
                          : 'bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200/90'
                      }`}
                      title={
                        selectedCourse.is_locked
                          ? 'Course is locked for video editing. Click to unlock for students.'
                          : 'Lock course from students while video is undergoing editing.'
                      }
                    >
                      <span className={`material-symbols-outlined text-base ${selectedCourse.is_locked ? 'text-amber-700' : 'text-stone-500'}`}>
                        {selectedCourse.is_locked ? 'lock' : 'lock_open'}
                      </span>
                      <span>
                        {statusUpdating
                          ? 'Updating...'
                          : selectedCourse.is_locked
                          ? 'Locked (In Editing)'
                          : 'Unlocked'}
                      </span>
                    </button>

                    {/* Launch & Promote Button */}
                    <button
                      onClick={() => setPromoteModalOpen(true)}
                      className="h-9 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
                      title="Promote course via WhatsApp, Instagram, Twitter with QR Pass"
                    >
                      <span className="material-symbols-outlined text-base text-amber-300">rocket_launch</span>
                      <span>Launch &amp; Promote</span>
                    </button>

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
                    <div className="relative">
                      <select
                        value={selectedCourse.status}
                        disabled={statusUpdating}
                        onChange={(e) => handleUpdateCourseStatus(selectedCourse.id, e.target.value)}
                        className={`h-9 pl-3 pr-7 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none shadow-2xs appearance-none ${
                          isSelectedPublished
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80'
                            : selectedCourse.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80'
                            : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        <option value="PUBLISHED">● Published</option>
                        <option value="DRAFT">○ Draft</option>
                        <option value="ARCHIVED">⊘ Archived</option>
                      </select>
                      <span className="material-symbols-outlined text-xs absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                        expand_more
                      </span>
                    </div>

                    {/* 1-Click Toggle Active Button */}
                    <button
                      onClick={() => handleToggleActive(selectedCourse)}
                      disabled={statusUpdating}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isSelectedPublished
                          ? 'bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200/90 hover:border-amber-300'
                          : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-800 shadow-sm'
                      }`}
                      title={isSelectedPublished ? 'Deactivate course from public view' : 'Publish and activate course'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isSelectedPublished ? 'pause_circle' : 'rocket_launch'}
                      </span>
                      <span>
                        {statusUpdating
                          ? 'Updating...'
                          : isSelectedPublished
                          ? 'Deactivate Course'
                          : 'Activate & Publish'}
                      </span>
                    </button>

                    {/* Delete Course Button */}
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="h-9 w-9 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200/90 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Delete Course"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Course Locked Alert Notice Banner */}
                {selectedCourse.is_locked && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-xl">lock</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                          <span>Course Video Under Editing</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200/90 text-amber-900 uppercase border border-amber-300/80">LOCKED FOR STUDENTS</span>
                        </div>
                        <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                          Enrolled students cannot open or stream this course. As an instructor/admin, you can test and preview lessons below. When final video editing is done, click <strong>Unlock Course</strong> to release it to students.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCourseLock(selectedCourse)}
                      disabled={statusUpdating}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">lock_open</span>
                      <span>Unlock Course</span>
                    </button>
                  </div>
                )}

                {/* Row 2: Metadata Badges (Slug, Promo Link, Price, Status, Modules) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Public Slug with Copy Link Button */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 border border-stone-200 text-stone-700 text-xs font-mono whitespace-nowrap shadow-2xs">
                    <span className="material-symbols-outlined text-xs text-stone-400">link</span>
                    <span className="text-emerald-800 font-semibold font-mono">/{selectedCourse.slug}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/courses/${selectedCourse.slug}`);
                        setMutationMessage({ type: 'success', text: 'Course public link copied to clipboard!' });
                      }}
                      className="ml-1 text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer"
                      title="Copy public course link"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/courses/${selectedCourse.slug}`, '_blank')}
                      className="text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer"
                      title="Open course checkout in new tab"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </button>
                  </div>

                  {/* Auto-Generated Promotional Link Pill */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300/90 text-emerald-950 text-xs font-mono whitespace-nowrap shadow-2xs">
                    <span className="material-symbols-outlined text-xs text-amber-600">qr_code_2</span>
                    <span className="text-emerald-900 font-bold font-mono">/landscapemastery/promo/{selectedCourse.slug}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`);
                        setMutationMessage({ type: 'success', text: 'Promotional link copied to clipboard!' });
                      }}
                      className="ml-1 text-emerald-700 hover:text-emerald-950 transition-colors cursor-pointer"
                      title="Copy promotional link"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/landscapemastery/promo/${selectedCourse.slug}`, '_blank')}
                      className="text-emerald-700 hover:text-emerald-950 transition-colors cursor-pointer"
                      title="Open promotional page in new tab"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </button>
                  </div>

                  {/* Price Badge */}
                  <button
                    onClick={() => handleOpenEditModal(selectedCourse)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/90 transition-all cursor-pointer shadow-2xs whitespace-nowrap group"
                    title="Click to edit course price & strike-off"
                  >
                    <span className="material-symbols-outlined text-xs text-emerald-600">payments</span>
                    <span>₹{selectedCourse.price}</span>
                    {selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) && (
                      <span className="text-[11px] text-stone-400 line-through font-normal">₹{selectedCourse.original_price}</span>
                    )}
                    {selectedCourse.discount_pct > 0 && (
                      <span className="text-[9.5px] font-sans font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                        {selectedCourse.discount_pct}% OFF
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[13px] text-emerald-400 group-hover:text-emerald-700 transition-colors">edit</span>
                  </button>

                  {/* Quick 1-Click Strike-off Toggle Button */}
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleToggleStrikeOff(selectedCourse)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                      selectedCourse.is_strike_off_enabled !== false
                        ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-300'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-300'
                    }`}
                    title={selectedCourse.is_strike_off_enabled !== false ? 'Click to turn strike-off discount OFF' : 'Click to turn strike-off discount ON'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {selectedCourse.is_strike_off_enabled !== false ? 'toggle_on' : 'toggle_off'}
                    </span>
                    <span>Strike-Off:</span>
                    <span className={`font-bold text-[10px] px-1.5 py-0.2 rounded ${
                      selectedCourse.is_strike_off_enabled !== false
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {selectedCourse.is_strike_off_enabled !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Live Status indicator pill */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap shadow-2xs ${
                    isSelectedPublished
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelectedPublished ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{isSelectedPublished ? 'Active & Live' : `Deactivated (${selectedCourse.status})`}</span>
                  </span>

                  {/* Modules count pill */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 text-xs whitespace-nowrap shadow-2xs">
                    <span className="material-symbols-outlined text-xs text-stone-400">layers</span>
                    <span>{selectedCourse.modules?.length || 0} Modules</span>
                  </span>
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
                        {selectedCourse.thumbnail ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                            Custom Cover Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                            Default Cover
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
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className="md:col-span-4 relative aspect-video rounded-xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-sm group cursor-pointer"
                    title="Click to replace cover photo"
                  >
                    <img
                      src={resolveCoverUrl(selectedCourse.thumbnail) || '/course_thumb_landscape.jpg'}
                      alt={selectedCourse.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    <span className="absolute bottom-2 left-2 text-[10px] text-white/95 font-mono font-medium bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      16:9 Banner
                    </span>

                    {/* Hover Prompt */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                      <span className="px-3 py-1.5 bg-white/95 text-stone-900 text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        Change Photo
                      </span>
                    </div>

                    {coverUpdating && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </div>
                    )}
                  </div>

                  {/* URL Input & Quick Preset Options */}
                  <div className="md:col-span-8 space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                        Image URL / Web Link:
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined text-stone-400 text-sm absolute left-3 top-1/2 -translate-y-1/2">
                            link
                          </span>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/... or /course_thumb_custom.jpg"
                            value={coverUrlInput}
                            onChange={(e) => setCoverUrlInput(e.target.value)}
                            className="w-full bg-white border border-stone-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-none shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveCoverUrl}
                          disabled={coverUpdating || !coverUrlInput.trim() || coverUrlInput.trim() === selectedCourse.thumbnail}
                          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1.5 flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          <span>Save URL</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">Customize Course Pricing</h3>
                  <p className="text-xs text-stone-500">Configure dynamic selling price and strike-off (MRP)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditCourseModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
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

              {/* Course Selling Price */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                    Selling Price (INR ₹) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">Amount charged at Razorpay checkout</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editCoursePrice}
                    onChange={(e) => setEditCoursePrice(e.target.value)}
                    placeholder="299"
                    className="w-full bg-white border border-emerald-200/90 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Quick Selling Price Presets */}
                <div className="space-y-1 pt-0.5">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Popular Selling Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[199, 299, 499, 799, 999, 1499, 1999].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditCoursePrice(String(preset))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          String(editCoursePrice) === String(preset)
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-white hover:bg-emerald-100/70 border border-stone-200/80 text-stone-700'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Price Strike-Off Toggle (MRP / Compare-at Price) */}
              <div className="p-4 bg-gradient-to-br from-stone-50 to-stone-100/70 border border-stone-200/90 rounded-2xl space-y-3.5 shadow-2xs">
                {/* Switch Header with Toggle Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">Discount Strike-Off Toggle</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                        editCourseHasStrikePrice
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-stone-200 text-stone-600 border border-stone-300'
                      }`}>
                        {editCourseHasStrikePrice ? '● ON (Discount Active)' : '○ OFF (Flat Price)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {editCourseHasStrikePrice
                        ? 'Students will see original MRP crossed out with % OFF badge.'
                        : 'Strike-off is turned OFF. Students see only the flat selling price without crossed-out figures.'}
                    </p>
                  </div>

                  {/* Accessible iOS-Style Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editCourseHasStrikePrice}
                    onClick={() => {
                      const next = !editCourseHasStrikePrice;
                      setEditCourseHasStrikePrice(next);
                      if (next && !editCourseOriginalPrice) {
                        const curr = parseFloat(editCoursePrice) || 299;
                        setEditCourseOriginalPrice(curr <= 299 ? '499' : curr <= 499 ? '999' : String(Math.round(curr * 1.5)));
                      }
                    }}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                      editCourseHasStrikePrice ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                    title={editCourseHasStrikePrice ? 'Turn Strike-Off OFF' : 'Turn Strike-Off ON'}
                  >
                    <span className="sr-only">Toggle Strike-Off Discount</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        editCourseHasStrikePrice ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sub-Card When Toggle is ON */}
                {editCourseHasStrikePrice ? (
                  <div className="space-y-3 pt-3 border-t border-stone-200/80 animate-in fade-in-50 duration-150">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        Original Price / Strike-Off MRP (INR ₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          required={editCourseHasStrikePrice}
                          value={editCourseOriginalPrice}
                          onChange={(e) => setEditCourseOriginalPrice(e.target.value)}
                          placeholder="999"
                          className="w-full bg-white border border-stone-300 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                        />
                      </div>
                    </div>

                    {/* Quick Strike Price Presets Matching User Screenshot */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Strike Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[499, 699, 999, 1499, 1999, 2999, 4999].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditCourseOriginalPrice(String(preset))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              String(editCourseOriginalPrice) === String(preset)
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                            }`}
                          >
                            ₹{preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculated Savings helper */}
                    {parseFloat(editCourseOriginalPrice) > parseFloat(editCoursePrice) ? (
                      <div className="p-2.5 bg-emerald-100/70 border border-emerald-300/80 rounded-xl text-xs text-emerald-950 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-emerald-700">savings</span>
                          <span>Student Savings: ₹{Math.round(parseFloat(editCourseOriginalPrice) - parseFloat(editCoursePrice))}</span>
                        </span>
                        <span className="font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[10px]">
                          {Math.round(((parseFloat(editCourseOriginalPrice) - parseFloat(editCoursePrice)) / parseFloat(editCourseOriginalPrice)) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-700">warning</span>
                        <span>Strike price should be greater than Selling Price (₹{editCoursePrice}) to show discount badge.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100/90 border border-stone-200 rounded-xl flex items-center gap-2.5 text-[11px] text-stone-600">
                    <span className="material-symbols-outlined text-stone-400 text-base">info</span>
                    <span>
                      Strike-off is turned <strong>OFF</strong>. The course will be presented cleanly at <strong>₹{editCoursePrice}</strong> with no crossed-out figures. Your configured MRP ({editCourseOriginalPrice ? `₹${editCourseOriginalPrice}` : '₹999'}) is preserved in the background.
                    </span>
                  </div>
                )}
              </div>

              {/* COURSE LOCK TOGGLE (VIDEO UNDER EDITING) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg text-amber-600">lock</span>
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">Lock Course (Video Under Editing)</span>
                      <span className="text-[11px] text-amber-800">Prevent customers/students from opening lessons while video is in post-production.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCourseIsLocked}
                      onChange={(e) => setEditCourseIsLocked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {editCourseIsLocked && (
                  <div className="pt-2.5 border-t border-amber-200/80 space-y-1">
                    <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Lock Notice Displayed to Enrolled Students:
                    </label>
                    <input
                      type="text"
                      value={editCourseLockReason}
                      onChange={(e) => setEditCourseLockReason(e.target.value)}
                      placeholder="Course video is currently under editing. The final video will be unlocked soon."
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* LIVE CARD BADGE PREVIEW */}
              <div className="p-3 bg-stone-100/80 border border-stone-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Live Visual Preview on Course Card:</span>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-serif text-emerald-950">₹{parseFloat(editCoursePrice) || 299}</span>
                    {editCourseHasStrikePrice && parseFloat(editCourseOriginalPrice) > (parseFloat(editCoursePrice) || 0) && (
                      <span className="text-xs line-through text-stone-400 font-mono">₹{parseFloat(editCourseOriginalPrice)}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Enroll Now • ₹{parseFloat(editCoursePrice) || 299}
                  </span>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editCourseSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Save Pricing</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTIONAL & SOCIAL MEDIA LAUNCH SUITE MODAL */}
      {promoteModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200/90 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-xl text-amber-300">rocket_launch</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                    <span>Promotional &amp; Social Launch Suite</span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      Auto-Generated
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Promote <strong className="text-stone-800">{selectedCourse.title}</strong> across social handles with branded QR pass and tailored copy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPromoteModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/80 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setPromoteTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  promoteTab === 'overview'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-emerald-700">qr_code_2</span>
                <span>VIP Link &amp; QR Pass</span>
              </button>
              <button
                onClick={() => setPromoteTab('whatsapp')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  promoteTab === 'whatsapp'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#25D366]">chat</span>
                <span>WhatsApp Broadcast</span>
              </button>
              <button
                onClick={() => setPromoteTab('instagram')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  promoteTab === 'instagram'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-pink-600">photo_camera</span>
                <span>Instagram &amp; Bio</span>
              </button>
              <button
                onClick={() => setPromoteTab('twitter')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  promoteTab === 'twitter'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="font-bold text-xs text-stone-800">𝕏</span>
                <span>X / Twitter</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & QR PASS */}
            {promoteTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-gradient-to-br from-emerald-50/70 via-stone-50 to-teal-50/40 p-5 rounded-2xl border border-emerald-200/80">
                  
                  {/* Left: Interactive QR Code Pass */}
                  <div className="md:col-span-5 flex flex-col items-center text-center space-y-3">
                    <div
                      onClick={() => window.open(`/courses/${selectedCourse.slug}`, '_blank')}
                      className="p-4 bg-white rounded-2xl border-2 border-emerald-600/30 shadow-lg cursor-pointer hover:scale-102 transition-transform group relative"
                      title="Click to test enrollment redirect"
                    >
                      <QRCodeSVG
                        value={`https://3capstech.com/courses/${selectedCourse.slug}`}
                        size={160}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#064E3B"
                        imageSettings={{
                          src: '/lm_logo.png',
                          x: undefined,
                          y: undefined,
                          height: 32,
                          width: 32,
                          excavate: true
                        }}
                        className="rounded-lg"
                      />
                      <div className="absolute inset-0 bg-emerald-950/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-[11px] font-bold">
                        <span className="material-symbols-outlined text-xl text-amber-300">open_in_new</span>
                        <span>Click to Test Redirect</span>
                      </div>
                    </div>

                    <a
                      href={`${BASE_URL}/api/public/courses/${selectedCourse.slug}/qr.png`}
                      download={`LandscapeMastery_QR_${selectedCourse.slug}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-amber-300">download</span>
                      <span>Download QR (PNG)</span>
                    </a>
                  </div>

                  {/* Right: Promotional Links & Copy */}
                  <div className="md:col-span-7 space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Individual Promotional Page URL:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono text-[11px] text-emerald-900 truncate shadow-2xs">
                          {window.location.origin}/landscapemastery/promo/{selectedCourse.slug}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(`${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`);
                            setCopiedPromoLink(true);
                            setTimeout(() => setCopiedPromoLink(false), 2000);
                          }}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-200 hover:border-emerald-300 font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copiedPromoLink ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedPromoLink ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => window.open(`/landscapemastery/promo/${selectedCourse.slug}`, '_blank')}
                          className="p-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 transition-all shadow-2xs cursor-pointer flex-shrink-0"
                          title="Open live promotional page"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Direct Enrollment / Checkout URL:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono text-[11px] text-stone-700 truncate shadow-2xs">
                          {window.location.origin}/courses/{selectedCourse.slug}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(`${window.location.origin}/courses/${selectedCourse.slug}`);
                            setMutationMessage({ type: 'success', text: 'Checkout link copied!' });
                          }}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2 text-[11px] text-stone-500">
                      <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                      <span>Auto-generated immediately upon course creation. Mobile responsive.</span>
                    </div>
                  </div>

                </div>

                {/* Direct Image Hotlink for Email Newsletters & Posters */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Embed QR Code in Emails &amp; Flyers:
                    </span>
                    <button
                      onClick={() => {
                        const snippet = `<a href="https://3capstech.com/landscapemastery/promo/${selectedCourse.slug}"><img src="https://3capstech.com/api/public/courses/${selectedCourse.slug}/qr.png" alt="Scan to enroll in ${selectedCourse.title}" width="220" /></a>`;
                        navigator.clipboard?.writeText(snippet);
                        setCopiedQrHtml(true);
                        setTimeout(() => setCopiedQrHtml(false), 2000);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedQrHtml ? 'check' : 'code'}
                      </span>
                      <span>{copiedQrHtml ? 'Snippet Copied!' : 'Copy HTML Embed Snippet'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/80 overflow-x-auto">
                    {`<a href="https://3capstech.com/landscapemastery/promo/${selectedCourse.slug}">\n  <img src="https://3capstech.com/api/public/courses/${selectedCourse.slug}/qr.png" width="220" />\n</a>`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP PROMOTION */}
            {promoteTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#25D366]">
                      <span className="material-symbols-outlined text-lg">chat</span>
                      <strong className="text-xs text-stone-900 font-bold">WhatsApp Ready-to-Send Template</strong>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">1-Click Dispatch</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-200/80 text-xs text-stone-800 font-sans whitespace-pre-wrap leading-relaxed shadow-2xs">
{`🌿 Start learning with *${selectedCourse.title}* by Landscape Mastery (a product of 3CAPSTECH)!

Get complete lifetime access for only ₹${parseInt(selectedCourse.price || 299)}${selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) ? ` (Special offer down from ₹${parseInt(selectedCourse.original_price)} • ${selectedCourse.discount_pct || Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% OFF)` : ''}.

✨ Tap here or scan the QR pass to join:
${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        const priceNote = selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) ? ` (Special offer down from ₹${parseInt(selectedCourse.original_price)} • ${selectedCourse.discount_pct || Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% OFF)` : '';
                        const text = `🌿 Start learning with *${selectedCourse.title}* by Landscape Mastery (a product of 3CAPSTECH)!\n\nGet complete lifetime access for only ₹${parseInt(selectedCourse.price || 299)}${priceNote}.\n\n✨ Tap here or scan the QR pass to join:\n${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      <span>Launch in WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        const priceNote = selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) ? ` (Special offer down from ₹${parseInt(selectedCourse.original_price)} • ${selectedCourse.discount_pct || Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% OFF)` : '';
                        const text = `🌿 Start learning with *${selectedCourse.title}* by Landscape Mastery (a product of 3CAPSTECH)!\n\nGet complete lifetime access for only ₹${parseInt(selectedCourse.price || 299)}${priceNote}.\n\n✨ Tap here or scan the QR pass to join:\n${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`;
                        navigator.clipboard?.writeText(text);
                        setCopiedWhatsappText(true);
                        setTimeout(() => setCopiedWhatsappText(false), 2000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedWhatsappText ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedWhatsappText ? 'Copied Message!' : 'Copy WhatsApp Text'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INSTAGRAM & BIO */}
            {promoteTab === 'instagram' && (
              <div className="space-y-4">
                <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-pink-600">
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                      <strong className="text-xs text-stone-900 font-bold">Instagram Caption &amp; Bio Helper</strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-200/80 text-xs text-stone-800 font-sans whitespace-pre-wrap leading-relaxed shadow-2xs">
{`✨ Join ${selectedCourse.title} by Landscape Mastery (a product of 3CAPSTECH).

Complete video lessons, practical frameworks, and downloadable resources.

👉 Tap the link in bio or visit: 3capstech.com/landscapemastery/promo/${selectedCourse.slug}

#landscapedesign #architecture #landscapemastery #3capstech`}
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        const text = `✨ Join ${selectedCourse.title} by Landscape Mastery (a product of 3CAPSTECH).\n\nComplete video lessons, practical frameworks, and downloadable resources.\n\n👉 Tap the link in bio or visit: 3capstech.com/landscapemastery/promo/${selectedCourse.slug}\n\n#landscapedesign #architecture #landscapemastery #3capstech`;
                        navigator.clipboard?.writeText(text);
                        setCopiedInstaCaption(true);
                        setTimeout(() => setCopiedInstaCaption(false), 2000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedInstaCaption ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedInstaCaption ? 'Caption Copied!' : 'Copy Instagram Caption'}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`);
                        setMutationMessage({ type: 'success', text: 'Bio link copied!' });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      <span>Copy Bio Link</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TWITTER / X & LINKEDIN */}
            {promoteTab === 'twitter' && (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-stone-900 font-bold">X (Twitter) &amp; LinkedIn Dispatch</strong>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-200/80 text-xs text-stone-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
{`Join ${selectedCourse.title} by Landscape Mastery (a product of 3CAPSTECH). Lifetime access for ₹${parseInt(selectedCourse.price || 299)}${selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) ? ` (Regular ₹${parseInt(selectedCourse.original_price)} • ${selectedCourse.discount_pct || Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% OFF)` : ''}: ${window.location.origin}/landscapemastery/promo/${selectedCourse.slug} #LandscapeMastery #3CAPSTECH`}
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        const priceNote = selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) ? ` (Regular ₹${parseInt(selectedCourse.original_price)} • ${selectedCourse.discount_pct || Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% OFF)` : '';
                        const text = `Join ${selectedCourse.title} by Landscape Mastery (a product of 3CAPSTECH). Lifetime access for ₹${parseInt(selectedCourse.price || 299)}${priceNote}: ${window.location.origin}/landscapemastery/promo/${selectedCourse.slug} #LandscapeMastery #3CAPSTECH`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span className="font-bold text-xs">𝕏</span>
                      <span>Tweet on X</span>
                    </button>

                    <button
                      onClick={() => {
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/landscapemastery/promo/${selectedCourse.slug}`)}`, '_blank');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">hub</span>
                      <span>Share on LinkedIn</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
              <span className="text-stone-400 font-mono text-[11px]">
                Target: {window.location.origin}/landscapemastery/promo/{selectedCourse.slug}
              </span>
              <button
                type="button"
                onClick={() => setPromoteModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
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
