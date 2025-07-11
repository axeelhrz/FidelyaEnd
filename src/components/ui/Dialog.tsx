'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children, className }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  <div className={cn("pb-4", className)}>
    {children}
  </div>
);

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={cn("text-xl font-semibold text-gray-900", className)}>
    {children}
  </h2>
);

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={cn("flex gap-3 pt-4", className)}>
    {children}
  </div>
);
