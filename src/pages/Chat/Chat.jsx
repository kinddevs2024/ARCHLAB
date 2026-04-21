import React, { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

const DIALOGS = [
  { id: 1, name: "Jamshid", preview: "Loyihaning planini yuboring", time: "09:35" },
  { id: 2, name: "Madina", preview: "Bugun uchrashuv bormi?", time: "08:54" },
  { id: 3, name: "Shoxrux", preview: "Render tayyor bo'ldi", time: "Kecha" },
  { id: 4, name: "Dilshod", preview: "Mijoz bilan gaplashdim", time: "Kecha" },
];

const MESSAGES = [
  { id: 1, fromMe: false, text: "Assalomu alaykum, yangi obyekt bo'yicha status bormi?" },
  { id: 2, fromMe: true, text: "Va alaykum assalom, bugun 16:00 gacha update yuboraman." },
  { id: 3, fromMe: false, text: "Zo'r, rahmat. Smeta ham kerak bo'ladi." },
];

export default function Chat() {
  const [activeId, setActiveId] = useState(1);
  const [text, setText] = useState("");

  const activeDialog = useMemo(
    () => DIALOGS.find((dialog) => dialog.id === activeId) ?? DIALOGS[0],
    [activeId]
  );

  return (
    <div className="page-shell h-full">
      <div className="table-card flex h-[calc(100vh-120px)] overflow-hidden">
        <aside className="w-[360px] border-r border-[#e6e9f0] bg-white">
          <div className="border-b border-[#eef1f7] p-4">
            <div className="flex items-center rounded-xl border border-[#e6e9f0] px-3 py-2">
              <input
                type="text"
                placeholder="Qidirish"
                className="w-full bg-transparent text-sm outline-none"
              />
              <FaSearch className="text-gray-500" />
            </div>
          </div>
          <div className="h-[calc(100%-77px)] overflow-y-auto">
            {DIALOGS.map((dialog) => (
              <button
                key={dialog.id}
                onClick={() => setActiveId(dialog.id)}
                className={`flex w-full items-center gap-3 border-b border-[#f2f4f8] px-4 py-3 text-left transition-colors ${
                  dialog.id === activeId ? "bg-[#faf7f1]" : "hover:bg-[#f9fafc]"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eceff5] text-sm font-semibold">
                  {dialog.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#1f2937]">{dialog.name}</p>
                    <span className="text-xs text-[#9aa3b2]">{dialog.time}</span>
                  </div>
                  <p className="truncate text-sm text-[#6b7280]">{dialog.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-1 flex-col bg-[#fbfcff]">
          <div className="flex items-center justify-between border-b border-[#eef1f7] bg-white px-6 py-4">
            <div>
              <p className="font-semibold text-[#1f2937]">{activeDialog.name}</p>
              <p className="text-xs text-[#6b7280]">Online</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-6">
            {MESSAGES.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                  msg.fromMe
                    ? "ml-auto bg-borderlog text-white"
                    : "bg-white text-[#27303f] shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="border-t border-[#eef1f7] bg-white p-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#e6e9f0] px-3 py-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                type="text"
                placeholder="Xabar yozing..."
                className="w-full bg-transparent text-sm outline-none"
              />
              <button className="rounded-lg bg-borderlog p-2 text-white transition-colors hover:bg-[#b28f67]">
                <IoSend />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
