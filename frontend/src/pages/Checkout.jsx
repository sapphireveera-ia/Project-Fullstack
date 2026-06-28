import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupiah } from '../utils/format';
import api, { getImageUrl } from '../services/api';
import Loading from '../components/common/Loading';

export default function Checkout() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ recipient_name: '', phone: '', shipping_address: '', payment_method: 'bank_transfer' });
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/checkout-data').then(r => {
      if (r.data?.success) {
        setData(r.data.data);
        const p = r.data.data.profile || {};
        setForm(f => ({ ...f, recipient_name: p.full_name || '', phone: p.phone || '', shipping_address: p.address || '' }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/orders/checkout', form);
      if (res.data?.success) {
        setSuccess(res.data.data);
      } else {
        alert(res.data?.message || 'Checkout gagal');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  const items = data?.cart?.items || [];
  const total = items.reduce((s, i) => s + (i.product?.base_price || 0) * i.quantity, 0);

  if (success) {
    return (
      <div className="container py-5">
        <div className="card-container text-center" style={{maxWidth:'500px',margin:'0 auto'}}>
          <i className="bi bi-check-circle-fill text-success" style={{fontSize:'4rem'}}></i>
          <h3 className="mt-3">Pesanan Berhasil!</h3>
          <p>Nomor pesanan: <strong>{success.order_number}</strong></p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Link to="/user/orders" className="btn btn-lensique">Lihat Pesanan</Link>
            <Link to="/katalog" className="btn btn-outline-secondary">Lanjut Belanja</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="section-heading"><h2><i className="bi bi-bag-check"></i> Checkout</h2><div className="heading-line"></div></div>
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card-container form-lensique">
              <h5 className="mb-3">Informasi Pengiriman</h5>
              <div className="mb-3"><label className="form-label">Nama Penerima</label>
                <input type="text" className="form-control" value={form.recipient_name} onChange={e => setForm({...form, recipient_name: e.target.value})} required /></div>
              <div className="mb-3"><label className="form-label">No. Telepon</label>
                <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div className="mb-3"><label className="form-label">Alamat Pengiriman</label>
                <textarea className="form-control" rows="3" value={form.shipping_address} onChange={e => setForm({...form, shipping_address: e.target.value})} required /></div>

              <h5 className="mb-3 mt-4">Metode Pembayaran</h5>
              {[
                { value: 'bank_transfer', label: 'Transfer Bank', icon: 'bi-bank', color: 'var(--baby-blue)' },
                { value: 'e_wallet', label: 'E-Wallet (OVO/GoPay/DANA)', icon: 'bi-wallet2', color: 'var(--soft-purple)' },
                { value: 'cod', label: 'COD (Bayar di Tempat)', icon: 'bi-cash-stack', color: 'var(--soft-pink)' },
              ].map(pm => (
                <div key={pm.value} className="form-check p-3 mb-2 rounded-3" style={{background: form.payment_method === pm.value ? pm.color : '#f8f9fa', cursor:'pointer'}}
                  onClick={() => setForm({...form, payment_method: pm.value})}>
                  <input className="form-check-input" type="radio" name="payment" value={pm.value} checked={form.payment_method === pm.value} onChange={() => {}} />
                  <label className="form-check-label"><i className={`bi ${pm.icon} me-2`}></i>{pm.label}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card-container">
              <h5 className="mb-3">Ringkasan Pesanan</h5>
              {items.map(item => (
                <div key={item.id} className="d-flex gap-2 border-bottom py-2">
                  <img src={getImageUrl(item.product?.image_url)} className="rounded-2" style={{width:'50px',height:'50px',objectFit:'cover'}} />
                  <div className="flex-grow-1"><small className="fw-bold d-block">{item.product?.name}</small>
                    <small className="text-muted">{item.quantity} x {formatRupiah(item.product?.base_price)}</small></div>
                  <small className="fw-bold">{formatRupiah((item.product?.base_price||0) * item.quantity)}</small>
                </div>
              ))}
              <div className="d-flex justify-content-between py-2 border-bottom mt-2"><span>Subtotal</span><span>{formatRupiah(total)}</span></div>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Ongkir</span><span className="text-success">Gratis</span></div>
              <div className="d-flex justify-content-between py-2"><strong>Total</strong><strong style={{color:'#C77986',fontSize:'1.2rem'}}>{formatRupiah(total)}</strong></div>
              <button type="submit" className="btn btn-lensique w-100 py-2 mt-3" disabled={submitting}>
                {submitting ? 'Memproses...' : <><i className="bi bi-check-circle"></i> Buat Pesanan</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
