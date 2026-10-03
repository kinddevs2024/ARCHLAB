import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthImage } from "../components/AuthImage";
import { Modal } from "../components/Modal";
import { FigmaIcon, Notice } from "../components/Workspace";
import { idOf, downloadFile } from "../api/workspace";
const timeLabel = (value) =>
  value
    ? new Date(value).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
export default function Chat() {
  const { user } = useAuth(),
    { socket, connected, startCall } = useRealtime(),
    [conversations, setConversations] = useState([]),
    [activeId, setActiveId] = useState(null),
    [messages, setMessages] = useState([]),
    [cursor, setCursor] = useState(null),
    [hasMore, setHasMore] = useState(false),
    [text, setText] = useState(""),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [loadingMessages, setLoadingMessages] = useState(false),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(false),
    [title, setTitle] = useState(""),
    [people, setPeople] = useState([]),
    [selected, setSelected] = useState([]),
    [files, setFiles] = useState([]),
    fileRef = useRef(null),
    scroll = useRef(null),
    activeRef = useRef(null),
    bottom = useRef(true);
  activeRef.current = activeId;
  const active = conversations.find((c) => c.id === activeId),
    peer = active?.participants.find((p) => idOf(p) !== user.id),
    name = (p) =>
      [p.name, p.surname].filter(Boolean).join(" ") || p.position || "Xodim";
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/api/chat/conversations");
      setConversations(data.data);
      setError("");
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadMessages = useCallback(async (id, initial = false) => {
    if (initial) {
      setLoadingMessages(true);
      setMessages([]);
    }
    try {
      const { data } = await api.get(`/api/chat/conversations/${id}/messages`);
      if (activeRef.current !== id) return;
      setMessages((current) =>
        initial
          ? data.data
          : [
              ...current,
              ...data.data.filter((m) => !current.some((c) => c.id === m.id)),
            ].map((m) => data.data.find((f) => f.id === m.id) || m),
      );
      if (initial) {
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
      await api.patch(`/api/chat/conversations/${id}/read`);
      if (bottom.current)
        requestAnimationFrame(() =>
          scroll.current?.scrollTo({ top: scroll.current.scrollHeight }),
        );
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      if (activeRef.current === id) setLoadingMessages(false);
    }
  }, []);
  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 30000);
    return () => clearInterval(timer);
  }, [loadConversations]);
  useEffect(() => {
    setText("");
    setFiles([]);
    bottom.current = true;
    if (activeId) loadMessages(activeId, true);
  }, [activeId, loadMessages]);
  useEffect(() => {
    if (!socket) return;
    const change = () => loadConversations(),
      message = ({ conversation }) => {
        loadConversations();
        if (conversation === activeRef.current) loadMessages(conversation);
      },
      read = ({ conversation, user: reader }) => {
        if (conversation === activeRef.current)
          setMessages((ms) =>
            ms.map((m) => ({
              ...m,
              readBy: [...new Set([...(m.readBy || []).map(idOf), reader])],
            })),
          );
      };
    socket.on("chat:changed", change);
    socket.on("chat:message", message);
    socket.on("chat:read", read);
    return () => {
      socket.off("chat:changed", change);
      socket.off("chat:message", message);
      socket.off("chat:read", read);
    };
  }, [socket, loadConversations, loadMessages]);
  const older = async () => {
    setLoadingMessages(true);
    const beforeHeight = scroll.current?.scrollHeight;
    try {
      const { data } = await api.get(
        `/api/chat/conversations/${activeId}/messages`,
        { params: { before: cursor } },
      );
      setMessages((ms) => [
        ...data.data.filter((m) => !ms.some((old) => old.id === m.id)),
        ...ms,
      ]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (scroll.current)
          scroll.current.scrollTop = scroll.current.scrollHeight - beforeHeight;
      });
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoadingMessages(false);
    }
  };
  const newChat = async () => {
    setOpen(true);
    setTitle("");
    setSelected([]);
    try {
      const { data } = await api.get("/api/users/directory");
      setPeople(data.data.filter((p) => p.id !== user.id));
    } catch (e) {
      setError(apiMessage(e));
    }
  };
  const create = async (e) => {
    e.preventDefault();
    if (!selected.length) return;
    setBusy(true);
    try {
      const { data } = await api.post("/api/chat/conversations", {
        title:
          title.trim() ||
          people
            .filter((p) => selected.includes(p.id))
            .map(name)
            .join(", ")
            .slice(0, 120),
        participants: selected,
      });
      setOpen(false);
      await loadConversations();
      setActiveId(data.id);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const send = async (e) => {
    e.preventDefault();
    if (!activeId || (!text.trim() && !files.length) || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/chat/conversations/${activeId}/messages`, {
        text,
        attachments: files.map((f) => f.id),
      });
      setText("");
      setFiles([]);
      bottom.current = true;
      await loadMessages(activeId);
      await loadConversations();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const attach = async (e) => {
    const input = e.target,
      chosen = [...input.files];
    input.value = "";
    if (chosen.length + files.length > 5) {
      setError("Bir xabarga 5 tagacha fayl mumkin");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const file of chosen) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", "chat");
        body.append("entityType", "conversations");
        body.append("entityId", activeId);
        body.append("conversation", activeId);
        const { data } = await api.post("/api/files", body);
        setFiles((current) => [...current, data]);
      }
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`chat-workspace ${activeId ? "chat-active" : ""}`}>
      <aside className="chat-sidebar">
        <div className="chat-search">
          <input
            aria-label="Suhbat qidirish"
            placeholder="Search Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FigmaIcon screen="chat" name="imgSearchNormal" />
        </div>
        <div className="chat-create">
          <button onClick={newChat}>+ Yangi chat</button>
          <span className={connected ? "text-green-600" : "text-gray-400"}>
            {connected ? "Ulangan" : "Aloqa tiklanmoqda"}
          </span>
        </div>
        <Notice loading={loading} />
        <div className="chat-list">
          {conversations
            .filter((c) =>
              `${c.title} ${c.participants.map(name).join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => {
              const other = c.participants.find((p) => idOf(p) !== user.id);
              return (
                <button
                  key={c.id}
                  className={`chat-person ${activeId === c.id ? "selected" : ""}`}
                  onClick={() => {
                    setActiveId(c.id);
                    setConversations((current) =>
                      current.map((v) =>
                        v.id === c.id ? { ...v, unread: 0 } : v,
                      ),
                    );
                  }}
                >
                  <AuthImage src={other?.avatar} alt="" />
                  <span className="chat-preview">
                    <span>
                      <strong>{c.title}</strong>
                      <time>{timeLabel(c.lastMessageAt)}</time>
                    </span>
                    <span>
                      <small>{c.lastMessage || "Xabar yo'q"}</small>
                      {c.unread > 0 && (
                        <b className="chat-unread">{c.unread}</b>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          {!loading && !conversations.length && (
            <p className="p-6 text-gray-500">
              Suhbatni boshlash uchun xodim tanlang.
            </p>
          )}
        </div>
      </aside>
      <section className="chat-conversation">
        {active ? (
          <>
            <header className="chat-heading">
              <button
                className="chat-back icon-button"
                aria-label="Suhbatlar"
                onClick={() => setActiveId(null)}
              >
                <FaArrowLeft />
              </button>
              <AuthImage src={peer?.avatar} alt="" />
              <div>
                <strong>{active.title}</strong>
                <small>
                  <i className={peer?.online ? "online-dot" : "offline-dot"} />
                  {active.participants.length > 2
                    ? `${active.participants.length} ta xodim`
                    : peer?.online
                      ? "Online"
                      : "Offline"}
                </small>
              </div>
              <div className="chat-call-actions">
                <button
                  className="icon-button"
                  disabled={!connected || !peer}
                  aria-label="Audio qo'ng'iroq"
                  onClick={() =>
                    startCall(active.id, idOf(peer), false, name(peer))
                  }
                >
                  <FigmaIcon screen="chat" name="imgVuesaxLinearCall" />
                </button>
                <button
                  className="icon-button"
                  disabled={!connected || !peer}
                  aria-label="Video qo'ng'iroq"
                  onClick={() =>
                    startCall(active.id, idOf(peer), true, name(peer))
                  }
                >
                  <FigmaIcon screen="chat" name="imgVuesaxLinearVideo" />
                </button>
              </div>
            </header>
            <div
              className="chat-messages"
              ref={scroll}
              onScroll={() => {
                bottom.current =
                  scroll.current.scrollHeight -
                    scroll.current.scrollTop -
                    scroll.current.clientHeight <
                  80;
              }}
            >
              {hasMore && (
                <Button
                  variant="secondary"
                  disabled={loadingMessages}
                  onClick={older}
                >
                  Oldingi xabarlar
                </Button>
              )}
              <Notice loading={loadingMessages} />
              {messages.map((m) => {
                const mine = idOf(m.sender) === user.id,
                  read = (m.readBy || []).some((v) => idOf(v) !== user.id);
                return (
                  <article
                    key={m.id}
                    className={`message ${mine ? "mine" : ""}`}
                  >
                    <div className="message-bubble">
                      {active.participants.length > 2 && !mine && (
                        <strong className="block mb-2">{name(m.sender)}</strong>
                      )}
                      {m.text && <p>{m.text}</p>}
                      {m.attachments?.map((f) => (
                        <button
                          key={f.id}
                          className="chat-attachment"
                          onClick={() =>
                            downloadFile(f).catch((e) =>
                              setError(apiMessage(e)),
                            )
                          }
                        >
                          {[".png", ".jpg", ".jpeg", ".webp"].includes(
                            f.extension,
                          ) && (
                            <AuthImage
                              src={`/api/files/${f.id}/download`}
                              alt={f.originalName}
                              className="message-image"
                            />
                          )}
                          {f.originalName}
                          <small>
                            {(f.size / 1024).toFixed(0)} KB · Yuklab olish
                          </small>
                        </button>
                      ))}
                      <footer>
                        <time>{timeLabel(m.createdAt)}</time>
                        {mine && (
                          <span aria-label={read ? "O'qildi" : "Yuborildi"}>
                            <FigmaIcon
                              screen="chat"
                              name={read ? "imgDoneAll1" : "imgDoneAll3"}
                            />
                          </span>
                        )}
                      </footer>
                    </div>
                  </article>
                );
              })}
              {!loadingMessages && !messages.length && (
                <p className="loading-state">Hali xabar yo'q</p>
              )}
            </div>
            <Notice error={error} />
            {files.length > 0 && (
              <div className="chat-files">
                {files.map((f) => (
                  <span key={f.id}>
                    {f.originalName}
                    <button
                      aria-label={`${f.originalName} ni olib tashlash`}
                      onClick={async () => {
                        try {
                          await api.delete(`/api/files/${f.id}`);
                          setFiles((fs) => fs.filter((v) => v.id !== f.id));
                        } catch (e) {
                          setError(apiMessage(e));
                        }
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <form className="chat-composer" onSubmit={send}>
              <button
                type="button"
                className="icon-button"
                disabled={busy}
                aria-label="Fayl biriktirish"
                onClick={() => fileRef.current.click()}
              >
                <FigmaIcon screen="chat" name="imgVuesaxLinearAttachCircle" />
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip,.dwg,.dxf"
                onChange={attach}
              />
              <input
                aria-label="Xabar matni"
                placeholder="Send your message..."
                value={text}
                maxLength={5000}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="chat-send"
                aria-label="Xabar yuborish"
                disabled={busy || (!text.trim() && !files.length)}
              >
                <FigmaIcon screen="chat" name="imgVuesaxBoldSend2" />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <h1>Chat</h1>
            <p>Suhbatni tanlang yoki yangi chat oching.</p>
            <Notice error={error} />
          </div>
        )}
      </section>
      <Modal open={open} title="Yangi chat" onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={create}>
          <Notice error={error} />
          <Input
            label="Chat nomi (ixtiyoriy)"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p>Xodimlarni tanlang</p>
          <div className="participant-list">
            {people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected((ids) =>
                      e.target.checked
                        ? [...ids, p.id]
                        : ids.filter((id) => id !== p.id),
                    )
                  }
                />
                <AuthImage src={p.avatar} alt="" />
                {name(p)}
                <small>{p.position}</small>
              </label>
            ))}
          </div>
          <Button disabled={busy || !selected.length || selected.length > 20}>
            Chat ochish
          </Button>
        </form>
      </Modal>
    </div>
  );
}
