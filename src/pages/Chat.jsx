import { useCallback, useEffect, useState } from "react";
import { FaPaperclip, FaSearch } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const loadConversations = useCallback(async () => {
    const { data } = await api.get("/api/chat/conversations");
    setConversations(data.data);
    if (!active && data.data[0]) setActive(data.data[0]);
  }, [active]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!active) return;
    api.get(`/api/chat/conversations/${active.id}/messages?limit=100`).then(({ data }) => setMessages(data.data));
  }, [active]);

  const createConversation = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const { data } = await api.post("/api/chat/conversations", { title });
    setTitle("");
    setActive(data);
    await loadConversations();
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    await api.post(`/api/chat/conversations/${active.id}/messages`, { text });
    setText("");
    const { data } = await api.get(`/api/chat/conversations/${active.id}/messages?limit=100`);
    setMessages(data.data);
    await loadConversations();
  };

  return (
    <div className="h-[calc(100vh-148px)] overflow-hidden rounded-xl border border-[#e6e9f0] bg-white shadow-sm">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <aside className="border-r border-[#e6e9f0]">
          <div className="border-b border-[#eef1f7] p-4">
            <div className="mb-3 flex items-center rounded-xl border border-[#e6e9f0] px-3 py-2">
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search Name" />
              <FaSearch className="text-[#8e92bc]" />
            </div>
            <form className="flex gap-2" onSubmit={createConversation}>
              <Input placeholder="Yangi chat" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Button type="submit">+</Button>
            </form>
          </div>
          <div className="h-[calc(100%-132px)] overflow-y-auto p-3">
            {conversations.map((item) => (
              <button key={item.id} onClick={() => setActive(item)} className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left ${active?.id === item.id ? "bg-[#faf7f1]" : "hover:bg-[#fbfcff]"}`}>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e6e9f0] font-bold">{item.title.slice(0, 1)}</div>
                <div className="min-w-0">
                  <p className="font-semibold">{item.title}</p>
                  <p className="truncate text-xs text-[#8e92bc]">{item.lastMessage || "Xabar yo'q"}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className="flex min-w-0 flex-col bg-[#f6f8fd]">
          <div className="flex h-[82px] items-center justify-between border-b border-[#e6e9f0] bg-white px-6">
            <div>
              <p className="font-bold">{active?.title || "Chat tanlang"}</p>
              <p className="text-xs text-[#6b7280]">Online</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-6">
            {messages.map((message) => {
              const mine = String(message.sender?._id || message.sender) === user.id;
              return (
                <div key={message.id} className={`max-w-[60%] rounded-xl px-4 py-3 text-sm shadow-sm ${mine ? "ml-auto bg-[#C6A47E] text-white" : "bg-white text-[#20242a]"}`}>
                  {message.text}
                </div>
              );
            })}
          </div>
          <div className="flex h-[82px] items-center gap-3 border-t border-[#e6e9f0] bg-white px-6">
            <FaPaperclip className="text-[#8e92bc]" />
            <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Send your message..." />
            <button onClick={send} className="grid h-11 w-11 place-items-center rounded-xl bg-[#C6A47E] text-white"><IoSend /></button>
          </div>
        </section>
      </div>
    </div>
  );
}
