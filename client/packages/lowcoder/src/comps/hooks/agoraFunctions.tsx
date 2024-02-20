import { useEffect, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng"; // Update the import with correct types
import { v4 as uuidv4 } from "uuid";

const useAgora = () => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack | null>(
    null
  );
  const [videoTrack, setVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [videoHeight, setHeight] = useState(200);
  const [videoWidth, setWidth] = useState(200);

  const initializeAgora = () => {
    const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(agoraClient);
  };

  const turnOnCamera = async (flag: any) => {
    if (videoTrack) {
      return videoTrack.setEnabled(flag);
    }
    const newVideoTrack = await AgoraRTC.createCameraVideoTrack();
    newVideoTrack.play("camera-video");
    setVideoTrack(newVideoTrack);
  };

  const turnOnMicrophone = async (flag: any) => {
    if (audioTrack) {
      return audioTrack.setEnabled(flag);
    }
    const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    newAudioTrack.play();
    setAudioTrack(newAudioTrack);
  };

  const leaveChannel = async () => {
    if (isJoined) {
      if (!client) {
        console.error("Agora client is not initialized");
        return;
      }

      if (!client.localTracks.length) {
        console.error("No local tracks to unpublish");
        return;
      }

      if (videoTrack) {
        await turnOnCamera(false);
        await client.unpublish(videoTrack);
        videoTrack.stop();
        setVideoTrack(null);
      }

      if (audioTrack) {
        await turnOnMicrophone(false);
        await client.unpublish(audioTrack);
        audioTrack.stop();
        setAudioTrack(null);
      }

      await client.leave();
      setIsJoined(false);
    }
  };

  const joinChannel = async (appId: any, channel: any, token: any) => {
    if (!channel) {
      channel = "react-room";
    }

    if (isJoined) {
      await leaveChannel();
    }

    client?.on("user-published", onUserPublish);

    await client?.join(appId, channel, token || null, uuidv4());
    setIsJoined(true);
  };

  const publishVideo = async (appId: any, channel: any) => {
    await turnOnCamera(true);

    if (!isJoined) {
      await joinChannel(appId, channel, null);
    }

    await client?.publish(videoTrack!);

    const mediaStreamTrack = videoTrack?.getMediaStreamTrack();

    if (mediaStreamTrack) {
      const videoSettings = mediaStreamTrack.getSettings();
      const videoWidth = videoSettings.width;
      const videoHeight = videoSettings.height;
      setWidth(videoWidth!);
      setHeight(videoHeight!);
      // console.log(`Video width: ${videoWidth}px, height: ${videoHeight}px`);
    } else {
      console.error("Media stream track not found");
    }
  };

  const onUserPublish = async (
    user: IAgoraRTCRemoteUser,
    mediaType: string
  ) => {
    if (mediaType === "video") {
      const remoteTrack = await client?.subscribe(user, mediaType);
      remoteTrack?.play("remote-video");
    }
    if (mediaType === "audio") {
      const remoteTrack = await client?.subscribe(user, mediaType);
      remoteTrack?.play();
    }
  };

  return {
    client,
    audioTrack,
    videoTrack,
    isJoined,
    turnOnCamera,
    turnOnMicrophone,
    leaveChannel,
    joinChannel,
    publishVideo,
    initializeAgora,
    videoWidth,
    videoHeight,
    setHeight,
    setWidth,
  };
};

export default useAgora;
