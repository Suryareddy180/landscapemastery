import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../lib/data";
import * as Icons from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/products").then((res) => {
      if (res.products && res.products.length > 0) {
        const lmOnly = res.products.filter(
          (p) =>
            p.id === "landscape-mastery" ||
            p.product_id === "landscape-mastery" ||
            p.title?.toLowerCase().includes("landscape")
        );
        setProducts(lmOnly.length > 0 ? lmOnly : FALLBACK_PRODUCTS);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <section id="products" className="relative py-24 sm:py-32 bg-[var(--bg)]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="text-center mb-16 sm:mb-20">
          <div className="label text-accent mb-5">// Our Products</div>
          <h2 className="display-md max-w-2xl mx-auto">
            Explore our <span className="text-gradient">Featured Product</span>
          </h2>
          <p className="text-muted mt-5 max-w-xl mx-auto">
            Discover our flagship learning and knowledge platform engineered for architectural excellence and digital innovation.
          </p>
        </div>

        <div className={`grid gap-6 ${products.length === 1 ? "max-w-xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {products.map((product, i) => {
            const Icon = Icons[product.icon] || Icons.Code2;
            const productImage =
              product.image ||
              (product.product_id === "landscape-mastery" || product.id === "landscape-mastery"
                ? "/lm_logo.png"
                : null);

            return (
              <motion.div
                key={product.id || product.product_id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-3xl glass hover:bg-[var(--border)] transition-colors flex flex-col"
              >
                <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden p-2.5">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={`${product.title} Logo`}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  ) : (
                    <Icon size={24} />
                  )}
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{product.title}</h3>
                <p className="text-muted text-sm leading-relaxed flex-grow">
                  {product.desc}
                </p>
                {product.link && (
                  (product.id === "landscape-mastery" || product.product_id === "landscape-mastery") ? (
                    <Link
                      to="/landscapemastery"
                      aria-label={`Visit ${product.title} Platform`}
                      className="mt-6 inline-flex items-center text-sm font-medium text-accent hover:text-white transition-colors"
                    >
                      Explore Platform <Icons.ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${product.title} Website`}
                      className="mt-6 inline-flex items-center text-sm font-medium text-accent hover:text-white transition-colors"
                    >
                      Visit Website <Icons.ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
