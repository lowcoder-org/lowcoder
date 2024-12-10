import { call, put, takeLatest } from 'redux-saga/effects';
import { ReduxActionTypes } from "constants/reduxActionConstants";
import { setEnterpriseLicense } from "redux/reduxActions/enterpriseActions";
import { getEnterpriseLicense } from "api/enterpriseApi";

// Define the type of data returned by the API
interface EnterpriseLicenseResponse {
    eeActive: boolean;
    remainingAPICalls: number;
    eeLicenses: Array<{
        uuid: string;
        issuedTo: string;
        apiCallsLimit: number;
    }>;
}

function* fetchEnterpriseLicenseSaga(): Generator<any, void, EnterpriseLicenseResponse> {
    try {
        // Type the result from the API call
        const data: EnterpriseLicenseResponse = yield call(getEnterpriseLicense);
        yield put(setEnterpriseLicense(data));
    } catch (error) {
        console.error('Failed to fetch enterprise license:', error);
    }
}

export default function* enterpriseSagas() {
    yield takeLatest(ReduxActionTypes.FETCH_ENTERPRISE_LICENSE, fetchEnterpriseLicenseSaga);
}
