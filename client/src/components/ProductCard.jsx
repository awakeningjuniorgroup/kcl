import React, { useContext } from "react";
import { Link, redirect, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";

const ProductCard = ({ product }) => {
  const { currency, addToCart, t } = useContext(AppContext);
  const navigate = useNavigate();

  if (!product) return null;

  const discount = product.offerPrice
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : 0;

  const currentPrice = product.offerPrice || product.price;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    await addToCart(product._id, product.variants?.[0]?.weight || null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Link to={`/product/${product._id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
              -{discount}%
            </div>
          )}

          {/* Image */}
          <img
            src={
              Array.isArray(product.image) ? product.image[0] : product.image
            }
            alt={product.name}
            className="w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
          />

          {/* Overlay with Quick Actions (Desktop) */}
          <div className="absolute inset-x-4 bottom-4 translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300 z-20 hidden md:block">
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-white/90 backdrop-blur-md text-gray-900 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-[#4A76AC] hover:text-white transition-colors"
            >
              <ShoppingCart size={16} /> {t.cartActions.addToCart}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 px-2">
          <h3 className="font-bold text-gray-800 text-sm truncate">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < 4 ? "currentColor" : "none"}
                  className={i < 4 ? "text-[#4A76AC]" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">(45)</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-black text-gray-900">
              {currentPrice}
              {currency}
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through decoration-red-400 decoration-2">
                {product.price}
                {currency}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile Quick Add */}
      <button
        onClick={handleAddToCart}
        className="md:hidden absolute bottom-[88px] right-3 bg-green-600 text-white p-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
      >
        <ShoppingCart size={18} />
      </button>
    </motion.div>
  );
};

export default ProductCard;