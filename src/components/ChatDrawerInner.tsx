import { ChatDrawerProps } from "@/types/ChatCrawertypes";
import { Loader, MessageSquare, Paperclip, Send, User, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "./ui/button";
const ChatDrawerInner: React.FC<ChatDrawerProps> = ({
  chatOpen,
  sellerName,
  sellerAvatarUrl,
  productTitle,
  messages,
  messagesRef,
  messageText,
  setMessageText,
  onSendMessage,
  onAttachFile,
  onClose,
  typingUsers,
  currentUserId,
  sending,
  attachmentUploading,
}) => {
  // debug mount/unmount (you can comment out later)
  useEffect(() => {
    // console.log("ChatDrawer mounted");
    return () => {
      // console.log("ChatDrawer unmounted");
    };
  }, []);

  if (!chatOpen) return null;

  const isTyping =
    Object.keys(typingUsers).filter((uid) => uid !== currentUserId).length > 0;

  return (
    <AnimatePresence>
      <motion.aside
        key="chat-drawer"
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        // STYLING: Improved drawer look
        className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-md dark:shadow-none bg-white dark:bg-slate-900">
          {/* Seller Avatar */}
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {sellerAvatarUrl ? (
              <img
                src={sellerAvatarUrl}
                alt={sellerName ?? "Seller"}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User size={20} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold truncate text-lg text-slate-900 dark:text-white">
              Chat with {sellerName ?? "Seller"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {productTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesRef}>
          {messages.length === 0 ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-12 animate-fadeIn">
              <MessageSquare className="h-6 w-6 mx-auto mb-2" />
              Start the conversation — say hi 👋
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  {/* STYLING: Enhanced message bubbles */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`max-w-[85%] p-3 text-sm rounded-t-xl shadow-md ${
                      mine
                        ? "bg-indigo-600 text-white rounded-bl-xl ml-4"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-br-xl mr-4"
                    }`}
                  >
                    {m.attachment_url ? (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`block mb-2 font-medium ${
                          mine
                            ? "text-indigo-200"
                            : "text-indigo-600 dark:text-indigo-400"
                        } hover:underline`}
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} /> Attachment
                        </div>
                      </a>
                    ) : null}
                    {m.content ? (
                      <div className="whitespace-pre-wrap leading-snug">
                        {m.content}
                      </div>
                    ) : null}
                    <div className="text-[10px] mt-1.5 opacity-70 text-right">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}{" "}
                      {mine && (m.read ? "✓✓" : "✓")}
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>

        {/* Typing Indicator */}
        <div className="px-4 py-2 min-h-[40px]">
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {attachmentUploading && (
            <div className="text-xs text-indigo-500 mb-2 flex items-center gap-2">
              <Loader className="h-3 w-3 animate-spin" /> Uploading
              attachment...
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Attach Button */}
            <label
              className={`inline-flex items-center p-2 rounded-xl transition-colors cursor-pointer ${
                attachmentUploading
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <input
                type="file"
                className="hidden"
                disabled={attachmentUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) return;
                  onAttachFile(f);
                  e.currentTarget.value = "";
                }}
              />
              <Paperclip
                size={20}
                className="text-slate-500 dark:text-slate-400"
              />
            </label>

            {/* Text Input */}
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (messageText.trim())
                    onSendMessage(messageText.trim(), null);
                }
              }}
              placeholder="Write a message..."
              // STYLING: Improved input focus
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 bg-transparent outline-none text-base focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />

            {/* Send Button */}
            <Button
              size="icon" // Use icon size for a rounded button
              className="h-11 w-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all"
              onClick={() => {
                if (messageText.trim()) onSendMessage(messageText.trim(), null);
              }}
              disabled={sending || attachmentUploading || !messageText.trim()}
            >
              <Send size={20} />
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Messages are stored securely. Please avoid sharing sensitive data.
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export const ChatDrawer = React.memo(ChatDrawerInner);
