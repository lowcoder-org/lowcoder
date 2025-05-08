// context/DeployModalContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { DeployableItem, BaseStats, DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import DeployItemModal from '../components/DeployItemModal';

interface DeployModalContextType {
  openDeployModal: <T extends DeployableItem, S extends BaseStats>(
    item: T,
    config: DeployableItemConfig<T, S>,
    sourceEnvironment: Environment,
    onSuccess?: () => void
  ) => void;
}

const DeployModalContext = createContext<DeployModalContextType | undefined>(undefined);

export const DeployModalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    visible: boolean;
    item: DeployableItem | null;
    config: DeployableItemConfig<any, any> | null;
    sourceEnvironment: Environment | null;
    onSuccess?: () => void;
  }>({
    visible: false,
    item: null,
    config: null,
    sourceEnvironment: null
  });
  
  const openDeployModal = <T extends DeployableItem, S extends BaseStats>(
    item: T,
    config: DeployableItemConfig<T, S>,
    sourceEnvironment: Environment,
    onSuccess?: () => void
  ) => {
    setModalState({
      visible: true,
      item,
      config,
      sourceEnvironment,
      onSuccess
    });
  };
  
  const closeDeployModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };
  
  return (
    <DeployModalContext.Provider value={{ openDeployModal }}>
      {children}
      
      {modalState.config && modalState.sourceEnvironment && (
        <DeployItemModal
          visible={modalState.visible}
          item={modalState.item}
          sourceEnvironment={modalState.sourceEnvironment}
          config={modalState.config}
          onClose={closeDeployModal}
          onSuccess={modalState.onSuccess}
        />
      )}
    </DeployModalContext.Provider>
  );
};

export const useDeployModal = () => {
  const context = useContext(DeployModalContext);
  if (context === undefined) {
    throw new Error('useDeployModal must be used within a DeployModalProvider');
  }
  return context;
};