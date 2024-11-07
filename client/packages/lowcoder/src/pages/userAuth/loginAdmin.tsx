import { trans } from "i18n";
import FormLogin from "@lowcoder-ee/pages/userAuth/formLoginAdmin";
import { AuthContainer } from "pages/userAuth/authComponents";
import { requiresUnAuth } from "pages/userAuth/authHOC";

// this is the classic Sign In for super admin
function LoginAdmin() {
  const loginHeading = trans("userAuth.userLogin");
  const loginSubHeading = trans("userAuth.poweredByLowcoder");

  return (
    <>
      <AuthContainer
        heading={loginHeading}
        subHeading={loginSubHeading}
      >
        <FormLogin />
      </AuthContainer>
    </>
  );
}

export default requiresUnAuth(LoginAdmin);
