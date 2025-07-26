'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
} from 'lucide-react';
import { VincularSocioDialog } from './VincularSocioDialog';
import toast from 'react-hot-toast';

interface AddRegisteredSocioButtonProps {
  onSocioAdded?: () => void;
  className?: string;
}

export const AddRegisteredSocioButton: React.FC<AddRegisteredSocioButtonProps> = ({
  onSocioAdded,
  className = "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
}) => {
  const [showVincularDialog, setShowVincularDialog] = useState(false);

  const handleSocioAdded = async () => {
    setShowVincularDialog(false);
    if (onSocioAdded) {
      await onSocioAdded();
    }
    toast.success('Socio vinculado exitosamente');
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowVincularDialog(true)}
        className={className}
      >
        <UserPlus className="w-4 h-4" />
        Vincular Socio Existente
      </motion.button>

      {/* Dialog de vinculación */}
      <VincularSocioDialog
        open={showVincularDialog}
        onClose={() => setShowVincularDialog(false)}
        onSuccess={handleSocioAdded}
      />
    </>
  );
};