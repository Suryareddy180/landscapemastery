import React, { useState, useEffect } from 'react';

export default function MediaLibrarySection({ token }) {
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [message, setMessage] = useState(null);

  const [newAsset, setNewAsset] = useState({
    title: '',
    asset_type: 'long_video',
    duration: '2 hrs',
    url: ''
  });
  const [fileObj, setFileObj] = useState(null);

  useEffect(() => {
    fetchMediaAssets();
  }, [token]);

  const fetchMediaAssets = async () => {
    setLoading(true);
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('http://localhost:8000/api/admin/media/', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.assets) {
          setAssets(data.assets);
        }
      }
    } catch (e) {
      console.error('Failed to fetch media assets:', e);
    } finally {
      setLoading(false);
    }
  };

  // Genuine Media Upload (BUG-013 / TC-ADM-009)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newAsset.title) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', newAsset.title);
      formData.append('asset_type', newAsset.asset_type);
      formData.append('duration', newAsset.duration);
      if (newAsset.url) formData.append('url', newAsset.url);
      if (fileObj) formData.append('file', fileObj);

      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('http://localhost:8000/api/admin/media/', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        setNewAsset({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
        setFileObj(null);
        setMessage({ type: 'success', text: 'Media asset uploaded and saved to database!' });
        fetchMediaAssets();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to upload asset.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network error during upload.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:8000/api/admin/media/${id}/`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setAssets(assets.filter(a => a.id !== id));
        setMessage({ type: 'success', text: 'Asset removed successfully.' });
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const filteredAssets = filterType === 'all' 
    ? assets 
    : assets.filter(a => a.asset_type === filterType);

  return (
    <div className="space-y-6 font-body-md">
      {/* Upload Box Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-2xl">folder_open</span>
              Centralized Content &amp; Media Asset Library
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Upload and manage short videos (1-10m), long masterclasses (2h+), and PDF blueprint downloads.
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            {message.text}
          </div>
        )}

        {/* Genuine Upload Form (BUG-013) */}
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50 p-5 rounded-xl border border-stone-200">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Resource Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Hour Architectural Lighting Deep Dive"
              value={newAsset.title}
              onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Asset Category</label>
            <select
              value={newAsset.asset_type}
              onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
            >
              <option value="long_video">Long Video / Masterclass (2+ hours)</option>
              <option value="short_video">Short Video (1 - 10 mins)</option>
              <option value="pdf">PDF Blueprint / Document</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Duration / Page Specs</label>
            <input
              type="text"
              placeholder="e.g. 2 hrs 45 mins"
              value={newAsset.duration}
              onChange={(e) => setNewAsset({ ...newAsset, duration: e.target.value })}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Video Stream URL or Cloud Link</label>
            <input
              type="text"
              placeholder="https://commondatastorage.googleapis.com/... or S3 URL"
              value={newAsset.url}
              onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Direct File Attachment (Optional)</label>
            <input
              type="file"
              onChange={(e) => setFileObj(e.target.files[0])}
              className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
            />
          </div>

          <div className="md:col-span-3 flex justify-between items-center pt-2">
            <div className="text-xs text-stone-500 font-medium">
              {uploading ? 'Uploading & recording asset...' : 'Supports MP4, MOV, WebM, and PDF spec files'}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {uploading ? 'Uploading Asset...' : 'Upload & Save Media Asset'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Media Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {['all', 'long_video', 'short_video', 'pdf'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === type 
                    ? 'bg-emerald-700 text-white shadow-sm' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {type === 'all' ? 'All Assets' : type === 'long_video' ? 'Long Masterclasses' : type === 'short_video' ? 'Short Videos' : 'PDF Blueprints'}
              </button>
            ))}
          </div>
          <span className="text-xs text-stone-500 font-semibold">{filteredAssets.length} Assets Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                <th className="py-3 px-3">Asset Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Registered Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors">
                  <td className="py-4 px-3 font-semibold text-stone-900">{asset.title}</td>
                  <td className="py-4 px-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      asset.asset_type === 'long_video' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                      asset.asset_type === 'pdf' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {asset.asset_type === 'long_video' ? 'Long Video (2h+)' : asset.asset_type === 'pdf' ? 'PDF Document' : 'Short Video'}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-stone-600">{asset.duration}</td>
                  <td className="py-4 px-3 text-stone-500">{asset.created_at}</td>
                  <td className="py-4 px-3 text-right space-x-3">
                    <button 
                      onClick={() => handleDelete(asset.id)} 
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-stone-400">
                    {loading ? 'Loading registered assets...' : 'No media assets found in this category.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
