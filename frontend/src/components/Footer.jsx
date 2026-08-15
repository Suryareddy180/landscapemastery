import React from 'react';

export default function Footer() {
  return (
    <footer class="w-full py-12 border-t border-outline-variant bg-surface">
      <div class="max-w-7xl mx-auto px-margin-mobile flex flex-col md:flex-row justify-between items-center gap-4">
        <span class="font-label-sm text-label-sm text-secondary">© 2024 Landscape Mastery. All Rights Reserved. Secure &amp; Encrypted.</span>
        <div class="flex gap-6">
          <a class="font-label-sm text-label-sm text-secondary hover:text-primary hover:underline transition-opacity" href="#">Privacy Policy</a>
          <a class="font-label-sm text-label-sm text-secondary hover:text-primary hover:underline transition-opacity" href="#">Terms of Access</a>
          <a class="font-label-sm text-label-sm text-secondary hover:text-primary hover:underline transition-opacity" href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}
