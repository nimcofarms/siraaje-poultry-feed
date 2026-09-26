"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Message = {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: UserInfo;
  receiver: UserInfo;
};

type Conversation = {
  user: UserInfo;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  totalMessages: number;
};

type MessagesResponse = {
  currentUser: UserInfo;
  employees: UserInfo[];
  conversations: Conversation[];
  unreadCount: number;
};

export default function MessagesPage() {
  const [data, setData] = useState<MessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMessageMode, setNewMessageMode] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [receiverId, setReceiverId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/messages", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load messages."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load messages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const selectedConversation = useMemo(() => {
    if (!data || !selectedUserId) {
      return null;
    }

    return (
      data.conversations.find(
        (conversation) =>
          conversation.user.id === selectedUserId
      ) ?? null
    );
  }, [data, selectedUserId]);

  const selectedEmployee = useMemo(() => {
    if (!data || !selectedUserId) {
      return null;
    }

    return (
      data.employees.find(
        (employee) => employee.id === selectedUserId
      ) ?? null
    );
  }, [data, selectedUserId]);

  const activeChatUser =
    selectedConversation?.user ?? selectedEmployee ?? null;

  const filteredConversations = useMemo(() => {
    if (!data) {
      return [];
    }

    const search = searchText.trim().toLowerCase();

    if (!search) {
      return data.conversations;
    }

    return data.conversations.filter((conversation) => {
      return (
        conversation.user.name.toLowerCase().includes(search) ||
        conversation.user.email.toLowerCase().includes(search) ||
        conversation.lastMessage.message
          .toLowerCase()
          .includes(search)
      );
    });
  }, [data, searchText]);

  useEffect(() => {
    if (!selectedUserId || newMessageMode) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    selectedUserId,
    selectedConversation?.messages.length,
    newMessageMode,
  ]);

  function formatDate(date: string) {
    const messageDate = new Date(date);
    const today = new Date();

    const sameDay =
      messageDate.getFullYear() === today.getFullYear() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getDate() === today.getDate();

    if (sameDay) {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(messageDate);
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(messageDate);
  }

  function formatFullDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getInitial(name: string) {
    const trimmed = name.trim();

    if (!trimmed) {
      return "?";
    }

    return trimmed.charAt(0).toUpperCase();
  }

  async function openConversation(userId: string) {
    setSelectedUserId(userId);
    setReceiverId(userId);
    setNewMessageMode(false);
    setMessageText("");
    setSuccess("");
    setError("");

    const conversation = data?.conversations.find(
      (item) => item.user.id === userId
    );

    if (!conversation || conversation.unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch("/api/messages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to mark conversation as read."
        );
      }

      setData((current) => {
        if (!current) {
          return current;
        }

        const amountRead = conversation.unreadCount;

        return {
          ...current,
          unreadCount: Math.max(
            0,
            current.unreadCount - amountRead
          ),
          conversations: current.conversations.map((item) => {
            if (item.user.id !== userId) {
              return item;
            }

            return {
              ...item,
              unreadCount: 0,
              messages: item.messages.map((message) => {
                if (
                  message.senderId === userId &&
                  message.receiverId === current.currentUser.id &&
                  !message.isRead
                ) {
                  return {
                    ...message,
                    isRead: true,
                  };
                }

                return message;
              }),
              lastMessage: {
                ...item.lastMessage,
                isRead:
                  item.lastMessage.senderId === userId &&
                  item.lastMessage.receiverId ===
                    current.currentUser.id
                    ? true
                    : item.lastMessage.isRead,
              },
            };
          }),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark conversation as read."
      );
    }
  }

  function openNewMessage() {
    setNewMessageMode(true);
    setSelectedUserId("");
    setReceiverId("");
    setMessageText("");
    setError("");
    setSuccess("");
  }

  function cancelNewMessage() {
    setNewMessageMode(false);
    setReceiverId("");
    setMessageText("");
    setError("");
    setSuccess("");
  }

  function chooseNewMessageEmployee(userId: string) {
    const existingConversation = data?.conversations.find(
      (conversation) => conversation.user.id === userId
    );

    if (existingConversation) {
      openConversation(userId);
      return;
    }

    setSelectedUserId(userId);
    setReceiverId(userId);
    setNewMessageMode(false);
    setMessageText("");
    setError("");
    setSuccess("");
  }

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!receiverId) {
      setError("Please select an employee.");
      return;
    }

    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      setError("Please write a message.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId,
          message: cleanMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to send message."
        );
      }

      const userId = receiverId;

      setMessageText("");
      setNewMessageMode(false);
      setSelectedUserId(userId);
      setReceiverId(userId);

      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(messageId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/messages?id=${encodeURIComponent(messageId)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete message."
        );
      }

      await loadMessages();

      setSuccess("Message deleted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete message."
      );
    } finally {
      setDeletingId("");
    }
  }

  const conversations = data?.conversations ?? [];
  const employees = data?.employees ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-emerald-400">
              Siraaje Poultry Feed
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">
                Messages / Farriimaha
              </h1>

              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Internal conversations between employees.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-700"
          >
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          {loading ? (
            <div className="flex min-h-[650px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

                <p className="text-slate-400">
                  Loading conversations...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[680px] lg:grid-cols-[360px_1fr]">
              <aside className="border-b border-slate-800 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-800 p-4">
                  <button
                    type="button"
                    onClick={openNewMessage}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-500"
                  >
                    + New Message / Farriin Cusub
                  </button>

                  <div className="relative mt-4">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) =>
                        setSearchText(event.target.value)
                      }
                      placeholder="Search conversations..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      🔍
                    </span>
                  </div>
                </div>

                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">
                      Conversations / Wadahadallada
                    </p>

                    <span className="text-xs text-slate-500">
                      {conversations.length}
                    </span>
                  </div>
                </div>

                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mb-3 text-4xl">
                      💬
                    </div>

                    <h3 className="font-bold">
                      No conversations
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Start a new conversation with an employee.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[555px] overflow-y-auto">
                    {filteredConversations.map(
                      (conversation) => {
                        const selected =
                          selectedUserId ===
                            conversation.user.id &&
                          !newMessageMode;

                        const lastMessageFromMe =
                          conversation.lastMessage.senderId ===
                          data?.currentUser.id;

                        return (
                          <button
                            key={conversation.user.id}
                            type="button"
                            onClick={() =>
                              openConversation(
                                conversation.user.id
                              )
                            }
                            className={`flex w-full gap-3 border-b border-slate-800 p-4 text-left transition ${
                              selected
                                ? "bg-slate-800"
                                : conversation.unreadCount > 0
                                  ? "bg-emerald-950/20 hover:bg-slate-800/80"
                                  : "hover:bg-slate-800/70"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-emerald-400">
                                {getInitial(
                                  conversation.user.name
                                )}
                              </div>

                              {conversation.unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`truncate ${
                                    conversation.unreadCount > 0
                                      ? "font-bold text-white"
                                      : "font-semibold text-slate-300"
                                  }`}
                                >
                                  {conversation.user.name}
                                </p>

                                <span
                                  className={`shrink-0 text-[11px] ${
                                    conversation.unreadCount > 0
                                      ? "font-semibold text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {formatDate(
                                    conversation.lastMessage
                                      .createdAt
                                  )}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-1">
                                {lastMessageFromMe && (
                                  <span className="shrink-0 text-xs text-slate-500">
                                    You:
                                  </span>
                                )}

                                <p
                                  className={`truncate text-sm ${
                                    conversation.unreadCount > 0
                                      ? "font-medium text-slate-200"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {
                                    conversation.lastMessage
                                      .message
                                  }
                                </p>
                              </div>

                              <p className="mt-1 text-[11px] text-slate-600">
                                {conversation.totalMessages}{" "}
                                {conversation.totalMessages === 1
                                  ? "message"
                                  : "messages"}
                              </p>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {data?.currentUser && (
                  <div className="border-t border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold">
                      {data.currentUser.name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {data.currentUser.role}
                    </p>
                  </div>
                )}
              </aside>

              <section className="min-w-0">
                {newMessageMode ? (
                  <div className="p-5 sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                      <div>
                        <h2 className="text-xl font-bold">
                          New Message / Farriin Cusub
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                          Select an employee to start or open a
                          conversation.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={cancelNewMessage}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>

                    {employees.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-500">
                        No other employees are available.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {employees.map((employee) => {
                          const existingConversation =
                            conversations.some(
                              (conversation) =>
                                conversation.user.id ===
                                employee.id
                            );

                          return (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() =>
                                chooseNewMessageEmployee(
                                  employee.id
                                )
                              }
                              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-700 hover:bg-slate-800"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-emerald-400">
                                {getInitial(employee.name)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">
                                  {employee.name}
                                </p>

                                <p className="truncate text-sm text-slate-500">
                                  {employee.email}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-400">
                                    {employee.role}
                                  </span>

                                  {existingConversation && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                                      Existing conversation
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : activeChatUser ? (
                  <div className="flex min-h-[680px] flex-col">
                    <div className="flex items-center gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400">
                        {getInitial(activeChatUser.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold">
                          {activeChatUser.name}
                        </h2>

                        <p className="truncate text-xs text-slate-500">
                          {activeChatUser.email} ·{" "}
                          {activeChatUser.role}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openNewMessage}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold transition hover:bg-slate-700"
                      >
                        New Chat
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
                      {!selectedConversation ||
                      selectedConversation.messages.length === 0 ? (
                        <div className="flex min-h-[430px] items-center justify-center text-center">
                          <div>
                            <div className="mb-4 text-5xl">
                              👋
                            </div>

                            <h3 className="text-lg font-bold">
                              Start your conversation
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                              Send the first message to{" "}
                              {activeChatUser.name}.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedConversation.messages.map(
                            (message) => {
                              const mine =
                                message.senderId ===
                                data?.currentUser.id;

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    mine
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`group max-w-[85%] sm:max-w-[72%] ${
                                      mine
                                        ? "items-end"
                                        : "items-start"
                                    }`}
                                  >
                                    <div
                                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                                        mine
                                          ? "rounded-br-md bg-emerald-600 text-white"
                                          : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-200"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                        {message.message}
                                      </p>
                                    </div>

                                    <div
                                      className={`mt-1.5 flex items-center gap-2 px-1 ${
                                        mine
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <span className="text-[11px] text-slate-600">
                                        {formatFullDate(
                                          message.createdAt
                                        )}
                                      </span>

                                      {mine && (
                                        <>
                                          <span
                                            className={`text-[11px] ${
                                              message.isRead
                                                ? "text-emerald-400"
                                                : "text-slate-600"
                                            }`}
                                          >
                                            {message.isRead
                                              ? "Read"
                                              : "Sent"}
                                          </span>

                                          <button
                                            type="button"
                                            disabled={
                                              deletingId ===
                                              message.id
                                            }
                                            onClick={() =>
                                              deleteMessage(
                                                message.id
                                              )
                                            }
                                            className="text-[11px] text-slate-600 transition hover:text-red-400 disabled:opacity-50"
                                          >
                                            {deletingId ===
                                            message.id
                                              ? "Deleting..."
                                              : "Delete"}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800 bg-slate-900 p-4 sm:p-5">
                      <form
                        onSubmit={sendMessage}
                        className="flex items-end gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center justify-between">
                            <label
                              htmlFor="chat-message"
                              className="text-xs font-semibold text-slate-500"
                            >
                              Message / Farriinta
                            </label>

                            <span className="text-[11px] text-slate-600">
                              {messageText.length}/5000
                            </span>
                          </div>

                          <textarea
                            id="chat-message"
                            value={messageText}
                            onChange={(event) =>
                              setMessageText(event.target.value)
                            }
                            maxLength={5000}
                            rows={2}
                            placeholder={`Message ${activeChatUser.name}...`}
                            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={
                            sending || !messageText.trim()
                          }
                          className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sending ? "Sending..." : "Send"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[680px] items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                      <div className="mb-5 text-6xl">
                        💬
                      </div>

                      <h2 className="text-2xl font-bold">
                        Messages / Farriimaha
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        Select a conversation from the left or
                        start a new conversation with an
                        employee.
                      </p>

                      <button
                        type="button"
                        onClick={openNewMessage}
                        className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-500"
                      >
                        + New Message
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}