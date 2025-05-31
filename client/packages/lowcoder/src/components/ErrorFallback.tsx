import { ExclamationCircleFilled, WarningFilled } from "@ant-design/icons";
import { ALL_APPLICATIONS_URL } from "@lowcoder-ee/constants/routesURL";
import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";
import { buildMaterialPreviewURL } from "@lowcoder-ee/util/materialUtils";
import Button from "antd/es/button";
import Flex from "antd/es/flex";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import history from "util/history";

const StyledFlex = styled(Flex)`
  height: 100vh;
  width: 300px;
  margin: 0 auto;
`;

const StyledErrorImage = styled.img`
  width: 300px;
`;

const StyledErrorIcon = styled(ExclamationCircleFilled)`
  svg {
    width: 80px;
    height: 80px;
    color: #ff4d4f;
  }
`;

const StyledErrorText = styled.h2`
  margin: 1rem 0;
  text-align: center;
`;

const DefaultErrorMessage = 'Something went wrong while displaying this webpage';

const ErrorFallback = (props: {
  errorMessage?: string,
}) => {
  const brandingSettings = useSelector(getBrandingSetting);

  const errorText = useMemo(() => {
    if (props.errorMessage) return props.errorMessage;
    if (brandingSettings?.config_set?.errorPageText) return brandingSettings?.config_set?.errorPageText;
    return DefaultErrorMessage;
  }, [props.errorMessage, brandingSettings?.config_set?.errorPageText]);
  
  const errorImage = useMemo(() => {
    const imageUrl = brandingSettings?.config_set?.errorPageImage || '';
    // if (Boolean(brandingSettings?.orgId)) {
    //   return buildMaterialPreviewURL(imageUrl);
    // }
    return imageUrl;
  }, [brandingSettings?.orgId, brandingSettings?.config_set?.errorPageImage]);

  return (

    <StyledFlex align="center" justify="center" vertical>
      {Boolean(errorImage)
        ? <StyledErrorImage src={errorImage} />
        : <StyledErrorIcon />
      }
      <StyledErrorText>{errorText}</StyledErrorText>
      <Button type="primary" onClick={() => history.push(ALL_APPLICATIONS_URL)}>
        Go to Apps
      </Button>
    </StyledFlex>
  )
}

export default ErrorFallback;