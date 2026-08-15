import React from 'react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton.jsx';

export default function LandingView({ onNavigate }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        {/* Hero Content Left */}
        <div className="md:col-span-7 flex flex-col justify-center gap-6">
          <motion.div variants={itemVariants} className="flex gap-3">
            <span className="bg-primary-container/10 border border-primary-container/20 text-primary-container font-label-sm px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Premium Curriculum
            </span>
            <span className="bg-primary-container/10 border border-primary-container/20 text-primary-container font-label-sm px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Lifetime Access
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="font-display-lg text-display-lg text-on-surface leading-tight">
            Master the Art of <br />
            <span className="text-primary-container bg-gradient-to-r from-primary-container to-surface-tint bg-clip-text text-transparent">
              Landscape Architecture
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
            Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery in creating serene, high-end environments.
          </motion.p>

          <motion.div variants={itemVariants} className="w-full h-64 md:h-96 mt-4 rounded-2xl overflow-hidden glass-card relative border border-white/60">
            <img 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuATILxMZcQpQj8DQNyGgJqGqiKJXNib95m_UGGyWj-vtAH3CzXFkiM_LCSVbc2IK33exJxELn2pOwyWyZuCO2xn1XmXrtjg575t2_yPNEcX98B97XXH0nHs_fAfVc79AWjdYvpxkBiSEy_czYZQlhVpXzUTgfkr3NjKILfkPj1F7SNI1h-izZRkDzET1z1lwsgoOrmTOtJCG7wq0LfobrM-rgeVHafa7IFAumVP-0CCL3neHmvAWsFyHA" 
              alt="Architectural landscape rendering"
            />
          </motion.div>
        </div>

        {/* Glassmorphic Checkout Card Right */}
        <motion.div variants={itemVariants} className="md:col-span-5 flex items-center justify-center mt-8 md:mt-0">
          <div className="glass-card rounded-2xl p-card-padding border border-white/80 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">Enroll Now</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">Begin your journey to professional mastery.</p>

            <form onSubmit={(e) => { e.preventDefault(); onNavigate('v3'); }}>
              {/* STRICT FORM: ONLY Email Address */}
              <div className="mb-6">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">
                  Email Address
                </label>
                <motion.input 
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="w-full input-field py-3 px-1 font-body-md text-body-md bg-transparent border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0" 
                  placeholder="architect@example.com" 
                  type="email"
                  required
                />
              </div>

              <div className="mb-8 p-4 bg-surface-container-low/70 backdrop-blur-sm rounded-xl border border-outline-variant/40 flex justify-between items-center">
                <div>
                  <span className="block font-body-md font-semibold text-on-surface">Lifetime Course Access</span>
                  <span className="font-label-sm text-on-surface-variant text-xs">Includes future updates</span>
                </div>
                <span className="font-headline-md text-headline-md font-bold text-primary-container">$499</span>
              </div>

              {/* Magnetic CTA Button */}
              <MagneticButton 
                type="submit" 
                className="w-full btn-primary py-4 rounded-xl font-body-lg text-body-lg font-semibold flex justify-center items-center gap-2 mb-6"
              >
                <span className="material-symbols-outlined text-xl">lock</span>
                Pay &amp; Unlock Access
              </MagneticButton>
            </form>

            {/* Subtle Trust Badges */}
            <div className="flex flex-col items-center gap-3 pt-2 border-t border-outline-variant/20">
              <div className="flex gap-5 text-outline-variant hover:text-outline transition-colors">
                <span className="material-symbols-outlined text-2xl" title="Bank Transfer Encrypted">account_balance</span>
                <span className="material-symbols-outlined text-2xl" title="Credit Card Protected">credit_card</span>
                <span className="material-symbols-outlined text-2xl" title="QR Instant Checkout">qr_code_scanner</span>
                <span className="material-symbols-outlined text-2xl" title="256-Bit SSL">verified_user</span>
              </div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest text-[10px]">
                Secured by Razorpay • 256-Bit Encryption
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
