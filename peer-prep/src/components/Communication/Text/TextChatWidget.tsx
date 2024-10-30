import { Button, Group, Input, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import classes from "./TextChatWidget.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { socket } from "../../../websockets/communication/socket";

enum ChatState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

enum MessageState {
  SENDING,
  BEFORE_SEND,
}

type Message = {
  senderId: string;
  content: string | any;
  timestamp: Date;
};

type ChatRoomEnterExitEvent = {
  userId: string;
  timestamp: Date;
};

interface TextChatWidgetProps {
  roomId: string;
}
export default function TextChatWidget({ roomId }: TextChatWidgetProps) {
  const { user } = useAuth();

  const [messageState, setMessageState] = useState<MessageState>(
    MessageState.BEFORE_SEND
  );
  const [chatState, setChatState] = useState<ChatState>(ChatState.DISCONNECTED);

  const [socketUserId, setSocketUserId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const onConnectToChat = () => {
    if (chatState === ChatState.DISCONNECTED) {
      socket.connect();

      setChatState(ChatState.CONNECTING);
    } else {
      console.log("LOG: already connected!");
    }
  };
  const onJoinRoom = () => {
    if (roomId.trim() === "") return;
    console.log(`Room ID: ${roomId}`);

    socket.emit("joinRoom", roomId);
  };

  const onSetUsername = () => {
    socket.emit("set-details", {
      name: user.displayName,
      email: user.email,
    });
  };

  const onSendMessage = () => {
    if (chatState !== ChatState.CONNECTED) {
      return;
    }

    console.log("LOG: sending message");

    socket.emit("chat message", { roomId: roomId, message: draftMessage });
    setMessageState(MessageState.SENDING);
  };

  // register events when component is mounted, even though they're not active yet
  useEffect(() => {
    function onConnected() {
      console.log(`INFO: socket connected with id ${socket.id}!`);

      setChatState(ChatState.CONNECTED);
      setSocketUserId(socket.id);

      onJoinRoom();
      onSetUsername();
    }
    function onDisconnected() {
      console.log("INFO: socket disconnected!");
    }

    function onMessageSent() {
      console.log("INFO: Message received by server");

      setMessageState(MessageState.BEFORE_SEND);
      setDraftMessage("");
    }

    function onReceivedChatMessage(msg: Message) {
      console.log(`INFO: Received message`, msg);

      setMessages((prev) => [...prev, msg]);
    }

    function onUserJoinedChat(evt: ChatRoomEnterExitEvent) {
      console.log(`INFO: User { ${evt.userId} } joined the chat `);
    }

    function onUserLeftChat(evt: ChatRoomEnterExitEvent) {
      console.log(`INFO: User { ${evt.userId} } left the chat`);
    }

    socket.on("connect", onConnected);
    socket.on("disconnect", onDisconnected);
    socket.on("message-sent", onMessageSent);
    socket.on("chat-message", onReceivedChatMessage);
    socket.on("user-joined", onUserJoinedChat);

    return () => {
      socket.off("connect", onConnected);
      socket.off("disconnect", onDisconnected);
      socket.off("message-sent", onMessageSent);
      socket.off("chat-message", onReceivedChatMessage);
      socket.off("user-joined", onUserJoinedChat);
    };
  }, [roomId]);

  return (
    <>
      <Stack>
        <Button onClick={onConnectToChat}> Connect to chat server </Button>

        <Group>
          <Input
            id="msg"
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            disabled={messageState === MessageState.SENDING}
          />
          <Button
            onClick={onSendMessage}
            disabled={messageState === MessageState.SENDING}
          >
            {" "}
            send{" "}
          </Button>
        </Group>

        <Stack>
          {messages.map((msg, i) => (
            <Text key={i}> {msg.content} </Text>
          ))}
        </Stack>
      </Stack>
    </>
  );
}
