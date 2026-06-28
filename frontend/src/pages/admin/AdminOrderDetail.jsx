import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatRupiah, formatDate } from '../../utils/format';
import api, { getImageUrl } from '../../services/api';
import Loading from '../../components/common/Loading';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ order_status:'pending', payment_status:'pending', shipping_status:'waiting', tracking_number:'', courier:'', admin_notes:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/admin/orders/${id}`).then(r => {
      if (r.data?.success) {
        const o = r.data.data;
        setOrder(o);
        setForm({
          order_status: o.order_status || o.status || 'pending',
          payment_status: o.payment?.payment_status || 'pending',
          shipping_status: o.shipping?.shipping_status || o.shipping?.status || 'waiting',
          tracking_number: o.shipping?.tracking_number || '',
          courier: o.shipping?.courier || '',
          admin_notes: o.shipping?.admin_notes || '',
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put(`/admin/orders/${id}/status`, form);
      setMsg('Status berhasil diperbarui!');
      // Reload
      const r = await api.get(`/admin/orders/${id}`);
      if (r.data?.success) setOrder(r.data.data);
    } catch (err) { setMsg('Gagal: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  if (!order) return <div className="empty-state"><h4>Pesanan tidak ditemukan</h4></div>;

  const statusSteps = ['pending','paid','processing','packed','shipped','delivered'];
  const currentIdx = statusSteps.indexOf(order.order_status || order.status);

  return (
    <>
      <Link to="/admin/orders" className="btn btn-sm btn-outline-secondary rounded-pill mb-3"><i className="bi bi-arrow-left"></i> Kembali</Link>
      <div className="page-header"><h1>Detail Pesanan</h1><p><strong>{order.order_number}</strong> &bull; {formatDate(order.created_at)}</p></div>

      {msg && <div className={`alert ${msg.includes('berhasil')?'alert-success':'alert-danger'} rounded-3 mb-3`}>{msg}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Timeline */}
          <div className="card" style={{border:'none',borderRadius:'20px',padding:'24px',marginBottom:'16px'}}>
            <h5 className="mb-3">Progress</h5>
            <div className="d-flex justify-content-between">
              {statusSteps.map((s, i) => (
                <div key={s} className="text-center flex-grow-1">
                  <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-1"
                    style={{width:'32px',height:'32px',fontSize:'0.8rem',
                      background: i<=currentIdx?'#C77986':'#eee', color: i<=currentIdx?'#fff':'#999'}}>
                    {i<=currentIdx ? '✓' : i+1}
                  </div>
                  <small style={{fontSize:'0.7rem',color:i<=currentIdx?'var(--dark-text)':'#999'}}>{s}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="card" style={{border:'none',borderRadius:'20px',padding:'24px'}}>
            <h5 className="mb-3">Item Pesanan</h5>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Produk</th><th>Harga</th><th>Qty</th><th className="text-end">Subtotal</th></tr></thead>
                <tbody>
                  {(order.items || []).map(item => (
                    <tr key={item.id}>
                      <td><div className="d-flex align-items-center gap-2">
                        <img src={getImageUrl(item.image_url || item.product?.image_url)} className="rounded-2" style={{width:'40px',height:'40px',objectFit:'cover'}} />
                        <span>{item.name || item.product?.name}</span>
                      </div></td>
                      <td>{formatRupiah(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end fw-bold">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#fafafa'}}>
                    <td colSpan="3" className="text-end fw-bold">Total</td>
                    <td className="text-end fw-bold" style={{color:'#C77986'}}>{formatRupiah(order.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Update form */}
        <div className="col-lg-4">
          <div className="card" style={{border:'none',borderRadius:'20px',padding:'24px',marginBottom:'16px'}}>
            <h5 className="mb-3">Update Status</h5>
            <div className="mb-3"><label className="form-label">Status Pesanan</label>
              <select className="form-select" value={form.order_status} onChange={e => setForm({...form,order_status:e.target.value})}>
                {['pending','paid','processing','packed','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="mb-3"><label className="form-label">Status Pembayaran</label>
              <select className="form-select" value={form.payment_status} onChange={e => setForm({...form,payment_status:e.target.value})}>
                {['pending','paid','failed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="mb-3"><label className="form-label">Status Pengiriman</label>
              <select className="form-select" value={form.shipping_status} onChange={e => setForm({...form,shipping_status:e.target.value})}>
                {['waiting','sent','received'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="mb-3"><label className="form-label">Nomor Resi</label>
              <input className="form-control" value={form.tracking_number} onChange={e => setForm({...form,tracking_number:e.target.value})} /></div>
            <div className="mb-3"><label className="form-label">Kurir</label>
              <input className="form-control" value={form.courier} onChange={e => setForm({...form,courier:e.target.value})} /></div>
            <div className="mb-3"><label className="form-label">Catatan Admin</label>
              <textarea className="form-control" rows="2" value={form.admin_notes} onChange={e => setForm({...form,admin_notes:e.target.value})} /></div>
            <button className="btn btn-primary w-100" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : <><i className="bi bi-check-circle"></i> Simpan</>}
            </button>
          </div>

          <div className="card" style={{border:'none',borderRadius:'20px',padding:'24px'}}>
            <h5 className="mb-3">Informasi</h5>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Customer</span><span>{order.username || '-'}</span></div>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Email</span><span>{order.email || '-'}</span></div>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Bayar</span><span>{order.payment_method || '-'}</span></div>
            <div className="py-1"><span className="text-muted d-block">Alamat</span><small>{order.shipping_address || '-'}</small></div>
          </div>
        </div>
      </div>
    </>
  );
}
