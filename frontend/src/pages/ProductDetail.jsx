import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDate } from '../utils/format';
import api, { getImageUrl } from '../services/api';
import Loading from '../components/common/Loading';

export default function ProductDetail() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/katalog/produk/${id}`).then(r => r.data?.data),
      api.get(`/products/${id}/reviews`).then(r => r.data?.data || []),
    ]).then(([prod, revs]) => {
      setProduct(prod);
      setReviews(revs);
      if (prod?.images?.length) setCurrentImg(0);
    }).catch(() => {}).finally(() => setLoading(false));

    if (isLoggedIn) {
      api.get(`/wishlist/check/${id}`).then(r => setWishlisted(!!r.data?.data?.in_wishlist)).catch(() => {});
    }
  }, [id, isLoggedIn]);

  const addToCart = async () => {
    try {
      await api.post('/keranjang/tambah', { product_id: parseInt(id), quantity: qty });
      alert('Produk ditambahkan ke keranjang!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan ke keranjang');
    }
  };

  const toggleWishlist = async () => {
    if (!isLoggedIn) return;
    try {
      await api.post('/wishlist/toggle', { product_id: parseInt(id) });
      setWishlisted(!wishlisted);
    } catch {}
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { product_id: parseInt(id), rating: reviewForm.rating, comment: reviewForm.comment });
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      // Reload reviews
      const r = await api.get(`/products/${id}/reviews`);
      setReviews(r.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim review');
    }
  };

  if (loading) return <Loading />;
  if (!product) return <div className="container py-5"><div className="empty-state"><i className="bi bi-box-seam"></i><h4>Produk Tidak Ditemukan</h4></div></div>;

  const images = product.images?.length ? product.images : [{ image_url: product.image_url }];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
        <li className="breadcrumb-item"><Link to="/katalog">Katalog</Link></li>
        <li className="breadcrumb-item active">{product.name}</li>
      </ol></nav>

      <div className="row g-4">
        {/* Images */}
        <div className="col-md-6">
          <div className="card-container text-center">
            <img src={getImageUrl(images[currentImg]?.image_url)} alt={product.name}
              className="img-fluid rounded-3 mb-3" style={{maxHeight:'400px',objectFit:'cover'}}
              onError={e => { e.target.src='/img/no-image.svg'; }} />
            {images.length > 1 && (
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                {images.map((img, i) => (
                  <img key={i} src={getImageUrl(img.image_url)} alt="" className="rounded-2"
                    style={{width:'60px',height:'60px',objectFit:'cover',cursor:'pointer',border: i===currentImg ? '3px solid #C77986' : '3px solid transparent'}}
                    onClick={() => setCurrentImg(i)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="col-md-6">
          <span className="badge-category" style={{background:'var(--soft-purple)',padding:'4px 12px',borderRadius:'12px',fontWeight:500}}>
            {product.category_name || 'Umum'}
          </span>
          <h2 className="mt-2 fw-bold">{product.name}</h2>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span style={{fontSize:'1.5rem',fontWeight:700,color:'#C77986'}}>{formatRupiah(product.base_price)}</span>
            <span className="text-muted">
              <i className="bi bi-star-fill text-warning"></i> {avgRating} ({reviews.length} review)
            </span>
          </div>
          <p className="text-muted">{product.description || 'Tidak ada deskripsi.'}</p>
          <div className="mb-3">
            {product.stock > 0
              ? <span className="text-success"><i className="bi bi-check-circle"></i> Stok tersedia ({product.stock})</span>
              : <span className="text-danger"><i className="bi bi-x-circle"></i> Stok habis</span>}
          </div>

          {product.stock > 0 && (
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="qty-control">
                <button onClick={() => setQty(Math.max(1, qty-1))}>-</button>
                <input type="number" value={qty} onChange={e => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value)||1)))} />
                <button onClick={() => setQty(Math.min(product.stock, qty+1))}>+</button>
              </div>
              <button className="btn btn-lensique flex-grow-1" onClick={addToCart} disabled={!isLoggedIn}>
                <i className="bi bi-cart-plus"></i> Tambah ke Keranjang
              </button>
              {isLoggedIn && (
                <button className={`btn-wishlist ${wishlisted ? 'active' : ''}`} onClick={toggleWishlist} style={{fontSize:'1.5rem'}}>
                  <i className={`bi ${wishlisted ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="card-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Review Produk</h4>
          {isLoggedIn && <button className="btn btn-lensique btn-sm" onClick={() => setShowReviewModal(true)}>
            <i className="bi bi-pencil"></i> Tulis Review
          </button>}
        </div>

        {reviews.length > 0 ? reviews.map(r => (
          <div key={r.id} className="border-bottom py-3">
            <div className="d-flex justify-content-between">
              <div>
                <strong>{r.username || 'User'}</strong>
                <span className="ms-2 text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
              </div>
              <small className="text-muted">{formatDate(r.created_at)}</small>
            </div>
            <p className="mb-0 mt-1">{r.comment}</p>
          </div>
        )) : <p className="text-muted text-center py-3">Belum ada review untuk produk ini.</p>}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card-container" style={{maxWidth:'500px',width:'90%'}}>
            <h4>Tulis Review</h4>
            <form onSubmit={submitReview}>
              <div className="mb-3">
                <label className="form-label">Rating</label>
                <div className="d-flex gap-1" style={{fontSize:'2rem',cursor:'pointer'}}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={() => setReviewForm({...reviewForm, rating: s})}
                      style={{color: s <= reviewForm.rating ? '#F1C40F' : '#DDD'}}>★</span>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Komentar</label>
                <textarea className="form-control" rows="3" value={reviewForm.comment}
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required />
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={() => setShowReviewModal(false)}>Batal</button>
                <button type="submit" className="btn btn-lensique flex-grow-1">Kirim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
