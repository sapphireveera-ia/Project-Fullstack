import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatRupiah, formatDate, getStatusInfo, getPaymentInfo } from '../utils/format';
import api, { getImageUrl } from '../services/api';
import Loading from '../components/common/Loading';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => {
      if (r.data?.success) setOrder(r.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!order) return <div className="container py-5"><div className="empty-state"><h4>Pesanan Tidak Ditemukan</h4></div></div>;

  const si = getStatusInfo(order.status || order.order_status);
  const pi = getPaymentInfo(order.payment?.payment_status || 'pending');
  const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStep = statusSteps.indexOf(order.status || order.order_status);

  return (
    <div className="container py-4">
      <Link to="/user/orders" className="btn btn-sm btn-outline-secondary rounded-pill mb-3"><i className="bi bi-arrow-left"></i> Kembali</Link>

      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <div><h3>Pesanan {order.order_number}</h3><p className="text-muted mb-0">{formatDate(order.created_at)}</p></div>
        <span className={`badge-status ${si.cls}`} style={{fontSize:'1rem',padding:'8px 20px'}}>{si.label}</span>
      </div>

      {/* Progress */}
      <div className="card-container mb-4">
        <div className="d-flex justify-content-between">
          {statusSteps.map((step, i) => (
            <div key={step} className="text-center flex-grow-1">
              <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{width:'40px',height:'40px',
                  background: i <= currentStep ? '#C77986' : '#eee',
                  color: i <= currentStep ? '#fff' : '#999', fontWeight:700}}>
                {i <= currentStep ? <i className="bi bi-check-lg"></i> : i + 1}
              </div>
              <small style={{color: i <= currentStep ? 'var(--dark-text)' : '#999'}}>{getStatusInfo(step).label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card-container">
            <h5 className="mb-3">Item Pesanan</h5>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Produk</th><th>Harga</th><th>Qty</th><th className="text-end">Subtotal</th></tr></thead>
                <tbody>
                  {(order.items || []).map(item => (
                    <tr key={item.id}>
                      <td><div className="d-flex align-items-center gap-2">
                        <img src={getImageUrl(item.product?.image_url || item.image_url)} className="rounded-2" style={{width:'40px',height:'40px',objectFit:'cover'}} />
                        <span>{item.product?.name || item.name}</span>
                      </div></td>
                      <td>{formatRupiah(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end fw-bold">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#fafafa'}}>
                    <td colSpan="3" className="text-end fw-bold">Total</td>
                    <td className="text-end fw-bold" style={{color:'#C77986',fontSize:'1.1rem'}}>{formatRupiah(order.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card-container mb-3">
            <h5 className="mb-3"><i className="bi bi-credit-card"></i> Pembayaran</h5>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Metode</span><span>{order.payment_method || '-'}</span></div>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Status</span><span className={`badge-status ${pi.cls}`}>{pi.label}</span></div>
          </div>
          <div className="card-container">
            <h5 className="mb-3"><i className="bi bi-truck"></i> Pengiriman</h5>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Kurir</span><span>{order.shipping?.courier || '-'}</span></div>
            <div className="d-flex justify-content-between py-1"><span className="text-muted">Resi</span><span>{order.shipping?.tracking_number || '-'}</span></div>
            <div className="py-1"><span className="text-muted d-block">Alamat</span><small>{order.shipping_address || '-'}</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
