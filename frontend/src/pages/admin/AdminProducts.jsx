import { useState, useEffect } from 'react';
import { formatRupiah } from '../../utils/format';
import api, { getImageUrl } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product object
  const [form, setForm] = useState({ name:'', category_id:'', base_price:'', stock:'', description:'', is_active:1 });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    let url = `/admin/products?page=${page}&limit=10`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (catFilter) url += `&category=${catFilter}`;
    api.get(url).then(r => {
      if (r.data?.success) { setProducts(r.data.data || []); setTotalPages(r.data.pagination?.totalPages || 1); }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/admin/products/kategori').then(r => setCategories(r.data?.data || [])).catch(() => {});
  }, []);
  useEffect(loadProducts, [page, search, catFilter]);

  const openAdd = () => { setForm({ name:'', category_id:'', base_price:'', stock:'', description:'', is_active:1 }); setImages([]); setModal('add'); };
  const openEdit = async (id) => {
    const r = await api.get(`/admin/products/${id}`);
    if (r.data?.success) {
      const p = r.data.data;
      setForm({ name:p.name, category_id:p.category_id||'', base_price:p.base_price, stock:p.stock, description:p.description||'', is_active:p.is_active });
      setImages([]); setModal(p);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    images.forEach(f => fd.append('images', f));
    try {
      if (modal === 'add') {
        await api.post('/admin/products', fd);
      } else {
        await api.put(`/admin/products/${modal.id}`, fd);
      }
      setModal(null); loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    await api.delete(`/admin/products/${id}`);
    loadProducts();
  };

  return (
    <>
      <div className="page-header"><h1>Products</h1><p>Kelola produk kacamata dan lensa</p></div>

      <div className="card" style={{border:'none',borderRadius:'20px',padding:'24px'}}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="d-flex gap-2 flex-grow-1">
            <input className="form-control" placeholder="Cari produk..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select className="form-select" style={{maxWidth:'200px'}} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-success rounded-pill" onClick={openAdd}><i className="bi bi-plus-lg"></i> Tambah</button>
        </div>

        {loading ? <Loading /> : (
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th>ID</th><th>Gambar</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td><img src={getImageUrl(p.image_url)} className="rounded-2" style={{width:'50px',height:'50px',objectFit:'cover'}} /></td>
                    <td>{p.name}</td>
                    <td>{p.category_name || '-'}</td>
                    <td>{formatRupiah(p.base_price)}</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge ${p.is_active ? 'bg-success' : 'bg-danger'} rounded-pill`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-warning rounded-pill me-1" onClick={() => openEdit(p.id)}>Edit</button>
                      <button className="btn btn-sm btn-danger rounded-pill" onClick={() => handleDelete(p.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan="8" className="text-center text-muted">Tidak ada produk</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card" style={{maxWidth:'600px',width:'90%',borderRadius:'20px',padding:'32px',maxHeight:'90vh',overflow:'auto'}}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>{modal === 'add' ? 'Tambah Produk' : 'Edit Produk'}</h4>
              <button className="btn btn-sm" onClick={() => setModal(null)} style={{fontSize:'1.5rem'}}>&times;</button>
            </div>
            <div className="mb-3"><label className="form-label">Nama Produk</label>
              <input className="form-control" value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></div>
            <div className="mb-3"><label className="form-label">Kategori</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="row g-3 mb-3">
              <div className="col-6"><label className="form-label">Harga</label>
                <input type="number" className="form-control" value={form.base_price} onChange={e => setForm({...form, base_price:e.target.value})} /></div>
              <div className="col-6"><label className="form-label">Stok</label>
                <input type="number" className="form-control" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} /></div>
            </div>
            <div className="mb-3"><label className="form-label">Deskripsi</label>
              <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></div>
            <div className="mb-3"><label className="form-label">Status</label>
              <select className="form-select" value={form.is_active} onChange={e => setForm({...form, is_active:parseInt(e.target.value)})}>
                <option value="1">Aktif</option><option value="0">Nonaktif</option>
              </select></div>
            <div className="mb-3"><label className="form-label">Gambar Produk</label>
              <input type="file" className="form-control" multiple accept="image/jpeg,image/png" onChange={e => setImages([...e.target.files])} />
              <small className="text-muted">JPG, PNG. Maks 2MB per file.</small></div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary flex-grow-1" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
