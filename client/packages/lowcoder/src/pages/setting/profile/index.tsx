import { CustomModal } from "lowcoder-design";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserAction, profileSettingModalVisible } from "redux/reduxActions/userActions";
import { ProfileInfoCard } from "@lowcoder-ee/pages/setting/profile/profileInfoCard";
import { WindowMessageTypes } from "constants/messages";
import { isProfileSettingModalVisible } from "redux/selectors/usersSelectors";
import { trans } from "i18n";
import { messageInstance } from "lowcoder-design";

export default function ProfileSettingModal() {
  const visible = useSelector(isProfileSettingModalVisible);
  const dispatch = useDispatch();
  const [title, setTitle] = useState(trans("profile.personalInfo"));
  const [showBackLink, setShowBackLink] = useState(false);
  const [modalContent, setModalContent] = useState<JSX.Element>();
  const IndexContent = (
    <ProfileInfoCard
      setModalContent={setModalContent}
      setShowBackLink={setShowBackLink}
      setTitle={setTitle}
    />
  );
  const messageHandler = (e: MessageEvent) => {
    if (e.data.type !== WindowMessageTypes.THIRD_PARTY_BIND) {
      return;
    }
    if (e.data.success) {
      dispatch(fetchUserAction());
      messageInstance.info(trans("profile.bindingSuccess", { sourceName: e.data.sourceName }));
    } else {
      messageInstance.error(e.data.message);
      setModalContent(IndexContent);
    }
  };
  useEffect(() => {
    setModalContent(IndexContent);
    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  return (
    <CustomModal
      title={title}
      open={visible}
      onCancel={() => dispatch(profileSettingModalVisible(false))}
      showOkButton={false}
      showCancelButton={false}
      showBackLink={showBackLink}
      onBack={() => {
        setShowBackLink(false);
        setModalContent(IndexContent);
        setTitle(trans("profile.personalInfo"));
      }}
    >
      {modalContent}
    </CustomModal>
  );
}
