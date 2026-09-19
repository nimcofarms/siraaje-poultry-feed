"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

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

type MessagesResponse = {
  currentUser: UserInfo;
  employees: UserInfo[];
  inbox: Message[];
  sent: Message[];
  unreadCount: number;
};

type Tab = "inbox" | "sent" | "new";

export default function MessagesPage() {
  const [data, setData] = useState<MessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [receiverId, setReceiverId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");

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

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  async function openInboxMessage(message: Message) {
    setSelectedMessage(message);

    if (message.isRead) {
      return;
    }

    try {
      const response = await fetch("/api/messages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to mark message as read."
        );
      }

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          unreadCount: Math.max(
            0,
            current.unreadCount - 1
          ),
          inbox: current.inbox.map((item) =>
            item.id === message.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          ),
        };
      });

      setSelectedMessage((current) =>
        current
          ? {
              ...current,
              isRead: true,
            }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark message as read."
      );
    }
  }

  function openSentMessage(message: Message) {
    setSelectedMessage(message);
  }

  function replyToMessage(message: Message) {
    setReceiverId(message.sender.id);
    setMessageText("");
    setSelectedMessage(null);
    setSuccess("");
    setError("");
    setActiveTab("new");
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!receiverId) {
      setError("Please select an employee.");
      return;
    }

    if (!messageText.trim()) {
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
          message: messageText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to send message."
        );
      }

      setReceiverId("");
      setMessageText("");
      setSuccess("Message sent successfully.");

      await loadMessages();

      setActiveTab("sent");
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

  async function deleteSentMessage(messageId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sent message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(messageId);
      setError("");

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

      setSelectedMessage(null);

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          sent: current.sent.filter(
            (message) => message.id !== messageId
          ),
        };
      });
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

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setSelectedMessage(null);
    setError("");
    setSuccess("");
  }

  const inbox = data?.inbox ?? [];
  const sent = data?.sent ?? [];
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

            <h1 className="text-2xl font-bold sm:text-3xl">
              Messages / Farriimaha
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Send and receive internal messages between employees.
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

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <button
              type="button"
              onClick={() => changeTab("new")}
              className="mb-5 w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-500"
            >
              + New Message
            </button>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => changeTab("inbox")}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-semibold transition ${
                  activeTab === "inbox"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>📥 Inbox</span>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => changeTab("sent")}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-semibold transition ${
                  activeTab === "sent"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>📤 Sent</span>

                <span className="text-xs text-slate-500">
                  {sent.length}
                </span>
              </button>
            </div>

            {data?.currentUser && (
              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Signed in as
                </p>

                <p className="mt-2 font-semibold">
                  {data.currentUser.name}
                </p>

                <p className="text-sm text-slate-400">
                  {data.currentUser.role}
                </p>
              </div>
            )}
          </aside>

          <section className="min-h-[600px] rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            {loading ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

                  <p className="text-slate-400">
                    Loading messages...
                  </p>
                </div>
              </div>
            ) : activeTab === "new" ? (
              <div className="p-5 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">
                    New Message / Farriin Cusub
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Select an employee and write your message.
                  </p>
                </div>

                <form
                  onSubmit={handleSend}
                  className="max-w-3xl space-y-5"
                >
                  <div>
                    <label
                      htmlFor="receiver"
                      className="mb-2 block text-sm font-semibold text-slate-300"
                    >
                      Send To / U Dir
                    </label>

                    <select
                      id="receiver"
                      value={receiverId}
                      onChange={(event) =>
                        setReceiverId(event.target.value)
                      }
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500"
                    >
                      <option value="">
                        Select employee
                      </option>

                      {employees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.name} — {employee.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="message"
                        className="text-sm font-semibold text-slate-300"
                      >
                        Message / Farriinta
                      </label>

                      <span className="text-xs text-slate-500">
                        {messageText.length}/5000
                      </span>
                    </div>

                    <textarea
                      id="message"
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(event.target.value)
                      }
                      maxLength={5000}
                      required
                      rows={10}
                      placeholder="Write your message..."
                      className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending
                        ? "Sending..."
                        : "Send Message"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReceiverId("");
                        setMessageText("");
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-semibold transition hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedMessage ? (
              <div className="p-5 sm:p-7">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="mb-6 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  ← Back to{" "}
                  {activeTab === "inbox"
                    ? "Inbox"
                    : "Sent Messages"}
                </button>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
                  <div className="border-b border-slate-800 pb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          {activeTab === "inbox"
                            ? "From"
                            : "To"}
                        </p>

                        <h2 className="mt-1 text-xl font-bold">
                          {activeTab === "inbox"
                            ? selectedMessage.sender.name
                            : selectedMessage.receiver.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                          {activeTab === "inbox"
                            ? selectedMessage.sender.email
                            : selectedMessage.receiver.email}
                        </p>
                      </div>

                      <div className="text-sm text-slate-500">
                        {formatDate(
                          selectedMessage.createdAt
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-[180px] whitespace-pre-wrap break-words py-6 leading-7 text-slate-200">
                    {selectedMessage.message}
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    {activeTab === "inbox" ? (
                      <button
                        type="button"
                        onClick={() =>
                          replyToMessage(selectedMessage)
                        }
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
                      >
                        ↩ Reply
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          selectedMessage.id
                        }
                        onClick={() =>
                          deleteSentMessage(
                            selectedMessage.id
                          )
                        }
                        className="rounded-xl bg-red-700 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId ===
                        selectedMessage.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === "inbox" ? (
              <div>
                <div className="border-b border-slate-800 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        Inbox
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Messages sent to you.
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-500/15 px-3 py-1.5 text-sm font-bold text-red-400">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>

                {inbox.length === 0 ? (
                  <div className="flex min-h-[400px] items-center justify-center p-6 text-center">
                    <div>
                      <div className="mb-3 text-5xl">
                        📭
                      </div>

                      <h3 className="font-bold">
                        Inbox is empty
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        You have no messages yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {inbox.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() =>
                          openInboxMessage(message)
                        }
                        className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-800/70 ${
                          !message.isRead
                            ? "bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400">
                          {message.sender.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <p
                                className={`truncate ${
                                  !message.isRead
                                    ? "font-bold text-white"
                                    : "font-semibold text-slate-300"
                                }`}
                              >
                                {message.sender.name}
                              </p>

                              {!message.isRead && (
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              )}
                            </div>

                            <p className="shrink-0 text-xs text-slate-500">
                              {formatDate(
                                message.createdAt
                              )}
                            </p>
                          </div>

                          <p
                            className={`mt-2 truncate text-sm ${
                              !message.isRead
                                ? "text-slate-200"
                                : "text-slate-500"
                            }`}
                          >
                            {message.message}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-800 p-5 sm:p-6">
                  <h2 className="text-xl font-bold">
                    Sent Messages
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Messages you have sent to employees.
                  </p>
                </div>

                {sent.length === 0 ? (
                  <div className="flex min-h-[400px] items-center justify-center p-6 text-center">
                    <div>
                      <div className="mb-3 text-5xl">
                        📤
                      </div>

                      <h3 className="font-bold">
                        No sent messages
                      </h3>

                      <button
                        type="button"
                        onClick={() => changeTab("new")}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500"
                      >
                        Send a Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {sent.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() =>
                          openSentMessage(message)
                        }
                        className="flex w-full gap-4 p-5 text-left transition hover:bg-slate-800/70"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-blue-400">
                          {message.receiver.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="truncate font-semibold text-slate-300">
                              To:{" "}
                              {message.receiver.name}
                            </p>

                            <p className="shrink-0 text-xs text-slate-500">
                              {formatDate(
                                message.createdAt
                              )}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <p className="min-w-0 flex-1 truncate text-sm text-slate-500">
                              {message.message}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                                message.isRead
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {message.isRead
                                ? "Read"
                                : "Unread"}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}