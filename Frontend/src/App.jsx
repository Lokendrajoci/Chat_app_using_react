import { useState, useEffect, useRef } from "react";
import connectSocket from "./socket";
import { Send, ImageIcon, X, Download, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmojiPicker from "emoji-picker-react";

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isNameSet, setIsNameSet] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalImage, setCurrentModalImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const socket = connectSocket();

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetName = () => {
    if (username.trim()) {
      setIsNameSet(true);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: `${username} has joined the chat!`,
          sender: "System",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() || selectedImage) {
      const msgData = {
        text: message,
        sender: username,
        timestamp: new Date(),
        image: imagePreview,
      };

      socket.emit("send_message", msgData);
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setEmoji(false); // Hide emoji picker after selection
  };

  const handleEmojiClick = () => setEmoji(!emoji);

  const handleImageClick = () => fileInputRef.current.click();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openImageModal = (imageSrc) => {
    setCurrentModalImage(imageSrc);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setCurrentModalImage(null);
  };

  const downloadImage = (imageSrc) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `chat-image-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold text-white mb-6 flex items-center">
          L-Chat
          <span className="ml-2 animate-bounce">💬</span>
        </h1>

        <Card className="w-full shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="text-center">
              {isNameSet ? `Welcome, ${username}!` : "Join the conversation"}
            </CardTitle>
          </CardHeader>

          {!isNameSet ? (
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-gray-500">
                  Please set your name to continue
                </p>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Set your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === "Enter" && handleSetName()}
                  />
                  <Button onClick={handleSetName}>Join</Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-4 flex flex-col h-[60vh] sm:h-[50vh]">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.map((msg, index) => {
                  // Determine if this message is from the current user
                  const isCurrentUser = msg.sender === username;
                  const isSystem = msg.sender === "System";

                  return (
                    <div key={index} className="w-full">
                      {isSystem ? (
                        // System message (centered)
                        <div className="flex justify-center">
                          <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg max-w-[80%] text-center">
                            <p>{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // User messages (left for others, right for current user)
                        <div
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
                              isCurrentUser
                                ? "bg-purple-600 text-white rounded-tr-none" // Your messages (right side)
                                : "bg-gray-100 text-gray-800 rounded-tl-none" // Others' messages (left side)
                            }`}
                          >
                            {/* Show sender name for received messages */}
                            {!isCurrentUser && !isSystem && (
                              <p className="text-xs font-semibold text-purple-600 mb-1">
                                {msg.sender}
                              </p>
                            )}

                            {/* Image if present */}
                            {msg.image && (
                              <div className="mb-2">
                                <div className="relative group">
                                  <img
                                    src={msg.image}
                                    alt="Shared image"
                                    className="max-w-full h-auto rounded-md cursor-pointer hover:opacity-90"
                                    onClick={() => openImageModal(msg.image)}
                                  />
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImage(msg.image);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Message text */}
                            {msg.text && <p>{msg.text}</p>}

                            {/* Timestamp */}
                            <p className="text-xs opacity-70 text-right mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {imagePreview && (
                <div className="relative mb-2 inline-block">
                  <img
                    src={imagePreview}
                    alt="Selected image"
                    className="max-h-24 rounded-md border border-gray-300 cursor-pointer"
                    onClick={() => openImageModal(imagePreview)}
                  />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex space-x-2 relative">
                <Input
                  type="text"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  onClick={handleImageClick}
                  size="icon"
                  variant="outline"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleEmojiClick}
                  size="icon"
                  variant="outline"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                {emoji && (
                  <div className="absolute right-0 bottom-12 z-10">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {isModalOpen && currentModalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white p-4 rounded-lg max-w-4xl w-full">
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center">
              <img
                src={currentModalImage}
                alt="Full preview"
                className="max-w-full max-h-[70vh] rounded-md object-contain"
              />
              <Button
                onClick={() => downloadImage(currentModalImage)}
                className="mt-4"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" /> Download Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
