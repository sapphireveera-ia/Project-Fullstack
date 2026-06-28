import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils/format';
import api, { getImageUrl } from '../services/api';
import Loading from '../components/common/Loading';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/wishlist').then(r => setItems(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (productId) => {
    await api.post('/wishlist/toggle', { product_id: productId });
    setItems(items.filter(i => i.product_id !== productId && i.id !== productId));
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      <div className="section-heading"><h2><i className="bi bi-heart"></i> Wishlist</h2><div className="heading-line"></div></div>
      {items.length === 0 ? (
        <div className="empty-state"><i className="bi bi-heart"></i><h4>Wishlist Kosong</h4>
          <p>Belum ada produk di wishlist kamu</p>
          <Link to="/katalog" className="btn btn-lensique mt-2">Jelajahi Katalog</Link>
        </div>
      ) : (
        <div className="row g-4">
          {items.map(item => {
            const p = item.product || item;
            return (
              <div key={item.id || p.id} className="col-6 col-md-4 col-lg-3">
                <div className="card card-product">
                  <Link to={`/produk/${p.id}`}><img src={getImageUrl(p.image_url)} className="card-img-top" alt={p.name} onError={e => {e.target.src='/img/no-image.svg'}} /></Link>
                  <div className="card-body">
                    <span className="badge-category">{p.category_name || 'Umum'}</span>
                    <h6 className="product-name mt-2">{p.name}</h6>
                    <p className="product-price mb-1">{formatRupiah(p.base_price)}</p>
                    <small className="product-stock">{p.stock > 0 ? <><i className="bi bi-check-circle text-success"></i> Stok: {p.stock}</> : <><i className="bi bi-x-circle text-danger"></i> Habis</>}</small>
                    <div className="mt-2 d-flex gap-2">
                      <Link to={`/produk/${p.id}`} className="btn btn-lensique btn-sm flex-grow-1"><i className="bi bi-eye"></i></Link>
                      <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => remove(p.id)}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
