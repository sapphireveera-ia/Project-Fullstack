import { Link } from 'react-router-dom';
import { formatRupiah } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api, { getImageUrl } from '../../services/api';
import { useState } from 'react';

export default function ProductCard({ product, onWishlistChange }) {
  const { isLoggedIn } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    try {
      await api.post('/wishlist/toggle', { product_id: product.id });
      setWishlisted(!wishlisted);
      onWishlistChange?.();
    } catch {}
  };

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    try {
      await api.post('/keranjang/tambah', { product_id: product.id, quantity: 1 });
      alert('Produk ditambahkan ke keranjang!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan ke keranjang');
    }
  };

  return (
    <div className="card card-product">
      <Link to={`/produk/${product.id}`}>
        <img
          src={getImageUrl(product.image_url)}
          className="card-img-top"
          alt={product.name}
          onError={(e) => { e.target.src = '/img/no-image.svg'; }}
        />
      </Link>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <span className="badge-category">{product.category_name || 'Umum'}</span>
          {isLoggedIn && (
            <button className={`btn-wishlist ${wishlisted ? 'active' : ''}`} onClick={toggleWishlist}>
              <i className={`bi ${wishlisted ? 'bi-heart-fill' : 'bi-heart'}`}></i>
            </button>
          )}
        </div>
        <Link to={`/produk/${product.id}`} className="text-decoration-none">
          <h6 className="product-name mt-2">{product.name}</h6>
        </Link>
        <p className="product-price mb-1">{formatRupiah(product.base_price)}</p>
        <small className="product-stock">
          {product.stock > 0
            ? <><i className="bi bi-check-circle text-success"></i> Stok: {product.stock}</>
            : <><i className="bi bi-x-circle text-danger"></i> Habis</>
          }
        </small>
        <div className="mt-2">
          {product.stock > 0 && isLoggedIn ? (
            <button className="btn btn-lensique btn-sm w-100" onClick={addToCart}>
              <i className="bi bi-cart-plus"></i> Tambah
            </button>
          ) : (
            <Link to={`/produk/${product.id}`} className="btn btn-lensique btn-sm w-100">
              <i className="bi bi-eye"></i> Detail
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
