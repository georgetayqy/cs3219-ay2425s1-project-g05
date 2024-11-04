// This component will be rendered when the user clicks on the "Video call" button.
// It will not be de-rendered until the user clicks on the "End call" button.

import { AspectRatio, Box, Button, Group } from "@mantine/core";

import classes from "./VideoChatWidget.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../../../websockets/communication/socket";
import { useAuth } from "../../../hooks/useAuth";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

type Offer = RTCSessionDescriptionInit;

export default function VideoChatWidget({
  roomId,
  onVideoCallDisconnect,
}: {
  roomId: string;
  onVideoCallDisconnect: () => void;
}) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(
    new MediaStream()
  );

  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callData, setCallData] = useState<any>(null);
  const [offerCandidates, setOfferCandidates] = useState<RTCIceCandidateInit[]>(
    []
  );
  const [answerCandidates, setAnswerCandidates] = useState<
    RTCIceCandidateInit[]
  >([]);

  // let pc = useMemo<RTCPeerConnection | null>(() => null, []);

  let pc = useRef<RTCPeerConnection | null>(null);

  // function onVideoCallDataReceived(data: any) {
  //   setCallData(data);
  // }

  function cleanup() {
    console.log("LOG(VIDEO): Cleaning up");

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socket.off("video-check", onVideoCheck);
    socket.off("video-answer");
    socket.off("video-offer-ice-candidate");
    socket.off("video-answer-ice-candidate");

    onVideoCallDisconnect();
  }

  async function init() {
    console.log("LOG: initializing!");

    if (!pc.current) pc.current = new RTCPeerConnection(servers);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("LOG: Got MediaStream:", stream);
    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

    // show stream in HTML video
    if (selfVideoRef.current) {
      selfVideoRef.current.srcObject = stream;
    }

    pc.current.ontrack = (event) => {
      console.log("LOG: ontrack event:", event);
      event.streams[0].getTracks().forEach((track) => {
        console.log("LOG: Adding track to remoteStream:", track);
        remoteStream?.addTrack(track);
      });
    };

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

    pc.current.onconnectionstatechange = (event) => {
      console.log("LOG: onconnectionstatechange event:", event);
      console.log(pc.current.connectionState);
      // alert(" break ! ");
      if (pc.current.connectionState === "connected") {
        console.log("LOG: Connected");
      }

      if (pc.current.connectionState === "disconnected") {
        // ps: I choose not to listen to video-cleanup event and instead clean up the event automatically.
        // this is better as in the case of no internet, the event will not be received
        socket.emit("video-cleanup", { roomId, selfId: user._id });
        // pc.current.restartIce();
        cleanup();
      }
    };

    socket.on("video-check", onVideoCheck);
  }
  useEffect(() => {
    // init();
    // return cleanup;
  }, []);

  useEffect(() => {
    // register the video-check event

    return () => {
      // unregister the video-check event
      socket.off("video-check");
      socket.off("video-answer");
      socket.off("video-offer-ice-candidate");
      socket.off("video-answer-ice-candidate");
    };
  }, []);

  async function onCallButtonPress() {
    // send video-check event to server to check if there is another user in the video call
    // NOTE:TODO: should not allow pressing after connected
    if (!pc.current) await init();
    console.log("LOG: emit { video-check }");
    socket.emit("video-check", { roomId });
  }

  async function onVideoCheck(data: null | { offer: Offer }) {
    console.log("LOG: receive { video-check } data:", data);
    if (data === null) {
      console.log("----------------- WE ARE THE CALLER -----------------");
      // we are the first person in the video call
      // no longer need to listen for video-check event
      socket.off("video-check", onVideoCheck); // precautionary measure only

      // create the offer
      const offerDescription = await pc.current.createOffer({
        iceRestart: true,
      });
      await pc.current.setLocalDescription(offerDescription);
      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      // send the offer to the server
      console.log("LOG: emit { video-offer }");
      socket.emit("video-offer", { offer, roomId });

      // create INTERNAL event listener for onicecandidate
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          offerCandidates.push(event.candidate.toJSON());

          setOfferCandidates((prev) => [...prev, event.candidate.toJSON()]);

          // send candidate to peer
          console.log(
            "LOG: emit { video-offer-ice-candidate } data: ",
            event.candidate.toJSON()
          );
          socket.emit("video-offer-ice-candidate", {
            candidate: event.candidate.toJSON(),
            roomId,
          });
        }
      };

      // create event listener for video-answer
      socket.on(
        "video-answer",
        (data: { answer: RTCSessionDescriptionInit }) => {
          console.log("LOG: receive { video-answer } data:", data);
          if (!pc.current.currentRemoteDescription && data.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current.setRemoteDescription(answerDescription);
          }
        }
      );

      // create event lsitener for video-answer-ice-candidate
      socket.on(
        "video-answer-ice-candidate",
        (data: { candidate: RTCIceCandidateInit }) => {
          console.log(
            "LOG: receive { video-answer-ice-candidate } data:",
            data
          );
          const candidate = new RTCIceCandidate(data.candidate);
          pc.current.addIceCandidate(candidate);
        }
      );
    } else {
      console.log("----------------- WE ARE THE ANSWERER -----------------");
      await pc.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      // send the answer to the server
      socket.emit("video-answer", { answer: answerDescription, roomId });

      // create INTERNAL event listener for onicecandidate
      pc.current.onicecandidate = (event) => {
        console.log("LOG: onicecandidate event:", event);
        if (event.candidate) {
          answerCandidates.push(event.candidate.toJSON());

          setAnswerCandidates((prev) => [...prev, event.candidate.toJSON()]);

          // send candidate to peer
          console.log(
            "LOG: emit { video-answer-ice-candidate } data:",
            event.candidate
          );
          socket.emit("video-answer-ice-candidate", {
            candidate: event.candidate.toJSON(),
            roomId,
          });
        }
      };

      // create event listener for video-offer-ice-candidate
      socket.on(
        "video-offer-ice-candidate",
        (data: { candidate: RTCIceCandidateInit }) => {
          console.log("LOG: receive { video-offer-ice-candidate } data:", data);
          const candidate = new RTCIceCandidate(data.candidate);
          pc.current.addIceCandidate(candidate);
        }
      );
    }
  }

  return (
    <Box className={classes.videoContainer}>
      {/* <h1>Video Chat Widget</h1> */}
      <Group>
        <Button onClick={onCallButtonPress}>Call</Button>
        <Button> Answer</Button>
      </Group>
      <AspectRatio ratio={1080 / 720} maw={300} mx="auto">
        <video ref={remoteVideoRef} autoPlay />
        <video ref={selfVideoRef} autoPlay />
      </AspectRatio>
    </Box>
  );
}
