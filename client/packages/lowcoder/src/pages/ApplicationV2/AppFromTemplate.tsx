import ApplicationApi from "api/applicationApi";
import { useParams } from "react-router-dom";
import { validateResponse } from "api/apiUtils";
import history from "util/history";
import { APPLICATION_VIEW_URL, ALL_APPLICATIONS_URL } from "constants/routesURL";
import { WhiteLoading } from "lowcoder-design";
import React, { useEffect } from "react";
import { CommonTextLabel } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { ERROR_CODES } from "constants/apiConstants";
import { messageInstance } from "lowcoder-design";

const CreateDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 8px;
`;

export default function AppFromTemplate() {
  const templateId = useParams<any>().templateId;

  useEffect(() => {
    ApplicationApi.createFromTemplate(templateId)
      .then((resp) => {
        if (validateResponse(resp)) {
          history.replace(
            APPLICATION_VIEW_URL(resp.data.data.applicationInfoView.applicationId, "edit")
          );
        }
      })
      .catch((e) => {
        messageInstance.error(trans("home.importError", { message: e.message }));
        if (e.code !== ERROR_CODES.REQUEST_NOT_AUTHORISED) {
          history.replace(ALL_APPLICATIONS_URL);
        }
      });
  }, [templateId]);

  return (
    <CreateDiv>
      <WhiteLoading size={25} />
      <CommonTextLabel>{trans("createAppButton.creating")}</CommonTextLabel>
    </CreateDiv>
  );
}
