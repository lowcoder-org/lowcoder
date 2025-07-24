import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchBrandingSetting, fetchEnterpriseLicense, fetchEnvironments } from 'redux/reduxActions/enterpriseActions';
import { selectEnterpriseEditionStatus } from '@lowcoder-ee/redux/selectors/enterpriseSelectors';
import { useDispatch, useSelector } from 'react-redux';
import { isEEEnvironment } from "util/envUtils";
import { getUser } from '@lowcoder-ee/redux/selectors/usersSelectors';

interface EnterpriseContextValue {
    isEnterpriseActive: boolean;
}

const EnterpriseContext = createContext<EnterpriseContextValue>({ isEnterpriseActive: false });

type ProviderProps = {
    children: React.ReactNode;
}

export const EnterpriseProvider: React.FC<ProviderProps> = ({ children }) => {
    const dispatch = useDispatch();
    const isEnterpriseActiveRedux = useSelector(selectEnterpriseEditionStatus); // From Redux store
    const [isEnterpriseActive, setIsEnterpriseActive] = useState(false);
    const user = useSelector(getUser);
  
    useEffect(() => {
      if (isEEEnvironment()) {
        // Fetch the enterprise license only if we're in an EE environment
        dispatch(fetchEnterpriseLicense());
        dispatch(fetchEnvironments());
      } else {
        // Set the state to false for non-EE environments
        // setEEActiveState(false);
        setIsEnterpriseActive(false);
      }
    }, [dispatch]);
  
    useEffect(() => {
      if (isEEEnvironment()) {
        // Update the global EE state based on Redux
        // setEEActiveState(isEnterpriseActiveRedux);
        setIsEnterpriseActive(isEnterpriseActiveRedux);
      }
    }, [isEnterpriseActiveRedux]);

    useEffect(() => {
      if (isEEEnvironment()) {
        dispatch(fetchBrandingSetting({ orgId: user.currentOrgId, fallbackToGlobal: true }))
      }
    }, [dispatch, user.currentOrgId]);
  
    return (
      <EnterpriseContext.Provider value={{ isEnterpriseActive }}>
        {children}
      </EnterpriseContext.Provider>
    );
  };
  
  export const useEnterpriseContext = () => useContext(EnterpriseContext);
