import React, { useState, useCallback, useRef } from "react";
import HorizontalScroll from "./HorizontalScroll";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const OpsChat = () => {
  const [channels, setChannels] = useState({
    private: new Map(),
    public: [],
  });
  const [activeChannel, setActiveChannel] = useState("PUBLICCHANNEL");
  const [userDetail, setUserDetail] = useState({
    senderName: "",
    receiverName: "",
    isConnected: false,
    message: "",
  });
  const WS_URL = "http://localhost:8080/ws";
  const PUBLIC_CHANNEL = "/opschat/public";
  const PRIVATE_CHANNEL = `/user/${userDetail.senderName}/private`;
  const JOIN_MESSAGE = {
    senderName: userDetail.senderName,
    status: "JOIN",
  };
  const connectionClientRef = useRef(null);
  const containerRef = useRef(null);
  let scrollStep = 200;
  const handleScroll = (scrollOffset) => {
    containerRef.current.scrollLeft += scrollOffset;
  };

  const handleLeftButtonClick = () => {
    handleScroll(-scrollStep);
  };

  const handleRightButtonClick = () => {
    handleScroll(scrollStep);
  };

  const connect = () => {
    try {
      connectionClientRef.current = Stomp.over(new SockJS(WS_URL));
      connectionClientRef.current.connect(
        {},
        () => {
          setUserDetail((prevState) => ({ ...prevState, isConnected: true }));
          connectionClientRef.current.subscribe(
            PUBLIC_CHANNEL,
            handlePublicMessage
          );
          connectionClientRef.current.subscribe(
            PRIVATE_CHANNEL,
            handlePrivateMessage
          );
          connectionClientRef.current.send(
            "/app/public-message",
            {},
            JSON.stringify(JOIN_MESSAGE)
          );
        },
        (error) => {
          console.error("Connection error:", error);
        }
      );
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };
  const addUser = () => connect();
  const handlePublicMessage = ({ body }) => {
    const { status, senderName, ...rest } = JSON.parse(body);
    switch (status) {
      case "JOIN": {
        setChannels((prevState) => ({
          ...prevState,
          private: new Map([...prevState.private, [senderName, []]]),
        }));
        break;
      }
      case "MESSAGE": {
        setChannels((prevState) => ({
          ...prevState,
          public: [...prevState.public, { senderName, ...rest }],
        }));
        break;
      }
      default: {
        break;
      }
    }
  };
  const handlePrivateMessage = ({ body }) => {
    const { senderName, ...rest } = JSON.parse(body);
    setChannels((prevState) => ({
      ...prevState,
      private: new Map(prevState.private).set(senderName, [
        ...(prevState.private.get(senderName) || []),
        { senderName, ...rest },
      ]),
    }));
  };
  const sendMessage = ({ target: { value } }) => {
    setUserDetail((prevState) => ({ ...prevState, message: value }));
  };
  const sendPublicMessage = useCallback(() => {
    const { senderName, message } = userDetail;
    if (connectionClientRef.current) {
      let chatMessage = {
        senderName,
        message,
        status: "MESSAGE",
      };
      console.log(chatMessage);
      connectionClientRef.current.send(
        "/app/public-message",
        {},
        JSON.stringify(chatMessage)
      );
      setUserDetail((prevState) => ({ ...prevState, message: "" }));
    }
  }, [userDetail]);

  const sendPrivateMessage = useCallback(() => {
    const { senderName, message } = userDetail;
    if (connectionClientRef.current) {
      let chatMessage = {
        senderName,
        receiverName: activeChannel,
        message,
        status: "MESSAGE",
      };
      if (senderName !== activeChannel) {
        setChannels((prevState) => {
          const privateChannels = new Map(prevState.private);
          const list = privateChannels.get(activeChannel) || [];
          privateChannels.set(activeChannel, [...list, chatMessage]);
          return {
            ...prevState,
            private: privateChannels,
          };
        });
      }
      connectionClientRef.current.send(
        "/app/private-message",
        {},
        JSON.stringify(chatMessage)
      );
      setUserDetail((prevState) => ({ ...prevState, message: "" }));
    }
  }, [userDetail, setChannels, activeChannel]);

  const setUsername = (event) => {
    const { value } = event.target;
    setUserDetail((prevState) => ({ ...prevState, senderName: value }));
  };
  return (
    <div className="flex flex-col w-auto h-screen max-h-screen justify-center items-center text-xl">
      {userDetail.isConnected ? (
        <div className="flex flex-col w-1/3 h-screen border-8 border-gray-300">
          {/* Member List */}
          <div className="flex-none w-full border-b-2 border-gray-300">
            <div className="my-1 p-2 text-center text-gray-700">
              <div
                onClick={() => {
                  setActiveChannel("PUBLICCHANNEL");
                }}
                className={`px-4 py-3 border-2 border-gray-300 hover:bg-gray-200 ${
                  activeChannel === "PUBLICCHANNEL" ? "bg-gray-200" : ""
                } cursor-pointer`}
              >
                PUBLIC CHANNEL
              </div>
              <div className="flex flex-row w-full my-2 py-4 space-x-1">
                <button
                  onClick={handleLeftButtonClick}
                  className="p-4 font-bold border-2 border-gray-300"
                >
                  {"<"}
                </button>
                <div
                  ref={containerRef}
                  //style={{ overflowX: "auto", whiteSpace: "nowrap" }}
                  style={{
                    overflowX: "hidden",
                    whiteSpace: "nowrap",
                    width: "100%", // or any other value that fits your layout
                  }}
                  className="grow flex flex-row space-x-1 text-center whitespace-no-wrap snap-x snap-mandatory"
                >
                  {[...channels.private.keys()].map((name, index) => (
                    <div
                      onClick={() => {
                        setActiveChannel(name);
                      }}
                      className={`px-4 py-3 snap-start cursor-pointer border-2 border-gray-300 hover:bg-gray-200 ${
                        activeChannel === name ? "bg-gray-200" : ""
                      }`}
                      key={index}
                    >
                      {name}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRightButtonClick}
                  className="p-4 font-bold border-2 border-gray-300"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
          {/* Chat Content */}
          {activeChannel === "PUBLICCHANNEL" && (
            <div className="flex-1 flex flex-col relative w-full h-64">
              <div className="px-6 py-4 flex flex-col w-full h-full overflow-y-scroll">
                <ul className="space-y-6">
                  {channels.public.map((chat, index) => (
                    <li
                      className={`flex ${
                        chat.senderName === userDetail.senderName
                          ? "flex-row-reverse"
                          : ""
                      }`}
                      key={index}
                    >
                      {chat.senderName !== userDetail.senderName && (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                          {chat.senderName.charAt(0)}
                        </div>
                      )}
                      <div className="ml-3 flex flex-col">
                        <span
                          className={`font-semibold ${
                            chat.senderName === userDetail.senderName
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {chat.senderName}
                        </span>
                        <span
                          className={`text-lg ${
                            chat.senderName === userDetail.senderName
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {chat.message}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Send Message */}
              <div className="sticky bottom-0 border-t border-gray-300 p-4 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendPublicMessage();
                  }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    className="flex-1 rounded-full border-2 border-gray-300 py-2 px-4 mr-2"
                    placeholder="Enter the message"
                    value={userDetail.message}
                    onChange={sendMessage}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
          {activeChannel !== "PUBLICCHANNEL" && (
            <div className="flex-1 flex flex-col relative w-full h-64">
              <div className="px-6 py-4 flex flex-col w-full h-full overflow-y-scroll">
                <ul className="space-y-6">
                  {[...channels.private.get(activeChannel)].map(
                    (chat, index) => (
                      <li
                        className={`flex ${
                          chat.senderName === userDetail.senderName
                            ? "flex-row-reverse"
                            : ""
                        }`}
                        key={index}
                      >
                        {chat.senderName !== userDetail.senderName && (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                            {chat.senderName.charAt(0)}
                          </div>
                        )}
                        <div className="ml-3 flex flex-col">
                          <span
                            className={`font-semibold ${
                              chat.senderName === userDetail.senderName
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {chat.senderName}
                          </span>
                          <span
                            className={`text-base ${
                              chat.senderName === userDetail.senderName
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {chat.message}
                          </span>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
              {/* Send Message */}
              <div className="sticky bottom-0 border-t border-gray-300 p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendPrivateMessage();
                  }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    className="flex-1 rounded-full border-2 border-gray-300 py-2 px-4 mr-2"
                    placeholder="Enter the message"
                    value={userDetail.message}
                    onChange={sendMessage}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-1/3 h-screen items-center justify-center border-8 border-gray-300">
          <div className="flex flex-col p-8 border-4 border-gray-300 rounded-lg">
            <input
              id="user-name"
              placeholder="Enter your name"
              name="userName"
              value={userDetail.senderName}
              onChange={setUsername}
              className="mb-4 px-4 py-2 rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={addUser}
              className="p-6 text-center border-8 bg-blue-500 text-white rounded"
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpsChat;
