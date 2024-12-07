import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";


export interface EnterpriseReduxState {
    eeActive: boolean;
    remainingAPICalls: number;
    eeLicenses: Array<{
      uuid: string;
      issuedTo: string;
      apiCallsLimit: number;
    }>;
  }
  
  const initialState: EnterpriseReduxState = {
    eeActive: false,
    remainingAPICalls: 0,
    eeLicenses: [],
  };
  
  const enterpriseReducer = (state = initialState, action: ReduxAction<EnterpriseReduxState>): EnterpriseReduxState => {
    switch (action.type) {
      case ReduxActionTypes.SET_ENTERPRISE_LICENSE:
        return {
          ...state,
          ...action.payload,
        };
      default:
        return state;
    }
  };
  
  export default enterpriseReducer;
  
