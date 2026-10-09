import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../lib/api.js';

export default function CompanyConfigSection({ token }) {
  const [activeTab, setActiveTab] = useState('brand');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const authToken = token || localStorage.getItem('admin_token') || localStorage.getItem('lm_auth_token') || '';

  // 1. BRAND & IDENTITY CONFIG
  const [brandConfig, setBrandConfig] = useState({
    name: '3CAPSTECH',
    email: 'md.3capstech@gmail.com',
    phone: '+91 94409 99908',
    address: 'Phase 2, Shanthi Nilayam, 15-25/648, Kukatpally Housing Board Colony, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500085',
    primary_color: '#11A831',
    secondary_color: '#0549B1',
    theme_mode: 'dark-hybrid',
    text_primary_light: '#1E293B',
    text_secondary_light: '#64748B'
  });
  const [savingBrand, setSavingBrand] = useState(false);

  // 2. DATA LISTS
  const [services, setServices] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [products, setProducts] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newsletters, setNewsletters] = useState([]);

  // 3. MODAL STATES
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState({ service_id: '', title: '', desc: '', icon: 'Code2', tags: '', items: '', is_active: true });

  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [newSolution, setNewSolution] = useState({ name: '', category: 'Education', desc: '', display_order: 1, is_active: true });

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_id: '', title: '', desc: '', icon: 'Code2', link: '', is_active: true });

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [newLeader, setNewLeader] = useState({ name: '', title: 'Founder & CEO', bio: '', photo: '', linkedin: '', display_order: 1, is_active: true });

  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', role: 'Enterprise Client', text: '', avatar: '', is_active: true });

  const [viewingContact, setViewingContact] = useState(null);

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  };

  // Fetch initial data
  useEffect(() => {
    fetchBrandConfig();
    fetchServices();
    fetchSolutions();
    fetchProducts();
    fetchLeaders();
    fetchTestimonials();
    fetchContacts();
    fetchNewsletters();
  }, [authToken]);

  const fetchBrandConfig = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setBrandConfig(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/services`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : data.results || []);
      } else {
        const pRes = await fetch(`${BASE_URL}/api/services`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setServices(pData.services || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSolutions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/solutions`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSolutions(Array.isArray(data) ? data : data.results || []);
      } else {
        const pRes = await fetch(`${BASE_URL}/api/solutions`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setSolutions(pData.solutions || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/products`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.results || []);
      } else {
        const pRes = await fetch(`${BASE_URL}/api/products`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setProducts(pData.products || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/leaders`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLeaders(Array.isArray(data) ? data : data.results || []);
      } else {
        const pRes = await fetch(`${BASE_URL}/api/leaders`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setLeaders(pData.leaders || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/testimonials`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(Array.isArray(data) ? data : data.results || []);
      } else {
        const pRes = await fetch(`${BASE_URL}/api/testimonials`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setTestimonials(pData.testimonials || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/contacts`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNewsletters = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/newsletters`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNewsletters(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Brand Config
  const handleSaveBrandConfig = async (e) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const res = await fetch(`${BASE_URL}/api/config`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(brandConfig)
      });
      if (res.ok) {
        showToast('3CAPSTECH corporate brand configuration synchronized & saved successfully!');
      } else {
        showToast('Failed to save 3CAPSTECH configuration.', 'error');
      }
    } catch (e) {
      showToast('Network error saving 3CAPSTECH settings.', 'error');
    } finally {
      setSavingBrand(false);
    }
  };

  // Add Service Handler
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = typeof newService.tags === 'string' 
        ? newService.tags.split(',').map(s => s.trim()).filter(Boolean)
        : newService.tags;
      const itemsArray = typeof newService.items === 'string' 
        ? newService.items.split(',').map(s => s.trim()).filter(Boolean)
        : newService.items;

      const payload = {
        ...newService,
        service_id: newService.service_id || newService.title.toLowerCase().replace(/\s+/g, '-'),
        tags: tagsArray,
        items: itemsArray
      };

      const res = await fetch(`${BASE_URL}/api/admin/company/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Service created successfully!');
        setServiceModalOpen(false);
        setNewService({ service_id: '', title: '', desc: '', icon: 'Code2', tags: '', items: '', is_active: true });
        fetchServices();
      } else {
        showToast('Failed to create service.', 'error');
      }
    } catch (e) {
      showToast('Network error creating service.', 'error');
    }
  };

  // Delete Service
  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Service deleted successfully.');
        fetchServices();
      }
    } catch (e) {
      showToast('Network error deleting service.', 'error');
    }
  };

  // Toggle Service Active
  const handleToggleService = async (service) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/services/${service.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: !service.is_active })
      });
      if (res.ok) {
        showToast(`Service status updated!`);
        fetchServices();
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  // Add Solution Handler
  const handleCreateSolution = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/solutions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newSolution)
      });
      if (res.ok) {
        showToast('Enterprise solution created!');
        setSolutionModalOpen(false);
        setNewSolution({ name: '', category: 'Education', desc: '', display_order: 1, is_active: true });
        fetchSolutions();
      } else {
        showToast('Failed to create solution.', 'error');
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteSolution = async (id) => {
    if (!window.confirm('Delete this solution?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/solutions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Solution removed.');
        fetchSolutions();
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  // Add Product Handler
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        product_id: newProduct.product_id || newProduct.title.toLowerCase().replace(/\s+/g, '-')
      };
      const res = await fetch(`${BASE_URL}/api/admin/company/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Product added successfully!');
        setProductModalOpen(false);
        setNewProduct({ product_id: '', title: '', desc: '', icon: 'Code2', link: '', is_active: true });
        fetchProducts();
      } else {
        showToast('Failed to create product.', 'error');
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Product deleted.');
        fetchProducts();
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  // Add Leader Handler
  const handleCreateLeader = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/leaders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newLeader)
      });
      if (res.ok) {
        showToast('Leader profile added!');
        setLeaderModalOpen(false);
        setNewLeader({ name: '', title: 'Founder & CEO', bio: '', photo: '', linkedin: '', display_order: 1, is_active: true });
        fetchLeaders();
      } else {
        showToast('Failed to save leader profile.', 'error');
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteLeader = async (id) => {
    if (!window.confirm('Delete this leader profile?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/leaders/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Leader removed.');
        fetchLeaders();
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  // Add Testimonial Handler
  const handleCreateCompanyTestimonial = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/testimonials`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newTestimonial)
      });
      if (res.ok) {
        showToast('Client review created!');
        setTestimonialModalOpen(false);
        setNewTestimonial({ name: '', role: 'Enterprise Client', text: '', avatar: '', is_active: true });
        fetchTestimonials();
      } else {
        showToast('Failed to create testimonial.', 'error');
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  const handleDeleteCompanyTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/company/testimonials/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Testimonial deleted.');
        fetchTestimonials();
      }
    } catch (e) {
      showToast('Network error.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 3CAPSTECH Header Card */}
      <div className="bg-gradient-to-r from-stone-900 via-[#0B1528] to-stone-900 text-white p-6 sm:p-7 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(17,168,49,0.25)]">
            <span className="material-symbols-outlined text-2xl text-emerald-400">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">3CAPSTECH Corporate Configuration</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                Master Governance
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Unified governance of 3CAPSTECH IT services, enterprise solutions, product catalog, team, and corporate leads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/company"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>Preview Corporate Site</span>
          </a>
          <a
            href="/admin"
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Open Dedicated Console</span>
          </a>
        </div>
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

      {/* Sub Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs">
        {[
          { id: 'brand', label: 'Brand & Corporate Identity', icon: 'settings' },
          { id: 'services', label: `Core Services (${services.length})`, icon: 'business_center' },
          { id: 'solutions', label: `Enterprise Solutions (${solutions.length})`, icon: 'layers' },
          { id: 'products', label: `Products & Platforms (${products.length})`, icon: 'package' },
          { id: 'leaders', label: `Leadership Profiles (${leaders.length})`, icon: 'groups' },
          { id: 'testimonials', label: `Testimonials (${testimonials.length})`, icon: 'star' },
          { id: 'leads', label: `Corporate Leads (${contacts.length})`, icon: 'inbox' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer text-xs ${
              activeTab === tab.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: BRAND CONFIGURATION */}
      {activeTab === 'brand' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-base font-bold text-stone-900">Corporate Identity &amp; Contact Parameters</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              These tokens drive the public 3CAPSTECH corporate website header, footer, contact form, and branding colors.
            </p>
          </div>

          <form onSubmit={handleSaveBrandConfig} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  type="text"
                  value={brandConfig.name || ''}
                  onChange={(e) => setBrandConfig({ ...brandConfig, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={brandConfig.email || ''}
                  onChange={(e) => setBrandConfig({ ...brandConfig, email: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Corporate Phone Number</label>
                <input
                  type="text"
                  value={brandConfig.phone || ''}
                  onChange={(e) => setBrandConfig({ ...brandConfig, phone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Theme Mode</label>
                <select
                  value={brandConfig.theme_mode || 'dark-hybrid'}
                  onChange={(e) => setBrandConfig({ ...brandConfig, theme_mode: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="dark-hybrid">Dark Hybrid (Recommended Corporate Default)</option>
                  <option value="dark">Pure Dark Slate</option>
                  <option value="light">Crisp Light Mode</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Headquarters Physical Address</label>
              <textarea
                rows="2"
                value={brandConfig.address || ''}
                onChange={(e) => setBrandConfig({ ...brandConfig, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Primary Brand Accent</span>
                  <span className="text-[11px] font-mono text-stone-500">{brandConfig.primary_color || '#11A831'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandConfig.primary_color || '#11A831'}
                    onChange={(e) => setBrandConfig({ ...brandConfig, primary_color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandConfig.primary_color || '#11A831'}
                    onChange={(e) => setBrandConfig({ ...brandConfig, primary_color: e.target.value })}
                    className="w-24 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Secondary Accent Color</span>
                  <span className="text-[11px] font-mono text-stone-500">{brandConfig.secondary_color || '#0549B1'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandConfig.secondary_color || '#0549B1'}
                    onChange={(e) => setBrandConfig({ ...brandConfig, secondary_color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandConfig.secondary_color || '#0549B1'}
                    onChange={(e) => setBrandConfig({ ...brandConfig, secondary_color: e.target.value })}
                    className="w-24 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingBrand}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{savingBrand ? 'Synchronizing...' : 'Save & Sync Brand Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Core Engineering Services</h2>
              <p className="text-xs text-stone-500">Configure IT service offerings presented on the 3CAPSTECH platform.</p>
            </div>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(s => (
              <div key={s.id || s.service_id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-lg">code</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">{s.title}</h3>
                        <span className="text-[10px] font-mono text-stone-400">ID: {s.service_id || s.id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleService(s)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border cursor-pointer ${
                        s.is_active !== false ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {s.is_active !== false ? '✓ Active' : 'Inactive'}
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                    {s.desc || 'No description provided.'}
                  </p>

                  {s.tags && s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(Array.isArray(s.tags) ? s.tags : [s.tags]).map((tag, i) => (
                        <span key={i} className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Delete Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOLUTIONS */}
      {activeTab === 'solutions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Industry Enterprise Solutions</h2>
              <p className="text-xs text-stone-500">Configure vertical architectures (Education, Healthcare, Finance).</p>
            </div>
            <button
              onClick={() => setSolutionModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Solution</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {solutions.map(sol => (
              <div key={sol.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {sol.category}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">Order: #{sol.display_order || 1}</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm mt-2">{sol.name}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{sol.desc}</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteSolution(sol.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Delete Solution
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Corporate Products &amp; Platforms</h2>
              <p className="text-xs text-stone-500">Showcase proprietary products including Landscape Mastery and enterprise SaaS.</p>
            </div>
            <button
              onClick={() => setProductModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-900 text-sm">{p.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      p.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{p.desc}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline mt-2"
                    >
                      <span>{p.link}</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LEADERS */}
      {activeTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Executive Leadership Team</h2>
              <p className="text-xs text-stone-500">Manage founder profiles, executive bios, and social links.</p>
            </div>
            <button
              onClick={() => setLeaderModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Leader</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaders.map(l => (
              <div key={l.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center font-bold text-stone-700">
                      {l.photo ? (
                        <img src={l.photo.startsWith('http') || l.photo.startsWith('/media') ? (l.photo.startsWith('/media') ? `${BASE_URL}${l.photo}` : l.photo) : l.photo} alt={l.name} className="w-full h-full object-cover" />
                      ) : (
                        l.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{l.name}</h3>
                      <span className="text-[11px] text-emerald-800 font-semibold block">{l.title}</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">{l.bio}</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteLeader(l.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Delete Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Corporate Client Testimonials</h2>
              <p className="text-xs text-stone-500">Manage client endorsements shown on the 3CAPSTECH platform.</p>
            </div>
            <button
              onClick={() => setTestimonialModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Review</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-stone-900">{t.name} <span className="text-stone-500 font-normal">({t.role})</span></div>
                  <p className="text-xs text-stone-600 mt-2 italic leading-relaxed">"{t.text}"</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteCompanyTestimonial(t.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Delete Testimonial
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: LEADS */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-base font-bold text-stone-900">Contact Form Inquiries ({contacts.length})</h2>
            <p className="text-xs text-stone-500 mt-0.5">Prospective corporate client submissions from 3CAPSTECH website.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                    <th className="py-3 px-3">Lead Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Interest</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={c.id || i} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900">{c.name}</td>
                      <td className="py-3 px-3 text-stone-700 font-mono">{c.email}</td>
                      <td className="py-3 px-3 text-stone-600">{c.company || 'N/A'}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-800">{c.interest || 'General'}</td>
                      <td className="py-3 px-3 text-stone-500 text-[11px] font-mono">{c.created_at ? c.created_at.split('T')[0] : 'Recent'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setViewingContact(c)}
                          className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-stone-400">No corporate inquiries received yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-base font-bold text-stone-900">Newsletter Subscribers ({newsletters.length})</h2>
            <p className="text-xs text-stone-500 mt-0.5">Verified subscribers to the 3CAPSTECH technology bulletin.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Subscription Date</th>
                  </tr>
                </thead>
                <tbody>
                  {newsletters.map((n, i) => (
                    <tr key={n.id || i} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-stone-900 font-semibold">{n.email}</td>
                      <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">{n.created_at || 'Recent'}</td>
                    </tr>
                  ))}
                  {newsletters.length === 0 && (
                    <tr>
                      <td colSpan="2" className="text-center py-6 text-stone-400">No newsletter subscribers yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SERVICE */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Add Core Service</h3>
              <button onClick={() => setServiceModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  placeholder="e.g. AI & Automation Pipelines"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={newService.desc}
                  onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
                  placeholder="Service description..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Tags (Comma-Separated)</label>
                <input
                  type="text"
                  value={newService.tags}
                  onChange={(e) => setNewService({ ...newService, tags: e.target.value })}
                  placeholder="e.g. React, Python, Docker"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setServiceModalOpen(false)} className="px-4 py-2 font-semibold text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl cursor-pointer">Save Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SOLUTION */}
      {solutionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Add Enterprise Solution</h3>
              <button onClick={() => setSolutionModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSolution} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Solution Name</label>
                <input
                  type="text"
                  required
                  value={newSolution.name}
                  onChange={(e) => setNewSolution({ ...newSolution, name: e.target.value })}
                  placeholder="e.g. Healthcare Clinical Trial Engine"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Industry Category</label>
                <input
                  type="text"
                  required
                  value={newSolution.category}
                  onChange={(e) => setNewSolution({ ...newSolution, category: e.target.value })}
                  placeholder="e.g. Healthcare, Education, FinTech"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={newSolution.desc}
                  onChange={(e) => setNewSolution({ ...newSolution, desc: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSolutionModalOpen(false)} className="px-4 py-2 font-semibold text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl cursor-pointer">Save Solution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Add Product / Platform</h3>
              <button onClick={() => setProductModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Enterprise LMS Hub"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">URL Link</label>
                <input
                  type="text"
                  value={newProduct.link}
                  onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                  placeholder="e.g. /landscapemastery or https://..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={newProduct.desc}
                  onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setProductModalOpen(false)} className="px-4 py-2 font-semibold text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl cursor-pointer">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEADER */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Add Leader Profile</h3>
              <button onClick={() => setLeaderModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateLeader} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Executive Name</label>
                <input
                  type="text"
                  required
                  value={newLeader.name}
                  onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Reddy"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Executive Title</label>
                <input
                  type="text"
                  required
                  value={newLeader.title}
                  onChange={(e) => setNewLeader({ ...newLeader, title: e.target.value })}
                  placeholder="e.g. Managing Director & Chief Architect"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Professional Bio</label>
                <textarea
                  rows="3"
                  required
                  value={newLeader.bio}
                  onChange={(e) => setNewLeader({ ...newLeader, bio: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Photo URL</label>
                <input
                  type="text"
                  value={newLeader.photo}
                  onChange={(e) => setNewLeader({ ...newLeader, photo: e.target.value })}
                  placeholder="https://... or /media/leaders/..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setLeaderModalOpen(false)} className="px-4 py-2 font-semibold text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl cursor-pointer">Save Leader</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TESTIMONIAL */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Add Client Review</h3>
              <button onClick={() => setTestimonialModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCompanyTestimonial} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={newTestimonial.name}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Role &amp; Company</label>
                <input
                  type="text"
                  required
                  value={newTestimonial.role}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                  placeholder="e.g. CTO, Vertex Global"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Endorsement Text</label>
                <textarea
                  rows="3"
                  required
                  value={newTestimonial.text}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTestimonialModalOpen(false)} className="px-4 py-2 font-semibold text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl cursor-pointer">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: VIEW CONTACT */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">{viewingContact.name}</h3>
                <span className="text-stone-500 font-mono text-[11px]">{viewingContact.email}</span>
              </div>
              <button onClick={() => setViewingContact(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">Company:</span>
                <span className="text-stone-900 font-medium">{viewingContact.company || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">Interest Category:</span>
                <span className="text-emerald-800 font-bold">{viewingContact.interest || 'General'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">Date Submitted:</span>
                <span className="text-stone-700 font-mono">{viewingContact.created_at || 'Recent'}</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-500 font-semibold block mb-1">Message Content:</span>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {viewingContact.message}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingContact(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2 rounded-xl font-semibold cursor-pointer"
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
