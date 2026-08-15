import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MediaLibrarySection({ token }) {
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [assets, setAssets] = useState([
    { id: 1, title: 'Executive Spatial Masterclass (Full)', asset_type: 'long_video', duration: '2 hrs 45 mins', size: '1.8 GB', created_at: '2026-08-15' },
    { id: 2, title: 'Hardscape Material Spec Sheet', asset_type: 'pdf', duration: '14 Pages PDF', size: '12.4 MB', created_at: '2026-08-14' },
    { id: 3, title: 'Botanical Lighting Accent Technique', asset_type: 'short_video', duration: '8 mins', size: '145 MB', created_at: '2026-08-14' },
  ]);

  const [newAsset, setNewAsset] = useState({
    title: '',
    asset_type: 'long_video',
    duration: '2 hrs',
    url: ''
  });

  const handleSimulatedUpload = (e) => {
    e.preventDefault();
    if (!newAsset.title) return;

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setAssets([{ id: Date.now(), ...newAsset, size: '240 MB', created_at: 'Just now' }, ...assets]);
          setNewAsset({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const filteredAssets = filterType === 'all' 
    ? assets 
    : assets.filter(a => a.asset_type === filterType);

  return (
    <div className="space-y-8">
      {/* Upload Box Header */}
      <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-2xl">folder_open</span>
              Centralized Content &amp; Media Asset Library
            </h1>
            <p className="text-xs text-slate-400 mt-1">Upload and manage short videos (1-10m), long masterclasses (2h+), and PDF blueprint downloads.</p>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSimulatedUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/80 p-5 rounded-xl border border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resource Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Hour Architectural Lighting Deep Dive"
              value={newAsset.title}
              onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Asset Category</label>
            <select
              value={newAsset.asset_type}
              onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="long_video">Long Video / Masterclass (2+ hours)</option>
              <option value="short_video">Short Video (1 - 10 mins)</option>
              <option value="pdf">PDF Blueprint / Document</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration / Page Specs</label>
            <input
              type="text"
              placeholder="e.g. 2 hrs 45 mins"
              value={newAsset.duration}
              onChange={(e) => setNewAsset({ ...newAsset, duration: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="md:col-span-3 flex justify-between items-center pt-2">
            <div className="text-xs text-slate-400">
              {uploading ? `Uploading & Encrypting Asset... ${uploadProgress}%` : 'Supports direct MP4, MOV, PDF up to 10 GB per file'}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {uploading ? 'Processing Upload...' : 'Upload Media Asset'}
            </button>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="md:col-span-3 w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </form>
      </div>

      {/* Filter Tabs & Media Table */}
      <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {['all', 'long_video', 'short_video', 'pdf'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl uppercase tracking-wider transition-all ${
                  filterType === type ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {type === 'all' ? 'All Assets' : type === 'long_video' ? 'Long Masterclasses' : type === 'short_video' ? 'Short Videos' : 'PDF Blueprints'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-semibold">{filteredAssets.length} Assets Found</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <th className="py-3 px-3">Asset Title</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Duration / Size</th>
              <th className="py-3 px-3">Upload Date</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                <td className="py-4 px-3 font-semibold text-slate-200">{asset.title}</td>
                <td className="py-4 px-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    asset.asset_type === 'long_video' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50' :
                    asset.asset_type === 'pdf' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    {asset.asset_type === 'long_video' ? 'Long Video (2h+)' : asset.asset_type === 'pdf' ? 'PDF Document' : 'Short Video'}
                  </span>
                </td>
                <td className="py-4 px-3 text-slate-400">{asset.duration} • ({asset.size})</td>
                <td className="py-4 px-3 text-slate-400">{asset.created_at}</td>
                <td className="py-4 px-3 text-right space-x-2">
                  <button className="text-teal-400 hover:underline font-semibold">Preview</button>
                  <button onClick={() => setAssets(assets.filter(a => a.id !== asset.id))} className="text-rose-400 hover:underline font-semibold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
