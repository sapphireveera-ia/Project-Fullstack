import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupiah } from '../utils/format';
import api, { getImageUrl } from '../services/api';
import Loading from '../components/common/Loading';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/keranjang').then(r => { if (r.data?.success) setCart(r.data.data); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    await api.put(`/keranjang/item/${itemId}`, { quantity: newQty });
    load();
  };

  const removeItem = async (itemId) => {
    await api.delete(`/keranjang/item/${itemId}`);
    load();
  };

  const clearCart = async () => {
    if (!confirm('Yakin ingin mengosongkan keranjang?')) return;
    await api.delete('/keranjang/clear');
    load();
  };

  if (loading) return <Loading />;
  const items = cart?.items || [];
  const total = items.reduce((s, i) => s + (i.product?.base_price || 0) * i.quantity, 0);

  return (
    <div className="container py-4">
      <div className="section-heading"><h2><i className="bi bi-cart3"></i> Keranjang Belanja</h2><div className="heading-line"></div></div>
      {items.length === 0 ? (
        <div className="empty-state"><i className="bi bi-cart-x"></i><h4>Keranjang Kosong</h4><p>Belum ada produk di keranjang</p>
          <Link to="/katalog" className="btn btn-lensique mt-2">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card-container">
              {items.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-3 border-bottom py-3">
                  <img src={getImageUrl(item.product?.image_url)} alt={item.product?.name}
                    className="rounded-3" style={{width:'80px',height:'80px',objectFit:'cover'}}
                    onError={e => {e.target.src='/img/no-image.svg'}} />
                  <div className="flex-grow-1">
                    <Link to={`/produk/${item.product_id}`} className="fw-bold text-decoration-none">{item.product?.name}</Link>
                    <p className="mb-0" style={{color:'#C77986',fontWeight:600}}>{formatRupiah(item.product?.base_price)}</p>
                  </div>
                  <div className="qty-control">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                    <input type="number" value={item.quantity} readOnly />
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="text-end" style={{minWidth:'100px'}}>
                    <strong>{formatRupiah((item.product?.base_price || 0) * item.quantity)}</strong>
                  </div>
                  <button className="btn btn-sm btn-outline-danger rounded-circle" onClick={() => removeItem(item.id)}><i className="bi bi-trash"></i></button>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-danger mt-3" onClick={clearCart}><i className="bi bi-trash3"></i> Kosongkan Keranjang</button>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card-container">
              <h5>Ringkasan</h5>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Total Item</span><span>{items.length}</span></div>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Total Harga</span><strong style={{color:'#C77986'}}>{formatRupiah(total)}</strong></div>
              <button className="btn btn-lensique w-100 mt-3 py-2" onClick={() => navigate('/checkout')}>
                <i className="bi bi-bag-check"></i> Checkout
              </button>
              <Link to="/katalog" className="btn btn-outline-secondary w-100 mt-2">Lanjut Belanja</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
