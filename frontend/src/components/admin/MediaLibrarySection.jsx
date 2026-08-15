import React, { useState } from 'react';

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
    <div className="space-y-6">
      {/* Upload Box Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-2xl">folder_open</span>
              Centralized Content &amp; Media Asset Library
            </h1>
            <p className="text-xs text-stone-500 mt-1">Upload and manage short videos (1-10m), long masterclasses (2h+), and PDF blueprint downloads.</p>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSimulatedUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50 p-5 rounded-xl border border-stone-200">
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

          <div className="md:col-span-3 flex justify-between items-center pt-2">
            <div className="text-xs text-stone-500 font-medium">
              {uploading ? `Uploading & Encrypting Asset... ${uploadProgress}%` : 'Supports direct MP4, MOV, PDF up to 10 GB per file'}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {uploading ? 'Processing Upload...' : 'Upload Media Asset'}
            </button>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="md:col-span-3 w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
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
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all ${
                  filterType === type 
                    ? 'bg-emerald-700 text-white shadow-sm' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {type === 'all' ? 'All Assets' : type === 'long_video' ? 'Long Masterclasses' : type === 'short_video' ? 'Short Videos' : 'PDF Blueprints'}
              </button>
            ))}
          </div>
          <span className="text-xs text-stone-500 font-semibold">{filteredAssets.length} Assets Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                <th className="py-3 px-3">Asset Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Duration / Size</th>
                <th className="py-3 px-3">Upload Date</th>
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
                  <td className="py-4 px-3 text-stone-600">{asset.duration} • ({asset.size})</td>
                  <td className="py-4 px-3 text-stone-500">{asset.created_at}</td>
                  <td className="py-4 px-3 text-right space-x-3">
                    <button className="text-emerald-700 hover:underline font-semibold">Preview</button>
                    <button onClick={() => setAssets(assets.filter(a => a.id !== asset.id))} className="text-rose-600 hover:underline font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
