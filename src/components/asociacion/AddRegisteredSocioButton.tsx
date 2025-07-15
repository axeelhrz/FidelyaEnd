'use client';

import React from 'react';
import { AddRegisteredSocioDialog } from './AddRegisteredSocioDialog';

interface AddRegisteredSocioButtonProps {
  onSocioAdded?: () => void;
  className?: string;
}

export const AddRegisteredSocioButton: React.FC<AddRegisteredSocioButtonProps> = ({
  onSocioAdded,
}) => {
  return (
    <AddRegisteredSocioDialog 
      onSocioAdded={onSocioAdded}
    />
  );
};