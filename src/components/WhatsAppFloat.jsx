import { motion } from 'framer-motion';

export default function WhatsAppFloat() {
  return (
    <motion.a
      href="https://wa.me/919902704361"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp +91 9902704361"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 18 }}
      whileHover={{ scale: 1.05 }}
      className="fixed bottom-5 right-5 lg:bottom-7 lg:right-7 z-40 inline-flex items-center gap-3 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg shadow-black/30 hover:shadow-xl transition-shadow font-medium text-sm"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.46 0 .12 5.34.12 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.91 11.91 0 005.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.93 0-3.19-1.24-6.18-3.45-8.42zM12.05 21.4h-.01a9.43 9.43 0 01-4.81-1.32l-.34-.2-3.72.97 1-3.62-.22-.37a9.45 9.45 0 01-1.44-5c0-5.22 4.25-9.47 9.48-9.47a9.42 9.42 0 016.7 2.78 9.43 9.43 0 012.77 6.7c0 5.22-4.26 9.53-9.41 9.53zm5.43-7.1c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.47 0 1.45 1.07 2.86 1.22 3.06.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
      </svg>
      <span className="hidden sm:inline">+91 9902704361</span>
    </motion.a>
  );
}
