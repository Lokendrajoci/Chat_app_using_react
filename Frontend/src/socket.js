import { io } from "socket.io-client";

let socket;

export const connectSocket = () => {
  console.log("Connecting to socket...");
  if (!socket) {
    // socket = io("http://localhost:3000"); // Replace with your server URL
    socket = io("https://chat-app-using-react-pzqj.onrender.com", {
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd",
      },
    });
  }
  return socket;
};

export default connectSocket;
